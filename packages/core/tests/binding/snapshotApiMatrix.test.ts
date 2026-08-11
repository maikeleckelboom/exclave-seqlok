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
import { normalizeSnapshotSelection } from "../../src/binding/common/snapshot-util";

function setupSnapshotMatrix() {
  const spec = defineSpec(({ param, meter }) => ({
    id: "snapshot-api-matrix",
    params: {
      rate: param.f32({ min: 0, max: 4 }),
      enabled: param.bool(),
      curve: param.f32.array(3),
    },
    meters: {
      level: meter.f32(),
      frames: meter.u32(),
      spectrum: meter.f32.array(3),
    },
  }));
  const plan = planLayout(spec);
  const backing = allocatePacked(plan);
  const controller = bindController(spec, plan, backing);
  const processor = bindProcessor(buildHandoff(plan, backing));
  const observer = bindObserver(spec, plan, backing, { degrade: "throw" });

  controller.params.update({ rate: 2, enabled: true });
  controller.params.stage("curve", (destination) => {
    destination.set([1, 2, 3]);
  });
  processor.meters.publish((writer) => {
    writer.level(0.5);
    writer.frames(128);
    writer.stage("spectrum", (destination) => {
      destination.set([4, 5, 6]);
    });
  });

  return { controller, observer, processor };
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

describe("shared snapshot selection normalization", () => {
  it("distinguishes omitted, empty, array, varargs, and object selections", () => {
    expect(normalizeSnapshotSelection([])).toEqual({
      keys: undefined,
      options: undefined,
    });
    expect(normalizeSnapshotSelection([[]])).toEqual({
      keys: [],
      options: undefined,
    });
    expect(normalizeSnapshotSelection([["rate", "enabled"]])).toEqual({
      keys: ["rate", "enabled"],
      options: undefined,
    });
    expect(normalizeSnapshotSelection(["rate", "enabled"])).toEqual({
      keys: ["rate", "enabled"],
      options: undefined,
    });

    const objectSelection = { keys: ["rate", "enabled"] };
    expect(normalizeSnapshotSelection([objectSelection])).toEqual({
      keys: objectSelection.keys,
      options: objectSelection,
    });
  });
});

describe("snapshot runtime call-shape matrix", () => {
  it("keeps controller param selections equivalent and exact", () => {
    const { controller } = setupSnapshotMatrix();
    const expected = { rate: 2, enabled: true };

    expect(controller.params.snapshot(["rate", "enabled"])).toEqual(expected);
    expect(controller.params.snapshot("rate", "enabled")).toEqual(expected);
    expect(controller.params.snapshot({ keys: ["rate", "enabled"] })).toEqual(
      expected,
    );
    expect(Object.keys(controller.params.snapshot("rate", "enabled"))).toEqual([
      "rate",
      "enabled",
    ]);
    expect(Object.keys(controller.params.snapshot())).toEqual([
      "curve",
      "enabled",
      "rate",
    ]);
  });

  it("keeps controller meter selections equivalent and exact", () => {
    const { controller } = setupSnapshotMatrix();
    const expected = { level: 0.5, frames: 128 };

    expect(controller.meters.snapshot(["level", "frames"])).toEqual(expected);
    expect(controller.meters.snapshot("level", "frames")).toEqual(expected);
    expect(controller.meters.snapshot({ keys: ["level", "frames"] })).toEqual(
      expected,
    );
    expect(Object.keys(controller.meters.snapshot("level", "frames"))).toEqual([
      "level",
      "frames",
    ]);
    expect(Object.keys(controller.meters.snapshot())).toEqual([
      "frames",
      "level",
      "spectrum",
    ]);
  });

  it("keeps observer param selections equivalent and exact", () => {
    const { observer } = setupSnapshotMatrix();
    const expected = { rate: 2, enabled: true };

    expect(observer.params.snapshot(["rate", "enabled"])).toEqual(expected);
    expect(observer.params.snapshot("rate", "enabled")).toEqual(expected);
    expect(observer.params.snapshot({ keys: ["rate", "enabled"] })).toEqual(
      expected,
    );
    expect(Object.keys(observer.params.snapshot("rate", "enabled"))).toEqual([
      "rate",
      "enabled",
    ]);
    expect(Object.keys(observer.params.snapshot())).toEqual([
      "curve",
      "enabled",
      "rate",
    ]);
  });

  it("keeps observer meter selections equivalent and exact", () => {
    const { observer } = setupSnapshotMatrix();
    const expected = { level: 0.5, frames: 128 };

    expect(observer.meters.snapshot(["level", "frames"])).toEqual(expected);
    expect(observer.meters.snapshot("level", "frames")).toEqual(expected);
    expect(observer.meters.snapshot({ keys: ["level", "frames"] })).toEqual(
      expected,
    );
    expect(Object.keys(observer.meters.snapshot("level", "frames"))).toEqual([
      "level",
      "frames",
    ]);
    expect(Object.keys(observer.meters.snapshot())).toEqual([
      "frames",
      "level",
      "spectrum",
    ]);
  });

  it("treats every explicit empty selection as empty", () => {
    const { controller, observer } = setupSnapshotMatrix();

    expect(controller.params.snapshot([])).toEqual({});
    expect(controller.params.snapshot({ keys: [] })).toEqual({});
    expect(controller.meters.snapshot([])).toEqual({});
    expect(controller.meters.snapshot({ keys: [] })).toEqual({});
    expect(observer.params.snapshot([])).toEqual({});
    expect(observer.params.snapshot({ keys: [] })).toEqual({});
    expect(observer.meters.snapshot([])).toEqual({});
    expect(observer.meters.snapshot({ keys: [] })).toEqual({});
  });

  it("reuses controller destinations in array, object, and full forms", () => {
    const { controller } = setupSnapshotMatrix();
    const paramArrayInto = new Float32Array(3);
    const paramObjectInto = new Float32Array(3);
    const paramFullInto = new Float32Array(3);
    const meterArrayInto = new Float32Array(3);
    const meterObjectInto = new Float32Array(3);
    const meterFullInto = new Float32Array(3);

    expect(
      controller.params.snapshot(["curve"], {
        into: { curve: paramArrayInto },
      }).curve,
    ).toBe(paramArrayInto);
    expect(
      controller.params.snapshot({
        keys: ["curve"],
        into: { curve: paramObjectInto },
      }).curve,
    ).toBe(paramObjectInto);
    expect(
      controller.params.snapshot({ into: { curve: paramFullInto } }).curve,
    ).toBe(paramFullInto);

    expect(
      controller.meters.snapshot(["spectrum"], {
        into: { spectrum: meterArrayInto },
      }).spectrum,
    ).toBe(meterArrayInto);
    expect(
      controller.meters.snapshot({
        keys: ["spectrum"],
        into: { spectrum: meterObjectInto },
      }).spectrum,
    ).toBe(meterObjectInto);
    expect(
      controller.meters.snapshot({ into: { spectrum: meterFullInto } })
        .spectrum,
    ).toBe(meterFullInto);
  });

  it("rejects unknown keys on every snapshot surface", () => {
    const { controller, observer } = setupSnapshotMatrix();
    const calls = [
      () => controller.params.snapshot(["unknown" as never]),
      () => controller.params.snapshot("unknown" as never),
      () => controller.params.snapshot({ keys: ["unknown" as never] }),
      () => controller.meters.snapshot(["unknown" as never]),
      () => controller.meters.snapshot("unknown" as never),
      () => controller.meters.snapshot({ keys: ["unknown" as never] }),
      () => observer.params.snapshot(["unknown" as never]),
      () => observer.params.snapshot("unknown" as never),
      () => observer.params.snapshot({ keys: ["unknown" as never] }),
      () => observer.meters.snapshot(["unknown" as never]),
      () => observer.meters.snapshot("unknown" as never),
      () => observer.meters.snapshot({ keys: ["unknown" as never] }),
    ];

    for (const call of calls) {
      expectErrorCode(call, "binding.unknownKey");
    }
  });

  it("returns detached observer arrays", () => {
    const { controller, observer, processor } = setupSnapshotMatrix();
    const paramsBefore = observer.params.snapshot("curve");
    const metersBefore = observer.meters.snapshot("spectrum");

    controller.params.stage("curve", (destination) => destination.fill(9));
    processor.meters.publish((writer) => {
      writer.stage("spectrum", (destination) => destination.fill(8));
    });

    expect(Array.from(paramsBefore.curve)).toEqual([1, 2, 3]);
    expect(Array.from(metersBefore.spectrum)).toEqual([4, 5, 6]);
    expect(observer.params.snapshot("curve").curve).not.toBe(
      paramsBefore.curve,
    );
    expect(observer.meters.snapshot("spectrum").spectrum).not.toBe(
      metersBefore.spectrum,
    );
  });
});

describe("observer params within contract", () => {
  it("exposes canonical flat keys and detached arrays for nested authored specs", () => {
    const spec = defineSpec(({ param }) => ({
      id: "observer-within-nested",
      params: {
        transport: {
          rate: param.f32({ min: 0, max: 4 }),
          curve: param.f32.array(2),
        },
      },
    }));
    const plan = planLayout(spec);
    const backing = allocatePacked(plan);
    const controller = bindController(spec, plan, backing);
    const observer = bindObserver(spec, plan, backing, { degrade: "throw" });

    controller.params.set("transport.rate", 2);
    controller.params.stage("transport.curve", (destination) => {
      destination.set([1, 2]);
    });

    let retainedCurve: Readonly<Float32Array> | undefined;
    observer.params.within((view) => {
      expect(Object.keys(view)).toEqual(["transport.curve", "transport.rate"]);
      expect(view["transport.rate"]).toBe(2);
      expect(Array.from(view["transport.curve"])).toEqual([1, 2]);
      expect("transport" in view).toBe(false);
      retainedCurve = view["transport.curve"];
    });

    controller.params.stage("transport.curve", (destination) => {
      destination.fill(9);
    });
    expect(Array.from(retainedCurve ?? [])).toEqual([1, 2]);
  });
});
