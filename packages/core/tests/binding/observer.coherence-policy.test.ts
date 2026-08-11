import { describe, expect, it, vi } from "vitest";

import {
  allocatePacked,
  bindController,
  bindObserver,
  bindProcessor,
  defineSpec,
  planLayout,
} from "../../src";
import { mapViews } from "../../src/backing/map-views";

describe("observer coherence policy", () => {
  const spec = defineSpec(({ param, meter }) => ({
    id: "observer/coherence-policy",
    params: {
      value: param.f32(),
      curve: param.f32.array(2),
    },
    meters: {
      level: meter.f32(),
      spectrum: meter.f32.array(2),
    },
  }));

  it("isolates verified param results and degraded fallbacks from the cache", () => {
    const plan = planLayout(spec);
    const backing = allocatePacked(plan);
    const mapped = mapViews(plan, backing);
    const controller = bindController(spec, plan, backing);
    const observer = bindObserver(spec, plan, backing, {
      spinBudget: 0,
      retryBudget: 0,
    });

    controller.params.hydrate({
      value: 1,
      curve: new Float32Array([1, 2]),
    });
    const verified = observer.params.snapshot();
    expect(verified.value).toBe(1);
    expect(Array.from(verified.curve)).toEqual([1, 2]);

    verified.curve.fill(999);
    (verified as { value: number }).value = 999;

    controller.params.hydrate({
      value: 2,
      curve: new Float32Array([3, 4]),
    });

    Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    try {
      const firstFallback = observer.params.snapshot();
      expect(firstFallback).not.toBe(verified);
      expect(firstFallback.curve).not.toBe(verified.curve);
      expect(firstFallback.value).toBe(1);
      expect(Array.from(firstFallback.curve)).toEqual([1, 2]);

      firstFallback.curve.fill(888);
      (firstFallback as { value: number }).value = 888;

      const secondFallback = observer.params.snapshot();
      expect(secondFallback).not.toBe(firstFallback);
      expect(secondFallback.curve).not.toBe(firstFallback.curve);
      expect(secondFallback.value).toBe(1);
      expect(Array.from(secondFallback.curve)).toEqual([1, 2]);

      // Partial reads do not use the complete-snapshot cache.
      expect(observer.params.snapshot("value")).toEqual({ value: 2 });
      expect(observer.params.snapshot([])).toEqual({});

      const callback = vi.fn();
      expect(() => {
        observer.params.within(callback);
      }).toThrow(/coherent read retries exhausted/i);
      expect(callback).not.toHaveBeenCalled();
    } finally {
      Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    }

    controller.params.hydrate({
      value: 3,
      curve: new Float32Array([5, 6]),
    });
    const replacement = observer.params.snapshot();
    expect(replacement.value).toBe(3);
    expect(Array.from(replacement.curve)).toEqual([5, 6]);

    controller.params.hydrate({
      value: 4,
      curve: new Float32Array([7, 8]),
    });

    Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    try {
      const replacementFallback = observer.params.snapshot();
      expect(replacementFallback).not.toBe(replacement);
      expect(replacementFallback.curve).not.toBe(replacement.curve);
      expect(replacementFallback.value).toBe(3);
      expect(Array.from(replacementFallback.curve)).toEqual([5, 6]);
    } finally {
      Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
      observer.dispose();
      controller.dispose();
    }
  });

  it("isolates verified meter results and degraded fallbacks from the cache", () => {
    const plan = planLayout(spec);
    const backing = allocatePacked(plan);
    const mapped = mapViews(plan, backing);
    const processor = bindProcessor(plan, backing);
    const observer = bindObserver(spec, plan, backing, {
      spinBudget: 0,
      retryBudget: 0,
    });

    processor.meters.publish((meters) => {
      meters.level(1);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([1, 2]);
      });
    });
    const verified = observer.meters.snapshot();
    expect(verified.level).toBe(1);
    expect(Array.from(verified.spectrum)).toEqual([1, 2]);

    verified.spectrum.fill(999);
    (verified as { level: number }).level = 999;

    processor.meters.publish((meters) => {
      meters.level(2);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([3, 4]);
      });
    });

    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    try {
      const firstFallback = observer.meters.snapshot();
      expect(firstFallback).not.toBe(verified);
      expect(firstFallback.spectrum).not.toBe(verified.spectrum);
      expect(firstFallback.level).toBe(1);
      expect(Array.from(firstFallback.spectrum)).toEqual([1, 2]);

      firstFallback.spectrum.fill(888);
      (firstFallback as { level: number }).level = 888;

      const secondFallback = observer.meters.snapshot();
      expect(secondFallback).not.toBe(firstFallback);
      expect(secondFallback.spectrum).not.toBe(firstFallback.spectrum);
      expect(secondFallback.level).toBe(1);
      expect(Array.from(secondFallback.spectrum)).toEqual([1, 2]);

      // Partial reads do not use the complete-snapshot cache.
      expect(observer.meters.snapshot("level")).toEqual({ level: 2 });
      expect(observer.meters.snapshot([])).toEqual({});
    } finally {
      Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    }

    processor.meters.publish((meters) => {
      meters.level(3);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([5, 6]);
      });
    });
    const replacement = observer.meters.snapshot();
    expect(replacement.level).toBe(3);
    expect(Array.from(replacement.spectrum)).toEqual([5, 6]);

    processor.meters.publish((meters) => {
      meters.level(4);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([7, 8]);
      });
    });

    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    try {
      const replacementFallback = observer.meters.snapshot();
      expect(replacementFallback).not.toBe(replacement);
      expect(replacementFallback.spectrum).not.toBe(replacement.spectrum);
      expect(replacementFallback.level).toBe(3);
      expect(Array.from(replacementFallback.spectrum)).toEqual([5, 6]);
    } finally {
      Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
      observer.dispose();
      processor.dispose();
    }
  });

  it("does not cache direct unverified param or meter fallbacks", () => {
    const plan = planLayout(spec);
    const backing = allocatePacked(plan);
    const mapped = mapViews(plan, backing);
    const controller = bindController(spec, plan, backing);
    const processor = bindProcessor(plan, backing);
    const observer = bindObserver(spec, plan, backing, {
      spinBudget: 0,
      retryBudget: 0,
    });

    controller.params.hydrate({
      value: 1,
      curve: new Float32Array([1, 2]),
    });
    processor.meters.publish((meters) => {
      meters.level(1);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([1, 2]);
      });
    });

    Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    const { firstParams, firstMeters } = (() => {
      try {
        return {
          firstParams: observer.params.snapshot(),
          firstMeters: observer.meters.snapshot(),
        };
      } finally {
        Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
        Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
      }
    })();

    firstParams.curve.fill(999);
    (firstParams as { value: number }).value = 999;
    firstMeters.spectrum.fill(999);
    (firstMeters as { level: number }).level = 999;

    controller.params.hydrate({
      value: 2,
      curve: new Float32Array([3, 4]),
    });
    processor.meters.publish((meters) => {
      meters.level(2);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([3, 4]);
      });
    });

    Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    try {
      const secondParams = observer.params.snapshot();
      const secondMeters = observer.meters.snapshot();

      expect(secondParams).not.toBe(firstParams);
      expect(secondParams.curve).not.toBe(firstParams.curve);
      expect(secondParams.value).toBe(2);
      expect(Array.from(secondParams.curve)).toEqual([3, 4]);

      expect(secondMeters).not.toBe(firstMeters);
      expect(secondMeters.spectrum).not.toBe(firstMeters.spectrum);
      expect(secondMeters.level).toBe(2);
      expect(Array.from(secondMeters.spectrum)).toEqual([3, 4]);
    } finally {
      Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
      Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
      observer.dispose();
      processor.dispose();
      controller.dispose();
    }
  });

  it("throws instead of returning an unverified snapshot under strict policy", () => {
    const plan = planLayout(spec);
    const backing = allocatePacked(plan);
    const mapped = mapViews(plan, backing);
    const observer = bindObserver(spec, plan, backing, {
      spinBudget: 0,
      retryBudget: 0,
      degrade: "throw",
    });

    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    try {
      expect(() => observer.meters.snapshot()).toThrow(
        /snapshot retries exhausted/i,
      );
    } finally {
      Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
      observer.dispose();
    }
  });
});
