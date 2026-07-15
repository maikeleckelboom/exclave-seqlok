# SeqWire Core Research Artifact

This directory contains the former `@exclave/seqwire` package implementation.
It is frozen as a private, unpublished research donor; it is not a supported
package or the production Electron to native Rust boundary.

Exclave owns authored contracts, canonical manifests, field identity,
compilation, lane planning, ABI/version identity, authority/session semantics,
publication continuity, resource access, generated TypeScript and Rust
artifacts, and cross-language conformance.

Read the authoritative
[Exclave convergence and SeqWire disposition audit](../../apps/docs/src/exclave-convergence.md)
before using or changing code in this directory.

## Frozen implementation

The implementation still contains this historical research flow:

```text
defineSpec
  -> planLayout
  -> allocatePacked / allocatePartitioned / allocateWasm
  -> buildHandoff / acceptHandoff
  -> bindController / bindProcessor / bindObserver
```

This flow is evidence to inspect, test, and selectively translate. It must not
be adopted as an Exclave runtime dependency or compatibility layer. In
particular:

- `defineSpec` and anonymous hashes are not Exclave contract identity;
- `planLayout`, planes, slots, Plan hashes, and PU/MU are not the production ABI;
- params/meters and controller/processor/observer are not the production
  authority model;
- handoff acceptance is not native authority, revocation, or session identity;
- packed, partitioned, and WASM mutable backings are not the renderer resource
  model; and
- same-process and worker tests do not prove Electron/native Rust byte or
  lifecycle conformance.

Useful donor assets include validation generators, alignment properties,
bounded-read scenarios, validation-before-grouped-publication tests,
caller-owned snapshot techniques, structured errors, diagnostics, package-smoke
methods, benchmark methods, and the AudioWorklet workload. The audit records the
exact owner, dependencies, risk, order, and behavior decision for each asset.

## No installation or publication

Do not install, publish, or create new consumers of `@exclave/seqwire`. The
package is mechanically private, has no `publishConfig`, and had no published
version in a live npm registry lookup (`E404`). Its identity, version, and
exports remain while `private: true` disables publication, so the frozen
artifact can be built and its passing packed-output check can be used as donor
evidence. They do not constitute a release commitment.

## Verification

From the repository root:

```sh
pnpm lint
pnpm test:types
pnpm test
pnpm build
pnpm test:pack
```

Benchmarks and historical documents describe SeqWire's own implementation. They
must not be reported as Exclave production evidence.
