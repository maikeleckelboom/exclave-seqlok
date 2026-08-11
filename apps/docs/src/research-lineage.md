# Research Lineage

SeqWire and Projection Runtime are separate repositories with different
implementations and no runtime dependency in either direction.

## SeqWire

SeqWire explores typed shared-memory contracts inside compatible JavaScript and
WebAssembly-oriented runtimes: spec authoring, deterministic layout, backing,
handoff validation, role bindings, seqlock read paths, and an SWSR command ring.

## Projection Runtime

Projection Runtime investigates the wider Electron-to-native-Rust problem,
including generated cross-language contracts, native publication, resource
access, process supervision, sessions, reload, recovery, and continuity.

Projection Runtime does not use SeqWire. SeqWire does not generate canonical
Projection Runtime artifacts, and no SeqWire package sits in its runtime path.

## Relationship

Similar ideas were investigated at different layers and points in time, but
there is no promise of API, layout, ABI, or lifecycle compatibility.

`@exclave` is an npm publishing namespace used by packages in both workspaces.
It does not make one project subordinate to the other.

Dekzer motivated some of the underlying systems questions. Neither repository
is a shipped Dekzer dependency.

## Historical records

SeqWire retains architecture documents and ADRs that describe implemented,
proposed, and superseded directions. Their indexes identify current references
and historical records; none of those records establishes a dependency on
Projection Runtime.
