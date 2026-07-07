# Seqlok

Seqlok is a typed shared-memory contract for coherent runtime state. It uses a seqlock-backed shared-memory protocol internally, while exposing higher-level spec, layout, handoff, controller, processor, and observer bindings.

This repository contains the `@exclave/seqlok` package, docs, tests, benchmarks, support tooling, and release smoke checks. Integration code should import `@exclave/seqlok`.

## What This Is

Seqlok lets you define a runtime state contract once, plan its shared-memory layout, hand it across a worker, worklet, or WASM-oriented boundary, and read or write coherent state through role-specific bindings.

It makes a runtime boundary explicit:

- what fields exist across the boundary
- where they live in shared memory
- which side writes them
- which side reads them
- how readers avoid half-written state
- how a runtime receives its memory contract without hidden process state

The current vocabulary is controller, processor, observer, params, and meters. Those names describe roles in the shared-memory contract, not a complete application framework.

## Install

```sh
pnpm add @exclave/seqlok
```

`@exclave/seqlok` is ESM-only, typed, and published as one package. Internal base, schema, and primitive layers are kept inside the package rather than exposed as workspace runtime dependencies.

## Quickstart

```ts
import {
  allocatePacked,
  bindController,
  bindProcessor,
  buildHandoff,
  defineSpec,
  planLayout,
} from "@exclave/seqlok";

const spec = defineSpec(({ param, meter }) => ({
  params: {
    runtime: {
      enabled: param.bool(),
      count: param.u32({ min: 0, max: 1_000_000 }),
      payload: param.u8.array(16),
    },
  },
  meters: {
    runtime: {
      state: meter.enum(["idle", "busy", "fault"]),
      delta: meter.i32(),
    },
  },
}));

const plan = planLayout(spec);
const backing = allocatePacked(plan);
const handoff = buildHandoff(plan, backing);

const controller = bindController(spec, plan, backing);
const processor = bindProcessor(handoff);
const runtimeState = 1;

controller.params.set("runtime.enabled", true);
controller.params.set("runtime.count", 42);
controller.params.stage("runtime.payload", (payload) => {
  payload.set([1, 2, 3, 4]);
});

processor.params.within((params) => {
  if (params.runtime.enabled) {
    processor.meters.publish((writer) => {
      writer.set("runtime.state", runtimeState);
      writer.set("runtime.delta", -1);
    });
  }
});

console.log(controller.meters.snapshot());
```

Authored specs may use nested namespaces. Write APIs use explicit canonical string keys, and processor read views expose nested aliases such as `params.runtime.enabled`.

## Meter Publishing

Use `.set()` for the lowest-level explicit canonical-key surface:

```ts
processor.meters.publish((writer) => {
  writer.set("runtime.delta", -1);
});
```

Use `writer.setGroup()` when a group object belongs inside one larger coherent publish section:

```ts
processor.meters.publish((writer) => {
  writer.setGroup("runtime", {
    state: runtimeState,
    delta: -1,
  });
});
```

Use `publishGroup()` when you already have one complete typed group object:

```ts
processor.meters.publishGroup("runtime", {
  state: runtimeState,
  delta: -1,
});
```

Use `writer.set(...)` for partial or dynamic key updates. Use `setGroup(...)`
and `publishGroup(...)` only when publishing a complete schema group.

Grouped keys are unprefixed under the exact schema group, so `delta` maps to
`runtime.delta` in the `runtime` group. `publishGroup()` is the convenience
path. Hard hot paths should benchmark it against direct `writer.set()` calls.

## Package Surface

- `packages/core` publishes `@exclave/seqlok`.
- The package is MIT licensed, ESM, typed, and marked `sideEffects: false`.
- The packed output includes built `dist` files, `README.md`, `LICENSE`, and `package.json`.
- The release smoke test packs the package, installs the tarball into a fresh consumer, imports `@exclave/seqlok`, and verifies there are no `workspace:*` runtime dependencies.

## Documentation

- [Docs site source](apps/docs/src/index.md)
- [Package README](packages/core/README.md)
- [Historical design docs](packages/core/docs/INDEX.md)

Run the docs site locally:

```sh
pnpm docs:dev
```

Build it:

```sh
pnpm run docs
```

## Verification

```sh
pnpm install
pnpm format
pnpm lint
pnpm test:types
pnpm test
pnpm build
pnpm run docs
pnpm test:pack
```

`pnpm verify` runs the repository gate.
