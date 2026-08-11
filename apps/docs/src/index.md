---
layout: home
hero:
  name: SeqWire
  text: Typed shared memory for JavaScript runtimes
  tagline: Define parameters and meters once, plan their memory layout, and bind workers or AudioWorklets to the same backing.
  actions:
    - theme: brand
      text: Run the quickstart
      link: /quickstart
    - theme: alt
      text: Understand the core flow
      link: /core-flow
features:
  - title: One authored contract
    details: Nested TypeScript definitions become canonical parameter and meter paths used by planning and bindings.
  - title: Deterministic layout
    details: Planning produces stable byte sizes, offsets, typed planes, and a layout identity before memory is allocated.
  - title: Role-specific bindings
    details: Controllers write parameters, processors publish meters, and observers read without receiving write capabilities.
  - title: Bounded read paths
    details: Processor parameter reads require bounded verification; observer snapshots attempt it before applying explicit fallback policy. Controller meter snapshots remain direct cold-path copies.
---

## Choose an entry point

- **Understand the model:** follow the [SeqWire flow](/core-flow) from authored
  contract through deterministic layout, backing ownership, validated handoff,
  and role-specific bindings.
- **Run working code:** use the [quickstart](/quickstart) for the smallest
  complete local flow with current exported APIs.
- **Inspect an executable integration:** read the
  [Signalsmith proof record](https://github.com/maikeleckelboom/seqwire/blob/main/docs/proofs/signalsmith-stretch.md)
  alongside the
  [proof application](https://github.com/maikeleckelboom/seqwire/tree/main/apps/signalsmith-stretch).
- **Review performance measurements:** start with the
  [benchmark guide](https://github.com/maikeleckelboom/seqwire/blob/main/packages/core/bench/README.md),
  which explains the harness and the limits of the recorded results.
- **Read design history:** use the repository's
  [documentation index](https://github.com/maikeleckelboom/seqwire/blob/main/packages/core/docs/INDEX.md),
  which separates current references from historical and superseded records.

## Current documentation and design history

Pages in this VitePress site describe the current package surface and runtime
model. The older architecture, guide, internal-note, and ADR collections are
kept as design history. Their indexes state which records remain useful current
references and which describe superseded APIs or exploratory system designs.

## Project status

SeqWire is standalone experimental research. The intended package identity is
`@exclave/seqwire`, which is private and unpublished. Use the repository
checkout for study and verification.

SeqWire and Projection Runtime have no runtime dependency in either direction.
See [Research lineage](/research-lineage) for the concise historical boundary.
