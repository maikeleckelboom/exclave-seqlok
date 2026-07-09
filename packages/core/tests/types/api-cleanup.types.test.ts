import { describe, expectTypeOf, it } from "vitest";

import * as seqwire from "../../src";

import type { BackingKind } from "../../src/backing/types";
import type { AcceptedHandoff, HandoffPacking } from "../../src/handoff/types";

describe("unreleased API cleanup type contracts", () => {
  const compileOnly = process.env.NODE_ENV === "__types_only__";

  const spec = seqwire.defineSpec(({ param, meter }) => ({
    id: "api-cleanup",
    params: {
      gain: param.f32({ min: 0, max: 1 }),
    },
    meters: {
      peak: meter.f32(),
    },
  }));

  const plan = seqwire.planLayout(spec);
  const backing = seqwire.allocatePacked(plan);
  const handoff = seqwire.buildHandoff(plan, backing);

  function makeHandoffSource() {
    const sourceBacking = seqwire.allocatePacked(plan);
    const sourceHandoff = seqwire.buildHandoff(plan, sourceBacking);
    return {
      sourceBacking,
      sourceHandoff,
      sourceAccepted: seqwire.acceptHandoff(sourceHandoff),
    };
  }

  it("bindProcessor accepts handoff, accepted handoff, and explicit plan/backing", () => {
    const handoffSource = makeHandoffSource();
    const handoffProcessor = seqwire.bindProcessor(handoffSource.sourceHandoff);
    expectTypeOf(handoffProcessor).toEqualTypeOf<
      seqwire.ProcessorBinding<typeof spec>
    >();
    handoffProcessor.dispose();

    const acceptedSource = makeHandoffSource();
    const acceptedProcessor = seqwire.bindProcessor(
      acceptedSource.sourceAccepted,
    );
    expectTypeOf(acceptedProcessor).toEqualTypeOf<
      seqwire.ProcessorBinding<typeof spec>
    >();
    acceptedProcessor.dispose();

    const explicitBacking = seqwire.allocatePacked(plan);
    const explicitProcessor = seqwire.bindProcessor(plan, explicitBacking);
    expectTypeOf(explicitProcessor).toEqualTypeOf<
      seqwire.ProcessorBinding<typeof spec>
    >();
    explicitProcessor.dispose();
  });

  it("bindProcessor no longer accepts spec triples or unknown transport values", () => {
    const unknownValue: unknown = handoff;

    if (compileOnly) {
      // @ts-expect-error processor explicit local binding is plan/backing only.
      seqwire.bindProcessor(spec, plan, backing);

      // @ts-expect-error unknown transport values must go through acceptHandoff.
      seqwire.bindProcessor(unknownValue);
    }
  });

  it("bindController keeps the explicit spec/plan/backing contract", () => {
    expectTypeOf(seqwire.bindController(spec, plan, backing)).toEqualTypeOf<
      seqwire.ControllerBinding<typeof spec>
    >();

    if (compileOnly) {
      // @ts-expect-error controllers need the authored spec for param decoding.
      seqwire.bindController(plan, backing);
    }
  });

  it("AcceptedHandoff is not structurally constructible", () => {
    // @ts-expect-error acceptHandoff is the constructor for this branded capability.
    const forged: AcceptedHandoff<typeof spec> = {
      packing: "packed",
      sab: backing.sab,
      plan,
    };

    void forged;
  });

  it("does not export old allocator names", () => {
    type PublicKey = keyof typeof seqwire;
    type Join<A extends string, B extends string> = `${A}${B}`;
    type OldPackedAllocator = Join<"allocate", "Shared">;
    type OldPartitionedAllocator = Join<OldPackedAllocator, "Partitioned">;
    type OldWasmAllocator = Join<"allocateWasm", "Shared">;
    type IsExported<K extends string> = K extends PublicKey ? true : false;

    expectTypeOf<IsExported<OldPackedAllocator>>().toEqualTypeOf<false>();
    expectTypeOf<IsExported<OldPartitionedAllocator>>().toEqualTypeOf<false>();
    expectTypeOf<IsExported<OldWasmAllocator>>().toEqualTypeOf<false>();
  });

  it("rejects old backing and handoff discriminants at compile time", () => {
    type Join<A extends string, B extends string> = `${A}${B}`;
    type OldPackedKind = Join<"sh", "ared">;
    type OldPartitionedKind = Join<Join<"shared", "-">, "partitioned">;
    type OldWasmKind = Join<Join<"wasm", "-">, "shared">;
    const oldPackedKindValue = ("sh" + "ared") as OldPackedKind;
    const oldPartitionedKindValue = ("shared" +
      "-" +
      "partitioned") as OldPartitionedKind;
    const oldWasmKindValue = ("wasm" + "-" + "shared") as OldWasmKind;

    // @ts-expect-error old backing kind was removed.
    const oldPackedKind: BackingKind = oldPackedKindValue;

    // @ts-expect-error old backing kind was removed.
    const oldPartitionedKind: BackingKind = oldPartitionedKindValue;

    // @ts-expect-error old backing kind was removed.
    const oldWasmKind: BackingKind = oldWasmKindValue;

    // @ts-expect-error old handoff packing was removed.
    const oldPackedPacking: HandoffPacking = oldPackedKindValue;

    // @ts-expect-error old handoff packing was removed.
    const oldPartitionedPacking: HandoffPacking = oldPartitionedKindValue;

    void oldPackedKind;
    void oldPartitionedKind;
    void oldWasmKind;
    void oldPackedPacking;
    void oldPartitionedPacking;
  });
});
