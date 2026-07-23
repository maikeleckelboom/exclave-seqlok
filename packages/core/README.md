# SeqWire Core

`@exclave/seqwire` contains the implemented SeqWire shared-memory research
surface. The package is private and unpublished while the project remains
experimental.

The package turns a TypeScript-authored contract into a deterministic
shared-memory layout, creates backing memory, builds an explicit handoff, and
binds participants through role-specific capabilities:

```text
defineSpec
  -> planLayout
  -> allocatePacked / allocatePartitioned / allocateWasm
  -> buildHandoff / acceptHandoff
  -> bindController / bindProcessor / bindObserver
```

## Implemented guarantees

- Canonical field paths and deterministic layout planning
- Explicit ownership of parameter and meter writes
- Validation before grouped publication
- Bounded seqlock reads
- Caller-owned snapshots and last-good values
- Explicit handoff validation before binding
- Structured error and diagnostic surfaces
- Type, runtime, property, worker, benchmark, and pack-smoke coverage

These guarantees describe the implemented TypeScript project. They do not claim
native process authority, operating-system mapping, renderer revocation, or a
complete application lifecycle.

## Package status

The future public package name is `@exclave/seqwire`. A live npm registry lookup
on 2026-07-23 returned `E404`, and `private: true` prevents publication from
this workspace. Use the repository checkout for research and verification.

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
