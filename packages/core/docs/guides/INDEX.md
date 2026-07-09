# Guides

Deep-dive documents for `@exclave/seqwire`.

These are focused walkthroughs and patterns that build on the main README and API reference. They assume you already
know the basic golden flow:

> `defineSpec → planLayout → allocatePacked/allocateWasm → buildHandoff → acceptHandoff → bindController / bindProcessor`

Guide filenames, headings, imports, and package references should use SeqWire and `@exclave/seqwire`.

---

## Available guides

### Architecture & Topology

- [From Pipe to Hub: Understanding SeqWire Architecture](./understanding-seqwire-mwmr-from-pipe-to-hub.md)
  Evolution from a simple SWSR pipe to a system-level MWMR topology using rings, a hub controller, and observers.

- [Architecture: From Pipe to Hub](./architecture-from-pipe-to-hub-onboarding.md)
  Narrative onboarding story that explains why the system grew rings, hubs, and observers instead of mutating the core
  SWMR model.

### Mindset & Hot Path

- [Onboarding: SeqWire Mindset and Hot Path](./onboarding-seqwire-mindset-and-hot-path.md)
  How to think in loops instead of events, live with the **zero-GC** rule, and reason about cold-path vs hot-path
  code when building on SeqWire.

### Utilities & UI Wiring

- [Enum helpers & UI wiring](./enum-helpers.md)
  How to drive UI controls, legends, and fixtures directly from enum params/meters using:

  - `enumValues`
  - `enumPaletteFor`
  - `enumArrayToLabels` / `enumLabelsToArray`
  - `enumIndexFromLabel` / `getEnumLabelForIndex`

More guides can land here over time as we standardize recurring patterns in real demos.

---
