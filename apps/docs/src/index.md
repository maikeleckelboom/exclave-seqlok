---
layout: home
hero:
  name: SeqWire
  text: Explicit shared-memory contracts
  tagline: Typed, coherent state exchange with deterministic layout, validated handoff, role-specific authority, and bounded reads across independently scheduled JavaScript runtimes.
  actions:
    - theme: brand
      text: Understand the core flow
      link: /core-flow
    - theme: alt
      text: Run the quickstart
      link: /quickstart
    - theme: alt
      text: Inspect the Signalsmith proof
      link: https://github.com/maikeleckelboom/seqwire/blob/main/docs/proofs/signalsmith-stretch.md
features:
  - title: Contract before bytes
    details: TypeScript-authored parameter and meter contracts collapse to canonical field paths before runtime layout exists.
  - title: Deterministic layout
    details: Planning produces stable byte sizes, offsets, typed planes, and a layout identity that can be inspected and tested.
  - title: Explicit ownership
    details: The owner allocates backing and builds a handoff. Receivers validate it before binding controller, processor, or observer capabilities.
  - title: Bounded coherent reads
    details: Seqlock-based reads use explicit budgets and caller-owned last-good values instead of exposing torn candidates or retrying without bound.
  - title: Executable evidence
    details: Worker and property tests, benchmarks, package smoke tests, and a real Signalsmith AudioWorklet proof exercise the implementation.
---

## Choose an entry point

- **Understand the model:** follow the [SeqWire flow](/core-flow) from authored
  contract through deterministic layout, backing ownership, validated handoff,
  and role-specific bindings.
- **Run working code:** use the [quickstart](/quickstart) for the smallest
  complete local flow with current exported APIs.
- **Inspect the boundary:** read the
  [Signalsmith proof record](https://github.com/maikeleckelboom/seqwire/blob/main/docs/proofs/signalsmith-stretch.md)
  beside the
  [proof application](https://github.com/maikeleckelboom/seqwire/tree/main/apps/signalsmith-stretch).
- **Examine performance evidence:** start with the
  [benchmark guide](https://github.com/maikeleckelboom/seqwire/blob/main/packages/core/bench/README.md),
  which treats results as regression radar rather than a production claim.

## What the evidence demonstrates

The Signalsmith application runs a real browser audio graph, the upstream
Signalsmith Stretch WebAssembly release, and a downstream AudioWorklet. SeqWire
models the control and meter boundary. Signalsmith does not directly consume
SeqWire memory, and the application is evidence rather than a shipped audio
runtime.

The wider repository exercises layout identity, handoff validation,
role-specific bindings, bounded coherent reads, grouped publication, worker
contention, package shape, and documentation examples.

## Project status

SeqWire is standalone experimental research. The intended package identity is
`@exclave/seqwire`, which is private and unpublished. Use the repository
checkout for study and verification.

SeqWire and Projection Runtime have no runtime dependency in either direction.
Neither project is a shipped Dekzer dependency. See
[Research lineage](/research-lineage) for the precise historical boundary.
