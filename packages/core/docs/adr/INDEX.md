# SeqWire Historical ADR and Design Index

These ADRs and design documents are preserved as architectural history. They are
not current production decisions for Exclave or for the Electron renderer to
native Rust boundary.

The authoritative decision is the
[Exclave convergence and SeqWire disposition audit](../../../../apps/docs/src/exclave-convergence.md).
When an ADR below conflicts with that audit, the audit wins. In particular,
status labels such as `Accepted` inside historical files do not authorize a
SeqWire production package, ABI, Electron topology, native compatibility claim,
or new package family.

## Reading rules

- Preserve ADR files rather than erasing prior reasoning.
- Treat implementation descriptions as evidence to verify against source.
- Treat future-facing topology, lifecycle, platform, and package claims as
  historical proposals unless the convergence audit explicitly ports or
  rebuilds them under Exclave ownership.
- Do not create a replacement SeqWire ADR that competes with Exclave's compiler,
  manifest, layout, authority, resource, or conformance decisions.
- Record any donor extraction against the audit matrix so provenance remains
  mechanical.

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

The Electron, MWMR, topology, ring-doctrine, and package-family records are
classified `ARCHIVE`. Snapshot, grouped-publication, bounded-read, diagnostics,
and test techniques have narrower `PORT`, `REBUILD`, or `LAB` dispositions in
the audit; the surrounding SeqWire ownership model does not move with them.

## Design documents

- [DESIGN-002: WebGPU digital twin pattern](./DESIGN-002-webgpu-digital-twin-pattern.md)
- [DESIGN-003: Telemetry bridge pattern](./DESIGN-003-telemetry-bridge-pattern.md)

These remain historical pattern explorations. Any renewed implementation must
start from an Exclave-authored contract and generated artifacts, not from the
SeqWire Plan, handoff, or role lifecycle.

## New decisions

New production architecture decisions belong with the Exclave owner and its
implementation evidence. This folder may receive only archival annotations or
provenance notes required to keep the donor record understandable.
