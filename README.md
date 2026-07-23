# SeqWire

SeqWire is an experimental TypeScript project for typed, coherent shared-memory
state across workers, AudioWorklets, and WebAssembly-oriented runtimes.

It explores a narrow systems problem: how independently scheduled JavaScript
runtimes can exchange structured state through shared memory without making
layout, ownership, or read consistency implicit. TypeScript-authored contracts
are lowered into a deterministic memory layout. The owner creates the backing
memory and an explicit handoff. Role-specific bindings then expose only the
reads and writes available to each participant.

SeqWire is research software. It is reproducible and tested, but it is not
presented as production-ready. The future npm package name is
`@exclave/seqwire`. The package is currently private and unpublished.

## What is implemented

- TypeScript-authored parameter and meter contracts
- Deterministic shared-memory layout and layout identity
- Packed, partitioned, and shared WebAssembly backing experiments
- Explicit handoff construction and acceptance
- Controller, processor, and observer bindings
- Bounded coherent reads with caller-owned last-good snapshots
- Grouped validation and publication
- Structured errors and diagnostics
- Worker, property, runtime, and type tests
- Benchmarks and package smoke tests

SeqWire keeps its shared-memory mechanics visible. A contract is authored before
layout is planned. Backing memory is created before a handoff crosses a runtime
boundary. A receiver validates the handoff before binding. Reads that cannot
observe a coherent candidate within their budget return bounded failure or a
retained last-good value instead of exposing torn state.

## Signalsmith Stretch proof

`apps/signalsmith-stretch` is an AudioWorklet proof around the upstream
Signalsmith Stretch WebAssembly release. The application models the control and
meter surface in SeqWire, applies canonical control snapshots to Signalsmith,
reads output gain inside a downstream AudioWorklet, and publishes live meter
state back through SeqWire.

The proof uses a real browser audio graph and a real AudioWorklet. It does not
claim that Signalsmith itself reads SeqWire memory, and it is not a shipped
audio runtime. See
[the proof record](docs/proofs/signalsmith-stretch.md) for the exact boundary.

## Maturity

SeqWire is:

- experimental shared-memory research
- unpublished on npm
- tested across type, runtime, worker, property, package, and browser surfaces
- suitable for studying explicit ownership and coherent state exchange
- not a general application framework
- not a production dependency

The repository intentionally retains architecture notes and decision records.
Some describe exploratory directions rather than current commitments. Their
status is stated in the documentation indexes.

## Local development

Use the repository-pinned pnpm version and Node.js 24:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

Focused commands include:

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

## Repository structure

- `packages/core`: the `@exclave/seqwire` implementation, tests, benchmarks, and
  package documentation
- `apps/docs`: the VitePress documentation site
- `apps/signalsmith-stretch`: the AudioWorklet proof application
- `docs/proofs`: proof records and scope boundaries
- `scripts`: repository verification and support tooling

The `@exclave` scope is the future npm publishing namespace. It is not a parent
product identity for SeqWire.

## Research lineage

SeqWire and Projection Runtime are separate research projects. SeqWire explores
coherent state inside shared memory. Projection Runtime investigates the wider
Electron-to-native-Rust problem around authority, publication, resource access,
supervision, and recovery. Neither project depends on the other, and neither is
a shipped Dekzer dependency.

See [Research lineage](apps/docs/src/research-lineage.md) for the boundary and
the limited historical relationship between the projects.
