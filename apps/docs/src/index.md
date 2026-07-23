---
layout: home
hero:
  name: SeqWire
  text: Typed, coherent shared-memory state
  tagline: Experimental TypeScript research for explicit contracts, deterministic layout, handoff, and bounded reads across workers, AudioWorklets, and WebAssembly-oriented runtimes.
  actions:
    - theme: brand
      text: Understand the flow
      link: /core-flow
    - theme: alt
      text: Run it locally
      link: /install
features:
  - title: Authored contracts
    details: TypeScript-authored parameter and meter contracts collapse into canonical field paths before runtime layout exists.
  - title: Deterministic layout
    details: Explicit planning produces stable byte sizes, offsets, typed planes, and a layout identity that can be inspected and tested.
  - title: Explicit handoff
    details: The owner creates backing memory and a transportable handoff. Receivers validate it before role-specific binding.
  - title: Bounded coherent reads
    details: Seqlock-based reads use explicit budgets and retained last-good values instead of exposing torn candidates.
  - title: Grouped publication
    details: Values are validated before a grouped write is published, keeping correlated state coherent for readers.
  - title: Executable evidence
    details: Worker and property tests, benchmarks, package smoke tests, and the Signalsmith AudioWorklet proof exercise the implementation.
---

## Project status

SeqWire is experimental research software. It is implemented, reproducible, and
tested, but it is not presented as production-ready. The future npm package name
is `@exclave/seqwire`. The package remains private and is not published on npm.

Start with the [SeqWire flow](/core-flow) to see how authored contracts,
deterministic planning, backing allocation, handoff, and role-specific bindings
fit together. The [quickstart](/quickstart) walks through the smallest complete
local flow.

The documentation includes current implementation guidance and historical
architecture records. Proposed or superseded directions are identified in the
documentation indexes rather than treated as current commitments.

## Independent research

SeqWire is a standalone project. It does not depend on Projection Runtime, and
Projection Runtime does not depend on SeqWire. Both grew from related systems
questions, but neither is a shipped Dekzer dependency. See
[Research lineage](/research-lineage) for the precise boundary.
