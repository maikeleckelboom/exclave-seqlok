# Diagnostics

Diagnostics live at `@exclave/seqlok/diagnostics`. They are for integration work, support checks, counters, and view inspection. They are not meant to become part of a processor hot path.

## Environment Probe

```ts
import {
  assertSabSupportFromSummary,
  probeEnv,
} from "@exclave/seqlok/diagnostics";

const summary = probeEnv();
assertSabSupportFromSummary("docs.integration", summary);
```

Use this before constructing shared backing in browser integrations. A browser page usually needs cross-origin isolation before `SharedArrayBuffer` is available.

## Counters

```ts
import { resetCounters, snapshotCounters } from "@exclave/seqlok/diagnostics";

resetCounters();
const counters = snapshotCounters();
```

Counters are useful for tests, stress harnesses, and support reports. Treat them as observability aids rather than application state.

## View Descriptions

`describeViews(...)` summarizes mapped backing views for diagnostics. Use it to confirm an integration is interpreting the expected plan/backing pair.

## Diagnostics Scope

Diagnostics can report what the package can observe: environment support, internal counters, and mapped view shape. They do not manage worker lifecycle, application health policy, or UI alerting.
