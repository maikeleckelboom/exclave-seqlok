---
layout: home
hero:
  name: SeqWire
  text: Typed shared-memory contracts for coherent runtime state
  tagline: Spec, layout, handoff, controller, processor, and observer bindings over an internal seqlock-backed shared-memory protocol.
  actions:
    - theme: brand
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: SeqWire Flow
      link: /core-flow
features:
  - title: Authored contracts
    details: Write nested params and meters as a TypeScript-authored surface, then compile them to canonical runtime keys.
  - title: Deterministic layout
    details: Lower the contract into repeatable shared-memory planes before any controller or runtime role binds.
  - title: Explicit handoff
    details: Transfer a concrete handoff artifact across the boundary and validate it before a processor interprets memory.
  - title: Role-specific bindings
    details: Keep controller writes, processor hot-path reads/writes, and observer snapshots on separate public surfaces.
  - title: Diagnostics and errors
    details: Use environment probes, counters, view descriptions, and structured SeqWireError codes for integration work.
  - title: Package boundary
    details: Import from @exclave/seqwire and @exclave/seqwire/diagnostics; internal modules stay private.
---

## What It Is

SeqWire is a typed shared-memory contract for coherent runtime state. It uses a seqlock-backed shared-memory protocol internally, while exposing higher-level spec, layout, handoff, controller, processor, and observer bindings.

`@exclave/seqwire` lets a host side define a runtime state contract once, plan its shared-memory layout, hand it across a worker, worklet, or WASM-oriented boundary, and read or write coherent state through role-specific bindings.

Audio is the clearest first use case because audio runtimes make timing pressure obvious. The abstraction is broader: workers, WebAssembly-oriented runtimes, telemetry loops, and other systems can use the same spec-layout-handoff contract when they need shared state without hidden layout reconstruction.

Start with [Install](/install), follow the [Quickstart](/quickstart), then read the [SeqWire Flow](/core-flow) and [Authored AST vs Runtime](/authoring-contract) pages before integrating across a real worker or worklet boundary.
