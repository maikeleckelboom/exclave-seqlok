# SeqWire

SeqWire is a frozen, private, unpublished shared-memory research donor and
archive candidate.

Exclave is the sole production architecture for the Electron renderer to native
Rust audio-engine boundary. SeqWire is not that runtime and must not be used as
an installable package, a new integration dependency, or the basis for a second
compiler, planner, compatibility identity, lifecycle, or shared-memory ABI.

Read the authoritative
[Exclave convergence and SeqWire disposition audit](apps/docs/src/exclave-convergence.md)
before changing this repository.

## What remains here

The repository preserves implemented research and evidence around:

- authored params/meters specs and deterministic shared-memory layout;
- packed, partitioned, and shared-WebAssembly backing experiments;
- handoff and controller/processor/observer binding prototypes;
- bounded seqlock reads, snapshots, grouped publication, and an SWSR ring;
- property, cross-thread, package-smoke, and benchmark techniques; and
- the Signalsmith Stretch AudioWorklet proof.

Those assets have individual `KEEP`, `PORT`, `REBUILD`, `LAB`, `DELETE`, or
`ARCHIVE` dispositions in the audit. Their presence does not make SeqWire a
supported production runtime.

Historical architecture, guide, and ADR documents are intentionally retained as
design evidence. When they conflict with the convergence audit, the audit wins.
In particular, future-facing Electron, native, MWMR, topology, package-family,
and release claims are historical rather than planned work.

## Development posture

- Keep `@exclave/seqwire` private and unpublished. The live npm registry lookup
  found no published version; local pack smoke remains donor evidence only.
- Do not add new consumers or production features.
- Do not migrate SeqWire's schema, planner, Plan identity, handoff, role model,
  dual-counter ABI, or mutable backings into Exclave.
- Preserve donor provenance while selected tests and techniques are translated
  to Exclave-owned contracts and generated artifacts.
- Prefer eventual repository archival. Build a private protocol lab only if it
  consumes Exclave-generated artifacts and has an active conformance owner.

## Repository map

- [Authoritative convergence audit](apps/docs/src/exclave-convergence.md)
- [Frozen package research surface](packages/core/README.md)
- [Historical documentation index](packages/core/docs/INDEX.md)
- [Signalsmith proof record](docs/proofs/signalsmith-stretch.md)

## Verification

Keep the donor reproducible while extraction is active:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify:fresh` invokes cleanup including `git clean -xfd`; do not use it in
a worktree containing untracked work. A green gate verifies the frozen research
artifact only. It is not a release or production-readiness signal.
