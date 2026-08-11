import { describe, expectTypeOf, it } from "vitest";

import { defineSpec } from "../../src";

import type {
  MeterValues,
  MetersSnapshot,
  ObserverParams,
  ParamValues,
  ParamsSnapshot,
  ProcessorMeterView,
  ProcessorMeters,
  ProcessorParamView,
  ProcessorParams,
  SnapshotDegradePolicy,
  SnapshotMetersObject,
  SnapshotMetersOf,
  SnapshotOf,
  SnapshotParamsObject,
} from "../../src";

describe("public convenience type equality", () => {
  const _spec = defineSpec(({ param, meter }) => ({
    id: "public-convenience-types",
    params: {
      transport: {
        rate: param.f32(),
        curve: param.f32.array(2),
      },
    },
    meters: {
      runtime: {
        level: meter.f32(),
        spectrum: meter.f32.array(2),
      },
    },
  }));

  it("makes full and selected value aliases equal to snapshot contracts", () => {
    expectTypeOf<ParamValues<typeof _spec>>().toEqualTypeOf<
      ParamsSnapshot<typeof _spec>
    >();
    expectTypeOf<MeterValues<typeof _spec>>().toEqualTypeOf<
      MetersSnapshot<typeof _spec>
    >();
    expectTypeOf<SnapshotOf<typeof _spec>>().toEqualTypeOf<
      ParamsSnapshot<typeof _spec>
    >();
    expectTypeOf<SnapshotMetersOf<typeof _spec>>().toEqualTypeOf<
      MetersSnapshot<typeof _spec>
    >();
    expectTypeOf<
      SnapshotOf<typeof _spec, readonly ["transport.rate"]>
    >().toEqualTypeOf<
      SnapshotParamsObject<typeof _spec, readonly ["transport.rate"]>
    >();
    expectTypeOf<
      SnapshotMetersOf<typeof _spec, readonly ["runtime.level"]>
    >().toEqualTypeOf<
      SnapshotMetersObject<typeof _spec, readonly ["runtime.level"]>
    >();
    expectTypeOf<
      SnapshotMetersOf<
        typeof _spec,
        readonly ["runtime.level"]
      >["runtime.level"]
    >().toEqualTypeOf<number>();
  });

  it("makes processor aliases equal to their callback contracts", () => {
    type WithinCallback = Parameters<
      ProcessorParams<typeof _spec>["within"]
    >[0];
    type WithinView = WithinCallback extends (view: infer V) => void
      ? V
      : never;
    type PublishCallback = Parameters<
      ProcessorMeters<typeof _spec>["publish"]
    >[0];
    type PublishView = PublishCallback extends (view: infer V) => unknown
      ? V
      : never;

    expectTypeOf<
      ProcessorParamView<typeof _spec>
    >().toEqualTypeOf<WithinView>();
    expectTypeOf<
      ProcessorMeterView<typeof _spec>
    >().toEqualTypeOf<PublishView>();
  });

  it("types observer within as the canonical detached snapshot shape", () => {
    type Callback = Parameters<ObserverParams<typeof _spec>["within"]>[0];
    type View = Callback extends (view: infer V) => void ? V : never;

    expectTypeOf<View>().toEqualTypeOf<ParamsSnapshot<typeof _spec>>();
    expectTypeOf<View["transport.curve"]>().toEqualTypeOf<
      Readonly<Float32Array>
    >();
    expectTypeOf<
      "transport" extends keyof View ? true : false
    >().toEqualTypeOf<false>();
  });

  it("exports role-neutral observer degradation naming", () => {
    expectTypeOf<SnapshotDegradePolicy>().toEqualTypeOf<
      "returnLatest" | "throw"
    >();
  });
});
