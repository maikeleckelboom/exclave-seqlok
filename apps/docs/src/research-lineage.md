# Research Lineage

SeqWire and Projection Runtime are separate research projects. They share a
history of investigating explicit contracts and timing-sensitive state, but
they have different scopes, implementations, and public identities.

## SeqWire

SeqWire explores typed, coherent shared-memory state across workers,
AudioWorklets, and WebAssembly-oriented runtimes. Its implementation includes:

- TypeScript-authored parameter and meter contracts
- deterministic shared-memory layout
- explicit handoff and validation
- controller, processor, and observer bindings
- bounded coherent reads and retained last-good values
- grouped publication
- worker and property tests
- benchmarks and package smoke tests
- the Signalsmith Stretch AudioWorklet proof

SeqWire owns this research surface. It may continue to evolve independently as
experimental shared-memory work.

## Projection Runtime

Projection Runtime investigates the wider Electron-to-native-Rust problem. Its
scope includes authority, generated cross-language contracts, bounded
publication, resource access, process supervision, sessions, reload, crash
recovery, and continuity.

Projection Runtime does not use SeqWire. SeqWire does not generate canonical
Projection Runtime artifacts, and no SeqWire package sits in its runtime path.

## Relationship

The projects have no runtime dependency in either direction. Similar ideas were
investigated at different layers and points in time. Tests, failure cases, or
implementation lessons may have historical overlap, but there is no promise of
public API, layout, ABI, or lifecycle compatibility.

`@exclave` is an npm publishing namespace used by packages in both workspaces.
It does not make one project subordinate to the other.

Dekzer motivated some of the underlying systems questions. Neither SeqWire nor
Projection Runtime is a shipped Dekzer dependency, and neither repository
should be described as the runtime behind Dekzer.

## Historical records

SeqWire retains architecture documents and ADRs that describe implemented,
proposed, and superseded directions. They remain useful as research history.
Their individual status does not establish a dependency on Projection Runtime
or assign SeqWire's future to another repository.
