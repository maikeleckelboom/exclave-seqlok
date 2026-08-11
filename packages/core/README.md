# SeqWire Core

`@exclave/seqwire` contains the implemented SeqWire shared-memory research
surface. Use it from the repository workspace while the package remains private
and unpublished.

The package turns a TypeScript-authored contract into a deterministic
shared-memory layout, creates owned backing memory, builds and validates an
explicit handoff, and binds runtimes through role-specific capabilities:

```text
defineSpec
  -> planLayout
  -> allocatePacked / allocatePartitioned
  -> buildHandoff / acceptHandoff
  -> bindController / bindProcessor / bindObserver

or

planLayout
  -> allocateWasm
  -> bindController / bindProcessor / bindObserver
```

## Integration surface

- `defineSpec` authors parameter and meter contracts.
- `planLayout` derives deterministic plane sizes, offsets, and identity.
- Backing allocators create or attach memory that matches the plan.
- `buildHandoff` and `acceptHandoff` make transfer and validation explicit.
- Controller, processor, and observer bindings expose different write and read
  capabilities.
- Processor parameter reads and observer reads use bounded seqlock checks.
- The public SWSR ring helpers provide a fixed-capacity command queue for one
  producer and one consumer.

The [quickstart](../../apps/docs/src/quickstart.md) shows the smallest complete
local flow. See the [core flow](../../apps/docs/src/core-flow.md) for ownership
and timing-path guidance, and the [root README](../../README.md) for project
status and executable evidence.

## Implemented guarantees

- Canonical field paths and deterministic layout planning
- Explicit ownership of parameter and meter writes
- Validation before grouped publication
- Bounded processor and observer read paths
- Explicit handoff validation before binding
- Structured error and diagnostic surfaces
- Type, runtime, property, worker, benchmark, and package-smoke coverage

Controller meter snapshots are direct cold-path copies. They are not
seqlock-verified as a multi-field unit; use an observer binding when that
coherence guarantee is required. Processor `within(...)` calls fail explicitly
when their bounded read work is exhausted, which lets the caller retain its own
last-good state.

Packed and partitioned `SharedArrayBuffer` backings can be carried by handoff
v1. Shared `WebAssembly.Memory` is supported for local binding, but not by the
current handoff envelope. Worker/worklet lifecycle, cross-process memory
mapping, schema migration, persistence, and application recovery remain outside
this package.

## Package status

The intended package identity is `@exclave/seqwire`. The workspace package is
`private: true` and is not published on npm.

The supported import paths in the built artifact are:

- `@exclave/seqwire`
- `@exclave/seqwire/diagnostics`

Internal modules under `src` are not public API.

## Verification

From the repository root:

```sh
pnpm lint
pnpm test:types
pnpm test
pnpm build
pnpm test:pack
```

Benchmarks and the Signalsmith proof are evidence for SeqWire itself. They are
not production-readiness claims or evidence of integration with another
project.
