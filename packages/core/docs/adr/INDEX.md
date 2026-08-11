# SeqWire ADR and Design Index

These records preserve decisions and proposals made during SeqWire's
development. Status here describes their relationship to v0.3.0; the original
reasoning remains in each file.

| Record | Current interpretation |
| --- | --- |
| [ADR-00C: Meter writes and snapshot into](./ADR-00C-meter-writes-and-snapshot-into.md) | Accepted historical API-shape decision. Meter writers and `into` remain, but its controller coherence discussion is superseded. |
| [ADR-00D: Primitives internal and pruned](./ADR-00D-primitives-internal-and-pruned.md) | Partially superseded when the SWSR ring became a public root export. Seqlock and atomic helpers remain internal. |
| [ADR-00E: Electron multi-process runtimes](./ADR-00E-electron-multi-process-runtimes.md) | Future-oriented historical research, not current SeqWire runtime behavior. |
| [ADR-00F: Controller params hydrate](./ADR-00F-controller-params-hydrate.md) | Accepted and implemented by `controller.params.hydrate(...)`. |
| [ADR-00X: Compose proposal](./ADR-00X-introduce-seqwire-compose-for-system-level-composition.md) | Superseded proposal. |
| [ADR-00Y: MWMR architecture](./ADR-00Y-mwmr-architecture.md) | Proposed system-composition research, not the core package model. |
| [ADR-00Z: Observer binding role](./ADR-00Z-observer-binding-role.md) | Historical proposal. The observer shipped later; use current role/API docs for its behavior. |
| [ADR-010: Ring primitive](./ADR-010-ring-primitive-in-seqwire-core.md) | Accepted rationale; implemented with later API, capacity, overflow, and allocation refinements documented in the current SWSR reference. |
| [ADR-011: MWMR ground truth](./ADR-011-mwmr-ground-truth.md) | Accepted historical system-design record, not current package API authority. |
| [DESIGN-002: WebGPU digital twin](./DESIGN-002-webgpu-digital-twin-pattern.md) | Exploratory integration pattern; no WebGPU adapter ships in SeqWire. |
| [DESIGN-003: Telemetry bridge](./DESIGN-003-telemetry-bridge-pattern.md) | Exploratory integration pattern; no network bridge ships in SeqWire. |

Accepted means that a decision was accepted at the time. It does not imply that
every example or implementation description remains current after later
versions. Current API behavior is documented in the
[VitePress API reference](../../../../apps/docs/src/api.md) and proven by source
and tests.
