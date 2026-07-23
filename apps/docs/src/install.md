# Local Setup

SeqWire is not published on npm. A live registry lookup on 2026-07-23 returned
`E404`, and the workspace package remains private. Clone the repository to run
the project or study the package.

## Requirements

- Node.js 24
- The pnpm version pinned in the root `package.json`

Install the locked workspace:

```sh
pnpm install --frozen-lockfile
```

Build and verify the package:

```sh
pnpm build
pnpm test
pnpm test:pack
```

The local package imports used by tests, documentation, and proof applications
are:

```ts
import {
  acceptHandoff,
  allocatePacked,
  bindController,
  bindProcessor,
  buildHandoff,
  defineSpec,
  planLayout,
} from "@exclave/seqwire";

import { probeEnv, snapshotCounters } from "@exclave/seqwire/diagnostics";
```

These examples describe the future package identity and the local workspace
surface. They are not registry installation instructions.

## Runtime requirements

SeqWire uses `SharedArrayBuffer` for shared backing memory. Browser pages must be
cross-origin isolated before `SharedArrayBuffer` is available. Node.js
worker-thread use depends on the host runtime.

Probe support during setup rather than discovering it from a timing-sensitive
path:

```ts
import { probeEnv } from "@exclave/seqwire/diagnostics";

const summary = probeEnv();

if (!summary.hasSharedArrayBuffer) {
  throw new Error("SharedArrayBuffer is unavailable in this runtime");
}
```

## Package shape

The built research artifact is ESM-only and typed:

| Import | Use |
| --- | --- |
| `@exclave/seqwire` | Contract authoring, planning, backing, handoff, bindings, enum helpers, and structured errors |
| `@exclave/seqwire/diagnostics` | Environment probes, counters, and mapped view descriptions |

Internal folders under `packages/core/src` are not public API.
