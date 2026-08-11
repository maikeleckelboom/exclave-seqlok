# SeqWire

> Typed, coherent shared memory for timing-sensitive JavaScript runtimes.

SeqWire started with a practical problem I was trying to solve around
AudioWorklets. Interface state lives on the main thread, while audio processing
runs independently: parameters travel toward the processor, and meters travel
back. An AudioWorklet normally processes 128 frames at a time. At 48 kHz, that
is about 2.67 ms to finish the work for one quantum.

That made ordinary `postMessage`-style communication a poor fit for the hottest
part of the boundary. Every allocated message adds work, and its arrival is not
aligned with the audio quantum. I wanted to investigate typed shared state
without locks, hot-path allocation, torn multi-field reads, implicit ownership,
or two runtimes independently guessing the same memory layout.

SeqWire is the TypeScript research project that grew from that investigation.
It turns a typed parameter-and-meter contract into a deterministic shared-memory
layout, then gives each runtime a role-specific view of the same backing memory.

## Core idea

```text
TypeScript contract
  -> deterministic memory layout
  -> owned shared backing
  -> validated handoff
  -> role-specific bindings
```

The contract is the source of truth for field names, value types, ranges, and
fixed array lengths. `planLayout` lowers it to concrete byte offsets and a stable
layout identity. One side allocates the `SharedArrayBuffer` backing and sends a
handoff; the receiving side validates that artifact before interpreting the
memory. Controller and processor bindings then expose only the operations that
belong to each role.

```text
controller / main thread  -- params -->  processor / worklet
controller / main thread  <-- meters --  processor / worklet
```

These are two single-writer, multiple-reader domains. The controller owns
parameter writes. The processor owns meter writes. Keeping those directions
explicit makes the concurrency model small enough to reason about.

## Why not just use typed arrays?

`SharedArrayBuffer`, typed arrays, and `Atomics` provide the raw mechanisms, but
they do not answer the systems questions around them:

- Which offsets and numeric representations describe each field?
- Which runtime is allowed to write each part of memory?
- How does a receiver know that a handoff matches the layout it expects?
- How can several related values be read without combining two publications?
- What happens when contention would otherwise cause an unbounded retry loop?
- How do the TypeScript types stay connected to the bytes at runtime?

SeqWire makes those choices part of the contract and binding flow. It does not
try to turn shared memory into an event bus or hide the ownership model behind
global state.

## A small complete flow

The public API keeps setup separate from the timing-sensitive path:

```ts
import {
  acceptHandoff,
  allocatePacked,
  bindController,
  bindProcessor,
  buildHandoff,
  defineSpec,
  planLayout,
} from "@exclave/seqwire";

const contract = defineSpec(({ param, meter }) => ({
  id: "readme/control-meter",
  params: { gain: param.f32({ min: 0, max: 1 }) },
  meters: { level: meter.f32() },
}));

const plan = planLayout(contract);
const backing = allocatePacked(plan);
const controller = bindController(contract, plan, backing);

const handoff = buildHandoff(plan, backing);
const processor = bindProcessor(acceptHandoff(handoff));

controller.params.update({ gain: 0.75 });

processor.params.within((params) => {
  processor.meters.publish((meters) => meters.level(params.gain));
});

const { level } = controller.meters.snapshot("level");
```

In a real boundary, the handoff crosses a worker or AudioWorklet port. If it
arrives as `unknown`, `acceptHandoff` checks the protocol version, plan shape,
packing mode, and backing sizes before the processor binds to it.

The [quickstart](apps/docs/src/quickstart.md) covers nested contracts, arrays,
snapshots, and transport-boundary validation without expanding this README into
an API reference.

## Design choices

### Deterministic layout

Nested authored fields collapse to canonical paths before planning. Planning
then produces stable plane sizes, offsets, storage types, and a layout identity.
Allocation consumes that plan; bindings do not silently reconstruct it.

### Explicit writer ownership

Parameters and meters are separate domains with separate writers. A controller
can update parameters and observe meters. A processor can read parameters and
publish meters. An observer receives read-only access. Those capabilities are
expressed by different bindings rather than convention alone.

### Validated handoff

The owner creates the backing once and packages its plan and backing descriptor
into a handoff. Receivers can validate an untrusted transport value before they
create a local binding, so layout and packing assumptions do not remain hidden
at the thread boundary.

### Bounded coherent reads

SeqWire uses seqlock-based publication for coherent multi-field reads. A reader
accepts a snapshot only when the sequence is stable before and after the copy.
Retry work is bounded, and callers retain their own last-good value when a fresh
coherent snapshot is unavailable within that budget.

### Type-first contracts

The same contract that determines the memory layout also drives inferred
parameter keys, meter keys, value types, and binding shapes. The type layer and
the runtime layout therefore start from one authored description.

## Real evidence

The [Signalsmith Stretch proof](docs/proofs/signalsmith-stretch.md) runs a real
browser audio graph with a real AudioWorklet and the upstream Signalsmith
Stretch WebAssembly release. SeqWire models the control and meter boundary: the
main thread applies canonical SeqWire control snapshots to Signalsmith, while a
downstream AudioWorklet reads `control.outputGain` from SeqWire and publishes
live meters. Signalsmith itself does not directly consume SeqWire memory.

The repository also includes worker contention tests, property tests for layout
and specification behavior, compile-time API tests, package smoke tests, and
[benchmarks](packages/core/bench/README.md) for hot paths and end-to-end setup.
The benchmark results are useful as regression evidence and for comparing
design choices, not as universal timing numbers.

## Project status

SeqWire is experimental systems research with a real, executable TypeScript
implementation. It is not currently presented as a production-ready,
general-purpose state library.

The intended package is `@exclave/seqwire`, currently at version `0.3.0`. It
remains `private: true` and is unpublished, so the repository checkout is the
current way to run and study it.

SeqWire and [Projection Runtime](https://github.com/maikeleckelboom/projection-runtime)
are separate research projects with some historical lineage and no runtime
dependency in either direction. The
[research lineage](apps/docs/src/research-lineage.md) records that relationship.

## Explore

- [Quickstart](apps/docs/src/quickstart.md) - run the current public API flow.
- [Core flow](apps/docs/src/core-flow.md) - understand roles, ownership, and the
  timing-sensitive path.
- [Memory and layout](apps/docs/src/memory-layout.md) - inspect planning,
  backing choices, and coherent snapshots.
- [Handoff and acceptance](apps/docs/src/handoff-acceptance.md) - follow the
  boundary artifact and its validation.
- [Origin and design history](packages/core/docs/architecture/00-seqwire-origin-and-design-history.md)
  - read how the AudioWorklet constraint shaped the architecture.
- [Documentation index](apps/docs/src/index.md) - choose from the wider design
  and evidence material.

## Local setup

Use Node.js 24 and the repository-pinned pnpm version (`11.6.0`):

```sh
pnpm install --frozen-lockfile
pnpm verify
```

To run the Signalsmith proof application locally:

```sh
pnpm signalsmith:dev
```
