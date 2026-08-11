# API Reference

This page covers the public `@exclave/seqwire` surface. Internal folders such as backing planes, seqlock primitives, and validation helpers are implementation details unless exported from the root package or diagnostics subpath.

## Spec

- `defineSpec(input)` compiles authored AST or plain canonical input.
- `CanonicalSpec` is the runtime spec shape with required `id`.
- `CanonicalSpecFromAst<T>` maps an authored AST type to canonical dot keys.
- `ParamDef` and `MeterDef` describe supported leaf definitions.

Supported params include `f32`, `i32`, `u32`, `bool`, `enum`, and arrays for `f32`, `i32`, `u32`, `u8`, `i8`, `i16`, `u16`, `bool`, and `enum`.

Supported meters include `f32`, `f64`, `i32`, `u32`, `bool`, `enum`, and arrays for `f32`, `f64`, `u32`, and `bool`.
Boolean meter arrays use `Uint32Array`, matching their `MU32` storage plane.

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

Role-specific public types include `ControllerBinding`, `ProcessorBinding`,
`ObserverBinding`, their params and meters interfaces, `ControllerOptions`,
`ProcessorOptions`, `ObserverOptions`, value and snapshot mapping types, grouped
meter types, and caller-owned `IntoForParams` / `IntoForMeters` destinations.
`SnapshotDegradePolicy` names the observer snapshot fallback policy. The root
`ParamValues`, `MeterValues`, `SnapshotOf`, and `SnapshotMetersOf` aliases are
the same readonly shapes returned by the corresponding snapshot contracts;
meter snapshot values are initialized values, not `T | undefined`.
The generated declaration is the exhaustive type-export inventory.

### Snapshot selection

Controller and observer param/meter snapshots share one selection model:

```ts
snapshot();
snapshot(["a", "b"]);
snapshot("a", "b");
snapshot({ keys: ["a", "b"] });
```

Omitting selection means all keys. An explicit empty array, either directly or
as `{ keys: [] }`, means no keys and returns `{}`. Unknown selected keys throw
`binding.unknownKey`.

Controller snapshots can additionally reuse caller-owned array destinations:

```ts
controller.params.snapshot(["curve"], { into: { curve } });
controller.params.snapshot({ keys: ["curve"], into: { curve } });
controller.params.snapshot({ into: { curve } });
```

The `into` forms copy shared values into the supplied buffers and return those
same buffer objects. This avoids destination allocation; it is not zero-copy.
Observer snapshots intentionally have no `into` option because their arrays are
detached copies created by the bounded read attempt.

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

`stage(...)` callbacks are non-transactional. Validation failures before the
write section leave state and PU unchanged. If a callback mutates the shared
array and then throws, the error propagates, the partial mutation may remain
visible, PU advances, and lock parity is restored. Do not throw after mutating
shared state.

### ControllerMeters

`controller.meters` is the controller-side read surface for meters. Processors publish meters.

| Member | Contract |
| --- | --- |
| `snapshot(...)` | Read meters; pass `{ keys, into }` to reuse array buffers. |
| `version()` | Return the current meter update sequence. |

In v0.3.0, controller meter snapshots are direct copies rather than
seqlock-verified multi-field reads. `ControllerOptions` configures only param
range policy; it has no meter policy surface. Use an observer with
`degrade: "throw"` when a failed coherence check must not return a best-effort
snapshot.

### ProcessorParams

`processor.params.within(callback)` attempts a seqlock-verified read with a
default spin budget of 1024 and retry budget of 8. The callback runs only for a
verified candidate. Exhaustion produces a structured error; the caller decides
whether to keep a last-good value. Scalar members are captured by that verified
candidate. Array members are live ephemeral views into shared backing, not
detached coherent copies.

`ProcessorOptions` configures only those param-read budgets. Meter publication
has no spin, retry, or degradation options.

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

Meter publish callbacks and nested `writer.stage(...)` callbacks are
non-transactional. A group/key/shape failure detected before the publish
section leaves MU unchanged. If user code throws after one or more writes, the
error propagates, partial values may remain visible, MU advances, and lock
parity is restored. Keep callbacks bounded and do not throw after mutating
shared state.

### Observer reads

Observer param and meter snapshots first attempt a bounded seqlock-verified
read. Their default budgets are 256 spins and 4 retries. Array values are copied
inside each read attempt, so a verified observer snapshot is detached from later
backing writes.

The default `returnLatest` policy is best-effort on verification failure. A full
snapshot retains an internally owned copy of the last complete verified
snapshot and returns a detached copy when that cache is used; otherwise it
performs one direct unverified read. Partial snapshots do not use or populate
the complete-snapshot cache and fall back directly.

Set `degrade: "throw"` and retain caller-owned last-good state when an
unverified fallback is unacceptable. Observer `params.within(...)` never
degrades: it invokes the callback only with a verified read and otherwise
throws. The callback receives the same canonical flat-key shape as a full param
snapshot. Its arrays are detached copies, unlike processor hot-path arrays;
processor-only nested aliases and `Ephemeral<>` branding are not exposed.

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
or choose a retry policy for the caller. `capacity` is usable capacity: a ring
allocated with `capacity: N` accepts exactly `N` entries. Arbitrary positive
capacities are supported; allocation reserves one extra physical slot
internally.

```ts twoslash
import {
  allocateSwsrRing,
  bindSwsrRingConsumer,
  bindSwsrRingProducer,
} from "@exclave/seqwire";

const ring = allocateSwsrRing({ capacity: 2, wordsPerSlot: 1 });

const producer = bindSwsrRingProducer(ring, {
  encode(value: number, destination, offset) {
    destination[offset] = value;
  },
});

const consumer = bindSwsrRingConsumer(ring, {
  decode(source, offset) {
    return source[offset] ?? 0;
  },
});

producer.enqueue(10);
producer.enqueue(20);

const received: number[] = [];
consumer.drain((value) => received.push(value));
```

On full, `enqueue(...)` leaves queued entries untouched, increments `dropped`,
and leaves `writeSeq` unchanged. `drain(...)` processes the finite write-index
snapshot loaded at call start. It commits consumption after each callback, so a
callback that throws is not replayed; later entries wait for the next drain.
If encoding throws, the error propagates and no entry, index, sequence, or drop
count is published; the slot can be reused by a later enqueue. Reentrant
`enqueue(...)` or `drain(...)` on the same bound producer/consumer throws
`primitives.swsrRingReentrant` instead of risking slot reuse or replay. A
consumer callback may still enqueue through a separate producer. Bind-time
validation rejects backing objects whose declared layout and shared views do
not match.
See the current [SWSR low-level reference](https://github.com/maikeleckelboom/seqwire/blob/main/packages/core/docs/architecture/18-command-ring-swsr.md)
for the header, ordering, counter, and error contracts.

## Enum Utilities

The root package exports `enumValues`, `enumArrayToLabels`,
`enumLabelsToArray`, `enumIndexFromLabel`, `enumLabelFromIndex`, and
`enumPaletteFor`, plus the `EnumLabel` and `EnumKeyOf` types. They operate on
enum definitions from a current spec; they do not create or publish shared
state.

## Diagnostics and Errors

- `SeqWireError` is the structured error class.
- `isSeqWireError(value)` narrows unknown errors.
- `getErrorMeta(code)` and `getErrorMessage(code)` expose registry metadata.
- `isErrorCode(value)` checks whether a string is a registered code.
- `interpretHealth(error)` maps known error domains to health guidance.

Diagnostics exports live at `@exclave/seqwire/diagnostics`.

See [Diagnostics](/diagnostics) and [Error Model](/error-model) for integration guidance.
