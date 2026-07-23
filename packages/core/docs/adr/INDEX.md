# SeqWire ADR and Design Index

These documents record decisions and proposals made during SeqWire's
development. Their status applies to SeqWire only. It does not make the project
a dependency of another runtime or promise a shipped application integration.

## Reading rules

- Preserve prior reasoning and dates.
- Verify implementation descriptions against current source and tests.
- Treat `Proposed`, `Informational`, and `Superseded` records accordingly.
- Treat accepted decisions as SeqWire decisions, not as general application
  architecture.
- Describe Dekzer examples as research motivation, never as current use.

## ADRs

- [ADR-00C: Meter writes and snapshot into](./ADR-00C-meter-writes-and-snapshot-into.md)
- [ADR-00D: Primitives internal and pruned](./ADR-00D-primitives-internal-and-pruned.md)
- [ADR-00E: Electron multi-process runtimes](./ADR-00E-electron-multi-process-runtimes.md)
- [ADR-00F: Controller params hydrate](./ADR-00F-controller-params-hydrate.md)
- [ADR-00X: Compose and package-family proposal](./ADR-00X-introduce-seqwire-compose-for-system-level-composition.md)
- [ADR-00Y: MWMR architecture](./ADR-00Y-mwmr-architecture.md)
- [ADR-00Z: Observer binding role](./ADR-00Z-observer-binding-role.md)
- [ADR-010: Ring primitive](./ADR-010-ring-primitive-in-seqwire-core.md)
- [ADR-011: MWMR ground truth](./ADR-011-mwmr-ground-truth.md)

## Design documents

- [DESIGN-002: WebGPU digital twin pattern](./DESIGN-002-webgpu-digital-twin-pattern.md)
- [DESIGN-003: Telemetry bridge pattern](./DESIGN-003-telemetry-bridge-pattern.md)

New ADRs should state whether they document current implementation, a proposed
research direction, or historical context.
