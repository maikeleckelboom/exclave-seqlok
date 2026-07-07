# Seqlok

Seqlok is a typed shared-memory contract for coherent runtime state. It uses a seqlock-backed shared-memory protocol internally, while exposing higher-level spec, layout, handoff, controller, processor, and observer bindings.

The npm org `@exclave` stays the package scope. `@exclave/seqlok` is the package name and Seqlok is the standalone product identity.

The package is ESM-only, typed, MIT licensed, and marked `sideEffects: false`.

## Install

```sh
pnpm add @exclave/seqlok
```

## Flow

```text
defineSpec
  -> planLayout
  -> allocatePacked / allocatePartitioned / allocateWasm
  -> bindController(spec, plan, backing)
  -> buildHandoff(plan, backing)
  -> bindProcessor / bindObserver
```

Use `acceptHandoff(...)` when the inbound handoff value is `unknown`, such as
data received through `postMessage`.

## Example

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
      count: param.u32({ min: 0, max: 1000 }),
    },
  },
  meters: {
    runtime: {
      state: meter.enum(["idle", "busy"]),
      delta: meter.i32(),
    },
  },
}));

const plan = planLayout(spec);
const backing = allocatePacked(plan);
const handoff = buildHandoff(plan, backing);

const controller = bindController(spec, plan, backing);
const processor = bindProcessor(handoff);

controller.params.set("runtime.enabled", true);
controller.params.set("runtime.count", 7);

processor.params.within((params) => {
  if (params.runtime.enabled) {
    processor.meters.publish((meters) => {
      meters.setGroup("runtime", {
        delta: -1,
        state: 1,
      });
    });
  }
});
```

## Spec Contract

`defineSpec()` accepts an authored AST or a plain canonical object. Authored specs may use nested namespaces. Write APIs use explicit canonical string keys, and processor read views expose nested aliases:

```ts
params.runtime.enabled;
params.runtime.count;
```

Anonymous specs receive deterministic `anon_<hash>` ids derived from canonical contents.

## Grouped Meter Publishing

Use `processor.meters.publishGroup("runtime", values)` when a processor already has a typed object for one exact schema meter group. Inside a larger coherent meter publish section, use `writer.setGroup("runtime", values)` alongside direct `writer.set("runtime.key", value)` calls or staged array writes.

Grouped publishing maps unprefixed keys under one exact schema group; it is not arbitrary object flattening. Build derived values such as enum indices, split frame counters, and latency seconds explicitly before publishing the group. `publishGroup(...)` is convenience-oriented, so benchmark it before using it in a hard hot path.

## Package Surface

This package publishes one runtime package: `@exclave/seqlok`. Internal base, schema, and primitive layers are implementation details unless exported from the root package or `@exclave/seqlok/diagnostics`.

The packed package must not contain `workspace:*` runtime dependencies. Run:

```sh
pnpm -F @exclave/seqlok run test:pack
```

## Development

```sh
pnpm -F @exclave/seqlok run build
pnpm -F @exclave/seqlok run test
pnpm -F @exclave/seqlok run test:types
pnpm -F @exclave/seqlok run bench
```

## Documentation

The VitePress docs site lives in `apps/docs`. Historical design notes remain under `packages/core/docs`; treat them as architecture history when they go beyond the current public package boundary.
