import { afterEach, describe, expect, it, vi } from "vitest";

import { snapshotWithPolicy } from "../../src/binding/common/coherent";
import * as counters from "../../src/diagnostics/counters";
import { isSeqWireError, type SeqWireError } from "../../src/errors/error";
import * as seqlock from "../../src/primitives/seqlock";

import type { SeqPair } from "../../src/primitives/seqlock";

describe("Snapshot With Policy: Coherent Snapshot & Fallback Strategies", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Minimal SeqPair stub for testing policy wrappers
  const pair: SeqPair = {
    u32: new Uint32Array(2),
    lockIndex: 0,
    seqIndex: 1,
  };

  it("returns the reader value on success without triggering diagnostics", () => {
    const tryReadSpy = vi.spyOn(seqlock, "tryRead");

    tryReadSpy.mockImplementation((_pair, reader) => ({
      ok: true as const,
      value: reader(),
      status: {
        spins: 0,
        retries: 0,
        kind: "ok",
      },
    }));

    const countersSpy = vi.spyOn(counters, "incrementCounter");

    const value = snapshotWithPolicy(
      pair,
      {
        where: "controller.meters.snapshot",
        section: "meters",
        spinBudget: 4,
        retryBudget: 2,
        degrade: "returnLatest",
      },
      () => 42,
      () => {
        throw new Error("Fallback reader should not be invoked on success");
      },
    );

    expect(value).toBe(42);
    expect(tryReadSpy).toHaveBeenCalledTimes(1);
    expect(countersSpy).not.toHaveBeenCalled();
  });

  it('degrades to the fallback reader and records diagnostics under "returnLatest"', () => {
    const tryReadSpy = vi.spyOn(seqlock, "tryRead");

    // Simulate a failed read where budgets were fully consumed
    tryReadSpy.mockImplementation((_pair, _reader) => ({
      ok: false as const,
      status: {
        spins: 5,
        retries: 3,
        kind: "budgetExhausted",
      },
    }));

    const countersSpy = vi.spyOn(counters, "incrementCounter");
    const degradedValue = 1337;

    const result = snapshotWithPolicy(
      pair,
      {
        where: "controller.meters.snapshot",
        section: "meters",
        spinBudget: 4,
        retryBudget: 2,
        degrade: "returnLatest",
      },
      () => {
        throw new Error("Primary reader should not be used when tryRead fails");
      },
      () => degradedValue,
    );

    // Verify fallback value is returned
    expect(result).toBe(degradedValue);

    // Verify diagnostics report the actual exhausted budget plus degradation.
    expect(countersSpy).toHaveBeenCalledTimes(2);
    const counterNames = countersSpy.mock.calls.map((call) => call[0]);
    expect(counterNames).toContain("retryBudgetExhausted");
    expect(counterNames).toContain("degradedSnapshots");

    expect(tryReadSpy).toHaveBeenCalledTimes(1);
  });

  it("throws binding.snapshotRetryExhausted when retries are exhausted without degradation policy", () => {
    const tryReadSpy = vi.spyOn(seqlock, "tryRead");

    tryReadSpy.mockImplementation((_pair, _reader) => ({
      ok: false as const,
      status: {
        spins: 1,
        retries: 0,
        kind: "writerActive",
      },
    }));

    const countersSpy = vi.spyOn(counters, "incrementCounter");
    let thrown: unknown;

    try {
      snapshotWithPolicy(
        pair,
        {
          where: "controller.meters.snapshot",
          section: "meters",
          spinBudget: 1,
          retryBudget: 2,
          // No degrade policy provided
        },
        () => {
          throw new Error(
            "Primary reader should not be used when tryRead fails",
          );
        },
        () => {
          throw new Error(
            "Fallback should not be called without degrade policy",
          );
        },
      );
    } catch (error) {
      thrown = error;
    }

    // Diagnostics should still record the specific exhaustion event
    expect(countersSpy).toHaveBeenCalledTimes(1);
    expect(countersSpy).toHaveBeenCalledWith("spinBudgetExhausted");

    // Verify error structure
    if (!isSeqWireError(thrown)) {
      throw new Error("Expected snapshotWithPolicy to throw a SeqWireError");
    }

    const err = thrown as SeqWireError<"binding.snapshotRetryExhausted">;
    expect(err.code).toBe("binding.snapshotRetryExhausted");
    expect(err.details.where).toBe("controller.meters.snapshot");
    expect(err.details.section).toBe("meters");

    expect(err.details.spins ?? 0).toBeGreaterThanOrEqual(0);
    expect(err.details.retries ?? 0).toBeGreaterThanOrEqual(0);

    expect(tryReadSpy).toHaveBeenCalledTimes(1);
  });

  it("invokes only the explicit fallback on a writer-active degraded read", () => {
    const activePair: SeqPair = {
      u32: new Uint32Array(new SharedArrayBuffer(8)),
      lockIndex: 0,
      seqIndex: 1,
    };
    Atomics.store(activePair.u32, activePair.lockIndex, 1);
    const reader = vi.fn(() => 1);
    const fallback = vi.fn(() => 2);

    const value = snapshotWithPolicy(
      activePair,
      {
        where: "observer.params.snapshot",
        section: "params",
        spinBudget: 1,
        retryBudget: 0,
        degrade: "returnLatest",
      },
      reader,
      fallback,
    );

    expect(value).toBe(2);
    expect(reader).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("invokes neither reader nor fallback on a writer-active strict read", () => {
    const activePair: SeqPair = {
      u32: new Uint32Array(new SharedArrayBuffer(8)),
      lockIndex: 0,
      seqIndex: 1,
    };
    Atomics.store(activePair.u32, activePair.lockIndex, 1);
    const reader = vi.fn(() => 1);
    const fallback = vi.fn(() => 2);

    let thrown: unknown;
    try {
      snapshotWithPolicy(
        activePair,
        {
          where: "observer.params.snapshot",
          section: "params",
          spinBudget: 1,
          retryBudget: 0,
          degrade: "throw",
        },
        reader,
        fallback,
      );
    } catch (error) {
      thrown = error;
    }
    expect(isSeqWireError(thrown)).toBe(true);
    if (!isSeqWireError(thrown)) {
      throw new Error("Expected strict snapshot failure");
    }
    expect(thrown.code).toBe("binding.snapshotRetryExhausted");
    expect(reader).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });
});
