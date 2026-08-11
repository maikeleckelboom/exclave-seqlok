# Architecture Documents

This folder mixes current low-level reference material with earlier design
generations. It is not the public API reference. Start with the current
[VitePress documentation](../../../../apps/docs/src/index.md) and use the table
below to interpret individual records.

| Document | Status | Use |
| --- | --- | --- |
| [00 - Origin and design history](./00-seqwire-origin-and-design-history.md) | Historical rationale | The AudioWorklet motivation and early design bets. |
| [01 - Goals and non-goals](./01-seqwire-goals-and-non-goals.md) | Historical design record | Early goals; several examples predate v0.3.0. |
| [02 - Intellectual heritage](./02-seqwire-intellectual-heritage.md) | Historical rationale | Prior art and terminology that influenced the project. |
| [03 - Concurrency model and roles](./03-seqwire-concurrency-model-and-roles.md) | Superseded | Overstates controller snapshot coherence; use [Roles](../../../../apps/docs/src/roles.md) and [Memory and layout](../../../../apps/docs/src/memory-layout.md). |
| [04 - DSL overview and rationale](./04-seqwire-dsl-overview-and-rationale.md) | Historical rationale | Earlier DSL explanation; use [Authoring contract](../../../../apps/docs/src/authoring-contract.md) for current shapes. |
| [05 - Enum arrays](./05-enum-arrays-runtime-behavior.md) | Historical rationale | Design exploration around enum arrays; verify current helpers in the API. |
| [06 - Object model rationale](./06-object-model-rationale.md) | Historical rationale | Why the explicit functional pipeline was chosen. |
| [07 - API shape rationale](./07-seqwire-api-shape-rationale.md) | Historical rationale | Earlier reasoning about explicit plan, backing, and handoff arguments. |
| [08 - API and naming rationale](./08-seqwire-api-and-naming-rationale.md) | Superseded | Contains rejected and older API shapes. |
| [09 - API reference](./09-seqwire-api-reference.md) | Superseded | Replaced by the current [API reference](../../../../apps/docs/src/api.md) and exports. |
| [10 - Primitives and seqlock](./10-seqwire-primitives-and-seqlock.md) | Superseded implementation reference | The dual-counter model remains useful, but retry, exception, binding, and allocation descriptions have drifted. |
| [11 - Backing and plane layout](./11-seqwire-backing-and-plane-layout.md) | Historical implementation reference | Layout mechanics remain useful; handoff, WASM growth, and allocation statements are not current guarantees. |
| [12 - Coherent reads and planes](./12-coherent-reads-and-planes.md) | Superseded | Preserves a broader snapshot-policy design that v0.3.0 does not fully implement. |
| [13 - Kernel implementation notes](./13-implementation-notes-kernel.md) | Historical implementation notes | Mixed current mechanics and older allocation/coherence claims. |
| [14 - ABA and wraparound](./14-seqwire-aba-wraparound-not-a-bug.md) | Historical rationale | Earlier counter analysis; use implementation and wraparound tests for current behavior. |
| [15 - Error system](./15-seqwire-error-system-and-fail-fast-philosophy.md) | Historical rationale | Earlier error catalog and philosophy; use [Error model](../../../../apps/docs/src/error-model.md) now. |
| [16 - E2E visual guide](./16-seqwire-e2e-flow-visual-guide.md) | Superseded | Contains mixed-generation flow and snapshot claims. |
| [17 - Hot and cold paths](./17-hot-vs-cold-path-design-philosophy.md) | Historical rationale | Useful performance intent, not an allocation guarantee. |
| [18 - SWSR ring primitive](./18-command-ring-swsr.md) | Current low-level reference | The public usable-capacity SWSR contract, including full, drain, replay, ordering, and statistics semantics. |

No document in this folder overrides the exported source or tests. Historical
records are intentionally retained because they explain rejected directions and
the evolution of the current package.
