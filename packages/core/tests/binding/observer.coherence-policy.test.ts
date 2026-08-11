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

  it("caches only verified complete param snapshots with detached arrays", () => {
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

    controller.params.hydrate({
      value: 2,
      curve: new Float32Array([3, 4]),
    });

    Atomics.add(mapped.locks.PU, plan.locks.PU.lock, 1);
    try {
      const fallback = observer.params.snapshot();
      expect(fallback.value).toBe(1);
      expect(Array.from(fallback.curve)).toEqual([1, 2]);

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
      observer.dispose();
      controller.dispose();
    }
  });

  it("caches only verified complete meter snapshots with detached arrays", () => {
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

    processor.meters.publish((meters) => {
      meters.level(2);
      meters.stage("spectrum", (spectrum) => {
        spectrum.set([3, 4]);
      });
    });

    Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
    try {
      const fallback = observer.meters.snapshot();
      expect(fallback.level).toBe(1);
      expect(Array.from(fallback.spectrum)).toEqual([1, 2]);

      // Partial reads do not use the complete-snapshot cache.
      expect(observer.meters.snapshot("level")).toEqual({ level: 2 });
      expect(observer.meters.snapshot([])).toEqual({});
    } finally {
      Atomics.add(mapped.locks.MU, plan.locks.MU.lock, 1);
      observer.dispose();
      processor.dispose();
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
