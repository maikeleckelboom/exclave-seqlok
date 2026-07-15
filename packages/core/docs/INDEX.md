# SeqWire Historical Documentation Index

This folder is a preserved research record. It is not the current production
architecture for the Electron renderer to native Rust audio-engine boundary.
Exclave owns that boundary.

Read the authoritative
[Exclave convergence and SeqWire disposition audit](../../../apps/docs/src/exclave-convergence.md)
before following any document here. The audit supersedes forward-looking
package, Electron, native, MWMR, topology, handoff, layout, and release claims in
this tree.

Historical files are intentionally retained so implementation decisions,
correctness gaps, and donor provenance remain reviewable. Do not delete or
rewrite them merely to make the archive appear internally consistent.

## Historical collections

- [Architecture](./architecture/INDEX.md): the former conceptual book covering
  DSL, roles, concurrency, planes, backings, handoff, and golden flow.
- [ADRs and design records](./adr/INDEX.md): accepted, proposed, superseded, and
  speculative SeqWire decisions. They no longer override the convergence audit.
- [Guides](./guides/INDEX.md): former usage and topology guidance.
- [Internals](./internals/INDEX.md): implementation invariants and diagnostics
  notes, some of which have drifted from source behavior.
- [Appendix](./appendix/INDEX.md): shelved helpers and visual notes.
- [Performance](./performance/INDEX.md): dated SeqWire benchmark artifacts, not
  Exclave baselines.

## How to use this archive

Use these documents to answer narrow historical questions:

- What did SeqWire implement or intend?
- Which invariants, tests, benchmark cases, or proof workloads may inform
  Exclave work?
- Where do documentation claims conflict with implementation?
- Why must a capability be ported, rebuilt, kept in a lab, deleted as an active
  surface, or retained only as history?

Do not use them to start a new integration, reconstruct a production ABI, or
infer that SeqWire is still a release target.

## Important historical clusters

### Implemented core research

- [Concurrency model and roles](./architecture/03-seqwire-concurrency-model-and-roles.md)
- [DSL overview](./architecture/04-seqwire-dsl-overview-and-rationale.md)
- [Primitives and seqlock](./architecture/10-seqwire-primitives-and-seqlock.md)
- [Backing and plane layout](./architecture/11-seqwire-backing-and-plane-layout.md)
- [Coherent reads and planes](./architecture/12-coherent-reads-and-planes.md)

These explain implemented SeqWire mechanisms. They do not grant those
mechanisms Exclave ownership or compatibility.

### Speculative topology and platform direction

- [Electron multi-process runtimes](./adr/ADR-00E-electron-multi-process-runtimes.md)
- [Compose/package-family proposal](./adr/ADR-00X-introduce-seqwire-compose-for-system-level-composition.md)
- [MWMR architecture](./adr/ADR-00Y-mwmr-architecture.md)
- [Ring primitive](./adr/ADR-010-ring-primitive-in-seqwire-core.md)
- [MWMR ground truth](./adr/ADR-011-mwmr-ground-truth.md)

These are historical only. They must not be used as a production Electron,
native, package, or lifecycle plan.

### Donor and lab candidates

- enum and caller-owned snapshot techniques;
- bounded-read, property, and cross-thread test scenarios;
- grouped validation-before-publication cases;
- structured errors and diagnostics methods;
- package-smoke and benchmark methodology; and
- the Signalsmith AudioWorklet workload.

Their exact classification, target owner, dependencies, risks, migration order,
and behavior changes are recorded in the convergence audit.
