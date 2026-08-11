import { describe, expect, it } from "vitest";

import {
  allocatePacked,
  bindController,
  bindObserver,
  bindProcessor,
  buildHandoff,
  defineSpec,
  isSeqWireError,
  planLayout,
} from "../../src";
import { mapViews } from "../../src/backing/map-views";

function setupFailureContract() {
  const spec = defineSpec(({ param, meter }) => ({
    id: "write-callback-failure",
    params: {
      curve: param.f32.array(3),
    },
    meters: {
      runtime: {
        level: meter.f32(),
        spectrum: meter.f32.array(3),
      },
    },
  }));
  const plan = planLayout(spec);
  const backing = allocatePacked(plan);
  const controller = bindController(spec, plan, backing);
  const processor = bindProcessor(buildHandoff(plan, backing));
  const observer = bindObserver(spec, plan, backing, { degrade: "throw" });
  const mapped = mapViews(plan, backing);

  return { controller, mapped, observer, plan, processor };
}

function expectErrorCode(callback: () => unknown, code: string): void {
  let thrown: unknown;
  try {
    callback();
  } catch (error) {
    thrown = error;
  }
  expect(isSeqWireError(thrown)).toBe(true);
  if (!isSeqWireError(thrown)) {
    throw new Error(`Expected SeqWireError ${code}`);
  }
  expect(thrown.code).toBe(code);
}

describe("binding write callback failure contract", () => {
  it("leaves validation failures outside publish state-neutral", () => {
    const { controller, mapped, plan, processor } = setupFailureContract();
    const puBefore = controller.params.version();
    const muBefore = processor.meters.version();

    expectErrorCode(() => {
      controller.params.stage("missing" as never, () => undefined);
    }, "binding.unknownKey");
    expect(controller.params.version()).toBe(puBefore);
    expect(Atomics.load(mapped.locks.PU, plan.locks.PU.lock) & 1).toBe(0);

    expectErrorCode(() => {
      processor.meters.publishGroup("missing" as never, {} as never);
    }, "binding.unknownKey");
    expect(processor.meters.version()).toBe(muBefore);
    expect(Atomics.load(mapped.locks.MU, plan.locks.MU.lock) & 1).toBe(0);
  });

  it("makes a throwing controller stage non-transactional and restores parity", () => {
    const { controller, mapped, observer, plan, processor } =
      setupFailureContract();
    const versionBefore = controller.params.version();

    expect(() => {
      controller.params.stage("curve", (destination) => {
        destination[0] = 7;
        throw new Error("controller stage failed");
      });
    }).toThrow("controller stage failed");

    expect(controller.params.version()).toBe(versionBefore + 1);
    expect(Atomics.load(mapped.locks.PU, plan.locks.PU.lock) & 1).toBe(0);
    expect(controller.params.snapshot("curve").curve[0]).toBe(7);

    let processorRead = false;
    processor.params.within((view) => {
      processorRead = true;
      expect(view.curve[0]).toBe(7);
    });
    expect(processorRead).toBe(true);
    expect(observer.params.snapshot("curve").curve[0]).toBe(7);
  });

  it("makes a throwing meter publish non-transactional and restores parity", () => {
    const { controller, mapped, observer, plan, processor } =
      setupFailureContract();
    const versionBefore = processor.meters.version();

    expect(() => {
      processor.meters.publish((writer) => {
        writer.set("runtime.level", 0.75);
        writer.stage("runtime.spectrum", (destination) => {
          destination[0] = 3;
          throw new Error("meter publish failed");
        });
      });
    }).toThrow("meter publish failed");

    expect(processor.meters.version()).toBe(versionBefore + 1);
    expect(Atomics.load(mapped.locks.MU, plan.locks.MU.lock) & 1).toBe(0);
    expect(controller.meters.snapshot("runtime.level")["runtime.level"]).toBe(
      0.75,
    );
    expect(
      observer.meters.snapshot("runtime.spectrum")["runtime.spectrum"][0],
    ).toBe(3);

    processor.meters.publish((writer) => {
      writer["runtime.level"](0.25);
    });
    expect(observer.meters.snapshot("runtime.level")["runtime.level"]).toBe(
      0.25,
    );
  });
});
