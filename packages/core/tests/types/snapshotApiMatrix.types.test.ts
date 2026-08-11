import { describe, expectTypeOf, it } from "vitest";

import {
  allocatePacked,
  bindController,
  bindObserver,
  defineSpec,
  planLayout,
} from "../../src";

import type { MetersSnapshot, ParamsSnapshot } from "../../src";

describe("snapshot call-shape type matrix", () => {
  const spec = defineSpec(({ param, meter }) => ({
    id: "snapshot-type-matrix",
    params: {
      a: param.f32(),
      b: param.bool(),
      curve: param.f32.array(2),
    },
    meters: {
      x: meter.f32(),
      y: meter.u32(),
      spectrum: meter.f32.array(2),
    },
  }));
  const plan = planLayout(spec);
  const backing = allocatePacked(plan);
  const controller = bindController(spec, plan, backing);
  const observer = bindObserver(spec, plan, backing);

  type ParamSelection = Readonly<{ readonly a: number; readonly b: boolean }>;
  type MeterSelection = Readonly<{ readonly x: number; readonly y: number }>;
  type Empty = Readonly<Record<never, never>>;

  it("infers every controller form exactly", () => {
    expectTypeOf(controller.params.snapshot()).toEqualTypeOf<
      ParamsSnapshot<typeof spec>
    >();
    expectTypeOf(controller.params.snapshot(...([] as const))).toEqualTypeOf<
      ParamsSnapshot<typeof spec>
    >();
    expectTypeOf(
      controller.params.snapshot(["a", "b"]),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(
      controller.params.snapshot("a", "b"),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(
      controller.params.snapshot({ keys: ["a", "b"] }),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(controller.params.snapshot([])).toEqualTypeOf<Empty>();
    expectTypeOf(
      controller.params.snapshot({ keys: [] }),
    ).toEqualTypeOf<Empty>();
    expectTypeOf(
      controller.params.snapshot(["curve"], {
        into: { curve: new Float32Array(2) },
      }),
    ).toEqualTypeOf<Readonly<{ readonly curve: Readonly<Float32Array> }>>();
    expectTypeOf(
      controller.params.snapshot({
        keys: ["curve"],
        into: { curve: new Float32Array(2) },
      }),
    ).toEqualTypeOf<Readonly<{ readonly curve: Readonly<Float32Array> }>>();
    expectTypeOf(
      controller.params.snapshot({
        into: { curve: new Float32Array(2) },
      }),
    ).toEqualTypeOf<ParamsSnapshot<typeof spec>>();

    expectTypeOf(controller.meters.snapshot()).toEqualTypeOf<
      MetersSnapshot<typeof spec>
    >();
    expectTypeOf(controller.meters.snapshot(...([] as const))).toEqualTypeOf<
      MetersSnapshot<typeof spec>
    >();
    expectTypeOf(
      controller.meters.snapshot(["x", "y"]),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(
      controller.meters.snapshot("x", "y"),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(
      controller.meters.snapshot({ keys: ["x", "y"] }),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(controller.meters.snapshot([])).toEqualTypeOf<Empty>();
    expectTypeOf(
      controller.meters.snapshot({ keys: [] }),
    ).toEqualTypeOf<Empty>();
    expectTypeOf(
      controller.meters.snapshot(["spectrum"], {
        into: { spectrum: new Float32Array(2) },
      }),
    ).toEqualTypeOf<Readonly<{ readonly spectrum: Readonly<Float32Array> }>>();
    expectTypeOf(
      controller.meters.snapshot({
        keys: ["spectrum"],
        into: { spectrum: new Float32Array(2) },
      }),
    ).toEqualTypeOf<Readonly<{ readonly spectrum: Readonly<Float32Array> }>>();
    expectTypeOf(
      controller.meters.snapshot({
        into: { spectrum: new Float32Array(2) },
      }),
    ).toEqualTypeOf<MetersSnapshot<typeof spec>>();
  });

  it("infers every observer form exactly and exposes no into option", () => {
    expectTypeOf(observer.params.snapshot()).toEqualTypeOf<
      ParamsSnapshot<typeof spec>
    >();
    expectTypeOf(observer.params.snapshot(...([] as const))).toEqualTypeOf<
      ParamsSnapshot<typeof spec>
    >();
    expectTypeOf(
      observer.params.snapshot(["a", "b"]),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(
      observer.params.snapshot("a", "b"),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(
      observer.params.snapshot({ keys: ["a", "b"] }),
    ).toEqualTypeOf<ParamSelection>();
    expectTypeOf(observer.params.snapshot([])).toEqualTypeOf<Empty>();
    expectTypeOf(observer.params.snapshot({ keys: [] })).toEqualTypeOf<Empty>();

    expectTypeOf(observer.meters.snapshot()).toEqualTypeOf<
      MetersSnapshot<typeof spec>
    >();
    expectTypeOf(observer.meters.snapshot(...([] as const))).toEqualTypeOf<
      MetersSnapshot<typeof spec>
    >();
    expectTypeOf(
      observer.meters.snapshot(["x", "y"]),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(
      observer.meters.snapshot("x", "y"),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(
      observer.meters.snapshot({ keys: ["x", "y"] }),
    ).toEqualTypeOf<MeterSelection>();
    expectTypeOf(observer.meters.snapshot([])).toEqualTypeOf<Empty>();
    expectTypeOf(observer.meters.snapshot({ keys: [] })).toEqualTypeOf<Empty>();

    if (process.env.NODE_ENV === "__types_only__") {
      // @ts-expect-error observer snapshots always own their detached arrays.
      observer.params.snapshot({
        keys: ["curve"],
        into: { curve: new Float32Array(2) },
      });
      // @ts-expect-error observer snapshots always own their detached arrays.
      observer.meters.snapshot({
        keys: ["spectrum"],
        into: { spectrum: new Float32Array(2) },
      });
    }
  });
});
