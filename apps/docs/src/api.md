# API Reference

This page covers the public `@exclave/seqwire` surface. Internal folders such as backing planes, seqlock primitives, and validation helpers are implementation details unless exported from the root package or diagnostics subpath.

## Spec

- `defineSpec(input)` compiles authored AST or plain canonical input.
- `CanonicalSpec` is the runtime spec shape with required `id`.
- `CanonicalSpecFromAst<T>` maps an authored AST type to canonical dot keys.
- `ParamDef` and `MeterDef` describe supported leaf definitions.

Supported params include `f32`, `i32`, `u32`, `bool`, `enum`, and arrays for `f32`, `i32`, `u32`, `u8`, `i8`, `i16`, `u16`, `bool`, and `enum`.

Supported meters include `f32`, `f64`, `i32`, `u32`, `bool`, `enum`, and arrays for `f32`, `f64`, `u32`, and `bool`.

```ts twoslash
import { defineSpec, type CanonicalSpecFromAst } from "@exclave/seqwire";

const authored = {
  id: "api/spec",
  params: {
    filter: {
      cutoff: { kind: "f32", min: 20, max: 20_000 },
    },
  },
} as const;

const spec = defineSpec(authored);
type Canonical = CanonicalSpecFromAst<typeof authored>;
```

## Plan and Backing

- `planLayout(spec)` returns a deterministic memory plan, including canonical param definitions used by observer snapshots.
- `allocatePacked(plan)` creates packed backing.
- `allocatePartitioned(plan)` creates partitioned backing.
- `allocateWasm(plan, memory?)` allocates or attaches compatible shared
  WebAssembly memory.

## Binding

- `bindController(spec, plan, backing, options?)`
- `bindProcessor(handoff, options?)`
- `bindProcessor(acceptedHandoff, options?)`
- `bindProcessor(plan, backing, options?)`
- `bindObserver(source, options?)`
- `bindObserver(spec, plan, backing, options?)`

Observer `source` can be a handoff or accepted handoff. Observer snapshots decode enum params to labels for explicit spec triples and handoff-derived sources.

Role-specific public types include `ControllerBinding`, `ProcessorBinding`, `ObserverBinding`, `ControllerParams`, `ProcessorParams`, `ObserverParams`, `ControllerMeters`, `ProcessorMeters`, `ObserverMeters`, `ParamValueFor`, `MeterValueFor`, `ScalarParamPatch`, `HydratePatch`, `ParamsSnapshot`, and `MetersSnapshot`.

### ControllerParams

`controller.params` is the controller-side write surface for params.

| Member | Contract |
| --- | --- |
| `set(key, value)` | Set one scalar param. |
| `update(patch)` | Apply a scalar-only micro-batch and publish once. |
| `stage(key, callback)` | Open the explicit hot-path write window for one array param. |
| `hydrate(patch)` | Load cold-path scalar and array state; array values may be copied. |
| `snapshot(...)` | Read params; pass `{ keys, into }` to reuse array buffers. |
| `version()` | Return the current param update sequence. |

`update(...)` does not accept array params. Use `stage(...)` for hot-path array writes or `hydrate(...)` when loading saved state.

### ControllerMeters

`controller.meters` is the controller-side read surface for meters. Processors publish meters.

| Member | Contract |
| --- | --- |
| `snapshot(...)` | Read meters; pass `{ keys, into }` to reuse array buffers. |
| `version()` | Return the current meter update sequence. |

In v0.3.0, controller meter snapshots are direct copies rather than
seqlock-verified multi-field reads. The `ControllerOptions.meters` type remains
in the public surface but is not consumed by the controller binding. Use an
observer with `degrade: "throw"` when a bounded coherent snapshot and
caller-owned last-good handling are required.

### ProcessorParams

`processor.params.within(callback)` attempts a seqlock-verified read with a
default spin budget of 1024 and retry budget of 8. The callback runs only for a
coherent candidate. Exhaustion produces a structured error; the caller decides
whether to keep a last-good value. The read builds a JavaScript view object, and
array members are ephemeral views into shared backing.

### ProcessorMeters

`processor.meters` is the processor-side write surface for meters.

| Member | Contract |
| --- | --- |
| `publish(callback)` | Run one coherent meter publish section. |
| `publishGroup(group, values)` | Publish one exact schema meter group with unprefixed group keys. |
| `version()` | Return the current meter update sequence. |

Inside `publish(...)`, `writer.set(key, value)` still accepts fully qualified scalar meter keys such as `"runtime.blockSamples"`. `writer.setGroup(group, values)` accepts the same group value shape used by `publishGroup(...)` and keeps the write inside the enclosing coherent meter publish section.

```ts twoslash
import { defineSpec, type MeterGroupValues } from "@exclave/seqwire";

const spec = defineSpec(({ meter }) => ({
  id: "api/meters",
  meters: {
    runtime: {
      blockSamples: meter.u32(),
      state: meter.enum(["idle", "running"]),
    },
  },
}));

type RuntimeMeters = MeterGroupValues<typeof spec, "runtime">;

const values: RuntimeMeters = {
  blockSamples: 128,
  state: 1,
};

declare const processor: import("@exclave/seqwire").ProcessorBinding<
  typeof spec
>;

processor.meters.publishGroup("runtime", values);

processor.meters.publish((writer) => {
  writer.setGroup("runtime", values);
  writer.set("runtime.blockSamples", 256);
});
```

Grouped publishing is for exact schema groups: `publishGroup("runtime", values)` maps every unprefixed key in `values` to canonical meter keys under `runtime.*`. It is not arbitrary object flattening. Derived values, such as enum indices or split frame counters, should still be constructed explicitly before publishing. `publishGroup(...)` is convenience-oriented; benchmark it before using it in a hard hot path.

### Observer reads

Observer param and meter snapshots use bounded seqlock checks. Their default
budgets are 256 spins and 4 retries. The default `returnLatest` degradation
policy reuses a cached complete snapshot when available; otherwise the current
implementation performs one direct best-effort read. Partial snapshots do not
populate the complete-snapshot cache. Set `degrade: "throw"` and retain
last-good state in the caller when an unverified fallback is unacceptable.

Observer `params.within(...)` does not degrade. It calls the callback only for a
coherent read and otherwise throws.

## Handoff

- `buildHandoff(plan, backing)` creates a boundary artifact.
- `acceptHandoff(handoff)` validates and normalizes a received artifact.
- `verifyHandoff(localPlan, remotePlan)` compares plan identity and byte length.

Handoff v1 carries the plan plus either one packed `SharedArrayBuffer` or a map
of partitioned plane buffers. `allocateWasm(...)` produces a backing that can be
bound directly, but `buildHandoff(...)` rejects it.

## SWSR Ring

The root package also exports the fixed-capacity single-writer/single-reader
ring surface:

- `allocateSwsrRing(layout)`
- `bindSwsrRingProducer(backing, encode)`
- `bindSwsrRingConsumer(backing, decode)`
- header constants and the corresponding `SwsrRing*` types

The producer returns `false` when the ring is full; it does not block, resize,
or choose a retry policy for the caller.

## Diagnostics and Errors

- `SeqWireError` is the structured error class.
- `isSeqWireError(value)` narrows unknown errors.
- `getErrorMeta(code)` and `getErrorMessage(code)` expose registry metadata.
- `interpretHealth(error)` maps known error domains to health guidance.

Diagnostics exports live at `@exclave/seqwire/diagnostics`.

See [Diagnostics](/diagnostics) and [Error Model](/error-model) for integration guidance.
