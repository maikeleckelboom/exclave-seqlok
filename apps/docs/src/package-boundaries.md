# Package Boundaries

The public package boundary is:

```text
@exclave/seqwire
@exclave/seqwire/diagnostics
```

Use root exports for the boundary flow. Use diagnostics exports for support checks and instrumentation.

```ts
import { defineSpec, planLayout } from "@exclave/seqwire";
import { snapshotCounters } from "@exclave/seqwire/diagnostics";
```

Do not import internal files from `packages/core/src`. Internal modules may change without semver guarantees unless they are exported from `@exclave/seqwire` or `@exclave/seqwire/diagnostics`.

## What Belongs Inside the Package

- Spec authoring helpers and canonical spec types.
- Deterministic layout planning.
- Supported packed and partitioned backing allocation.
- Handoff construction and acceptance.
- Controller, processor, and observer bindings.
- Enum helpers, structured errors, and diagnostics helpers.

## What Does Not Belong Inside the Package

- Worker, worklet, or process lifecycle orchestration.
- Domain-specific command protocols.
- UI state management.
- Persistence, preset storage, or project-file formats.
- Application-level retry, reconnect, or deployment policy.

Those layers can use `@exclave/seqwire`, but they should not be hidden inside it.
