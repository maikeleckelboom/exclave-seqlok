# SeqWire

SeqWire is experimental TypeScript research into typed, coherent shared-memory
state across workers, AudioWorklets, and WebAssembly-oriented runtimes.

It investigates how independently scheduled JavaScript runtimes can exchange
structured state without hiding the contract, layout, ownership, transfer,
runtime role, or read-consistency rules. Authored contracts become deterministic
shared-memory layouts. Explicit handoffs and role-specific bindings keep
authority visible at each boundary.

[Quickstart](apps/docs/src/quickstart.md) ·
[Core flow](apps/docs/src/core-flow.md) ·
[Signalsmith proof](docs/proofs/signalsmith-stretch.md) ·
[Benchmarks](packages/core/bench/README.md) ·
[Documentation](apps/docs/src/index.md) ·
[Verification](#verification)

## The programming model

```text
authored contract
  -> deterministic layout
  -> owned backing memory
  -> validated handoff
  -> controller / processor / observer bindings
```

The owner defines the contract, plans the byte layout, and allocates the
backing. A receiving runtime validates the handoff before it interprets the
memory. Each binding exposes only the reads and writes assigned to its role.

## Smallest complete flow

This example runs against the local workspace package. It uses the current
public API to author a contract, allocate shared backing, accept a handoff, bind
two roles, and exchange one coherent value in each direction.

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

The [quickstart](apps/docs/src/quickstart.md) extends this flow with nested
contracts, array staging, snapshots, and transport-boundary validation.

## Why SeqWire exists

Shared typed arrays provide bytes and atomic primitives, but they do not define
the system around those bytes:

- Independently reconstructed layouts can disagree about offsets and types.
- Writer ownership and transfer assumptions can remain implicit.
- Multi-field reads can combine values from different publications.
- Open-ended retry loops can turn contention into unbounded timing work.
- General bindings can expose mutation authority to roles that should only read.

SeqWire keeps those decisions inspectable. Layout has a deterministic identity,
handoffs are validated, bindings are role-specific, and coherent reads use
explicit budgets with caller-owned last-good state.

## What is implemented

- TypeScript-authored parameter and meter contracts
- Deterministic shared-memory layout and layout identity
- Packed, partitioned, and shared WebAssembly backing experiments
- Explicit handoff construction and acceptance
- Controller, processor, and observer bindings
- Bounded coherent reads with caller-owned last-good snapshots
- Grouped validation and publication
- Structured errors and diagnostics
- Worker, property, runtime, type, benchmark, and package-smoke coverage

## Executable evidence

The [Signalsmith Stretch proof](docs/proofs/signalsmith-stretch.md) uses a
[real browser application](apps/signalsmith-stretch) with a real audio graph, a
real AudioWorklet, and the upstream Signalsmith Stretch WebAssembly release.
SeqWire models the control and meter boundary. The main thread applies canonical
SeqWire control snapshots to Signalsmith, while a downstream AudioWorklet reads
SeqWire control state and publishes live meters.

Signalsmith itself does not directly consume SeqWire memory. This is executable
evidence for the boundary model, not a shipped audio runtime.

The [benchmark suites](packages/core/bench/README.md) measure the shared-memory
hot paths and end-to-end setup. They are regression evidence, not
production-readiness claims.

## Project status and limits

SeqWire is implemented, reproducible experimental research. It is not presented
as production-ready, a general application framework, or a production
dependency.

The intended package identity is `@exclave/seqwire`. It is currently private and
unpublished. The `@exclave` scope is the publishing namespace only, not a parent
project identity.

The repository retains architecture notes and decision records. Some describe
exploratory or superseded directions, and their status is identified in the
documentation indexes.

## Verification

Use Node.js 24 and the repository-pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

Focused checks include:

```sh
pnpm build
pnpm lint
pnpm test:types
pnpm test
pnpm run docs
pnpm test:pack
pnpm signalsmith:check
pnpm signalsmith:test:browser
```

`pnpm verify:fresh` invokes destructive cleanup through `git clean -xfd`. Do
not run it in a worktree that contains untracked work.

## Repository map

- `packages/core` contains the `@exclave/seqwire` implementation, tests,
  benchmarks, and package documentation.
- `apps/docs` contains the VitePress documentation site.
- `apps/signalsmith-stretch` contains the AudioWorklet proof application.
- `docs/proofs` records executable evidence and its exact scope boundaries.
- `scripts` contains repository verification and support tooling.

## Research boundary

SeqWire and Projection Runtime are separate research projects with no runtime
dependency in either direction. SeqWire studies coherent state inside shared
memory. Projection Runtime studies the wider Electron-to-native-Rust boundary.
Neither project is a shipped Dekzer dependency.

See [Research lineage](apps/docs/src/research-lineage.md) for the limited
historical relationship.
