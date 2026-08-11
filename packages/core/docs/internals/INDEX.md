# Historical Internal Notes

These files preserve earlier coherence and diagnostics policy work. They are not
current implementation instructions and must not be used as the source of truth
for v0.3.0 behavior.

| Document | Status |
| --- | --- |
| [Coherence implementation checklist](./coherence-implementation-checklist.md) | Superseded implementation plan with conceptual result shapes. |
| [Coherence semantics policy](./coherence-semantics-policy.md) | Superseded policy design; current observer fallback behavior differs. |
| [Diagnostics and seqlock budgets](./diagnostics-seqlock-budgets-binding-level-contract.md) | Draft historical implementation guidance; controller snapshot integration described here did not ship. |

Use the current source under `packages/core/src/binding` and
`packages/core/src/primitives`, their tests, and the VitePress
[Memory and layout](../../../../apps/docs/src/memory-layout.md) page when changing
coherence behavior.
