# Install

> [!CAUTION]
> Do not install SeqWire for new work. The package is frozen, unpublished, and private while useful evidence is
> migrated to Exclave. See the [Exclave convergence audit](/exclave-convergence).

Install the public package in the application or library that owns the boundary contract:

```sh
pnpm add @exclave/seqwire
```

Other package managers can install the same package:

```sh
npm install @exclave/seqwire
yarn add @exclave/seqwire
```

Import from the root package for the runtime flow:

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
```

Import diagnostics from the diagnostics subpath:

```ts
import { probeEnv, snapshotCounters } from "@exclave/seqwire/diagnostics";
```

## Runtime Requirements

`@exclave/seqwire` uses `SharedArrayBuffer` for shared backing memory. In browsers, pages must be cross-origin isolated before `SharedArrayBuffer` is available. In Node.js, worker-thread usage depends on the Node version and host runtime.

Run the diagnostics probe during integration rather than discovering support problems from a hot path:

```ts
import { probeEnv } from "@exclave/seqwire/diagnostics";

const summary = probeEnv();

if (!summary.hasSharedArrayBuffer) {
  throw new Error("SharedArrayBuffer is unavailable in this runtime");
}
```

## Package Shape

The public package is ESM-only and typed. The supported import paths are:

| Import | Use |
| --- | --- |
| `@exclave/seqwire` | Spec, planning, backing, handoff, bindings, enum helpers, and structured errors. |
| `@exclave/seqwire/diagnostics` | Environment probes, counters, and mapped view descriptions. |

Internal folders under `packages/core/src` are not public API.
