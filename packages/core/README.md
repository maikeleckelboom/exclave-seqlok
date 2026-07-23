# SeqWire Core

`@exclave/seqwire` contains the implemented SeqWire shared-memory research
surface. Use it from the repository workspace while the package remains private
and unpublished.

The package turns a TypeScript-authored contract into a deterministic
shared-memory layout, creates owned backing memory, builds and validates an
explicit handoff, and binds participants through role-specific capabilities:

```text
defineSpec
  -> planLayout
  -> allocatePacked / allocatePartitioned / allocateWasm
  -> buildHandoff / acceptHandoff
  -> bindController / bindProcessor / bindObserver
```

## Integration surface

- `defineSpec` authors parameter and meter contracts.
- `planLayout` derives deterministic plane sizes, offsets, and identity.
- Backing allocators create memory that matches the plan.
- `buildHandoff` and `acceptHandoff` make transfer and validation explicit.
- Controller, processor, and observer bindings expose different authority.
- Bounded seqlock reads return coherent candidates or caller-owned last-good
  state.

The [quickstart](../../apps/docs/src/quickstart.md) shows the smallest complete
local flow. See the [core flow](../../apps/docs/src/core-flow.md) for ownership
and timing-path guidance, and the [root README](../../README.md) for project
status and executable evidence.

## Implemented guarantees

- Canonical field paths and deterministic layout planning
- Explicit ownership of parameter and meter writes
- Validation before grouped publication
- Bounded seqlock reads
- Caller-owned snapshots and last-good values
- Explicit handoff validation before binding
- Structured error and diagnostic surfaces
- Type, runtime, property, worker, benchmark, and package-smoke coverage

These guarantees describe the implemented TypeScript project. They do not claim
native process authority, operating-system mapping, renderer revocation, or a
complete application lifecycle.

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
