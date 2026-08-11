# SeqWire Documentation Index

The current package contract is defined by the exported source, package
metadata, and tests. The VitePress pages under
[`apps/docs/src`](../../../apps/docs/src/index.md) are the maintained
explanation of that contract.

The collections below also preserve design work from earlier SeqWire versions.
Their own indexes identify current references, historical rationale, and
superseded material. A document marked historical may explain why an idea was
explored without describing v0.3.0 behavior.

## Current reference

- [Quickstart](../../../apps/docs/src/quickstart.md)
- [Core flow](../../../apps/docs/src/core-flow.md)
- [Roles](../../../apps/docs/src/roles.md)
- [Memory and layout](../../../apps/docs/src/memory-layout.md)
- [Handoff and acceptance](../../../apps/docs/src/handoff-acceptance.md)
- [API reference](../../../apps/docs/src/api.md)
- [Package boundaries](../../../apps/docs/src/package-boundaries.md)
- [Package README](../README.md)

## Design and research collections

- [Architecture](./architecture/INDEX.md): one current low-level ring reference
  plus historical and superseded design documents
- [ADRs and design records](./adr/INDEX.md): accepted decisions, proposals, and
  records whose implementation status changed later
- [Guides](./guides/INDEX.md): one current enum guide plus historical onboarding
  and topology material
- [Internals](./internals/INDEX.md): superseded implementation-policy drafts
- [Appendix](./appendix/INDEX.md): explicitly shelved helpers
- [Performance](./performance/INDEX.md): benchmark methodology and generated
  historical measurements

## Executable evidence

- [Signalsmith Stretch integration record](../../../docs/proofs/signalsmith-stretch.md)
- [Benchmark guide](../bench/README.md)
- Public-flow, handoff, type, contention, worker, property, and package-smoke
  tests under [`packages/core/tests`](../tests)

SeqWire and Projection Runtime are separate projects. Their relationship is
summarized in [Research lineage](../../../apps/docs/src/research-lineage.md).
