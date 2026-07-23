# SeqWire Documentation Index

This tree records SeqWire's implemented architecture, design rationale,
exploratory proposals, and performance work. It belongs to SeqWire itself. It
does not define a dependency on another repository.

Use the status of each document to distinguish implemented behavior from
proposed or superseded directions. Verify implementation claims against current
source and tests when making architectural decisions.

## Collections

- [Architecture](./architecture/INDEX.md): contracts, roles, concurrency,
  planes, backings, handoff, coherent reads, and the main runtime flow
- [ADRs and design records](./adr/INDEX.md): accepted, proposed, informational,
  and superseded SeqWire decisions
- [Guides](./guides/INDEX.md): focused API and topology explanations
- [Internals](./internals/INDEX.md): implementation invariants and diagnostic
  notes
- [Appendix](./appendix/INDEX.md): shelved helpers and visual notes
- [Performance](./performance/INDEX.md): benchmark methodology and historical
  measurements

## Implemented core research

- [Concurrency model and roles](./architecture/03-seqwire-concurrency-model-and-roles.md)
- [DSL overview](./architecture/04-seqwire-dsl-overview-and-rationale.md)
- [Primitives and seqlock](./architecture/10-seqwire-primitives-and-seqlock.md)
- [Backing and plane layout](./architecture/11-seqwire-backing-and-plane-layout.md)
- [Coherent reads and planes](./architecture/12-coherent-reads-and-planes.md)

These documents explain the implemented TypeScript shared-memory surface.

## Exploratory system directions

- [Electron multi-process runtimes](./adr/ADR-00E-electron-multi-process-runtimes.md)
- [Compose proposal](./adr/ADR-00X-introduce-seqwire-compose-for-system-level-composition.md)
- [MWMR architecture](./adr/ADR-00Y-mwmr-architecture.md)
- [Ring primitive](./adr/ADR-010-ring-primitive-in-seqwire-core.md)
- [MWMR ground truth](./adr/ADR-011-mwmr-ground-truth.md)

These records range from informational to accepted implementation decisions.
They are not evidence of a shipped Electron or native runtime, and they do not
establish a Dekzer integration.

## Relationship to other research

SeqWire and Projection Runtime are separate projects. See
[Research lineage](../../../apps/docs/src/research-lineage.md) for their
different scopes and the absence of runtime dependencies.
