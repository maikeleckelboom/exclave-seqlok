# FAQ

## What Does the `@exclave` Scope Mean?

`@exclave` is only the future npm publishing scope. The project and package
display name is SeqWire. The package identity is `@exclave/seqwire`, but it is
not currently published.

## Is This AudioWorklet-Only?

No. Audio is a useful first example because it makes timing sensitivity obvious. The package models shared-memory boundaries for timing-sensitive systems more generally.

## Does It Replace Message Passing?

No. Message passing can carry a handoff. SeqWire defines the shared-memory contract that the handoff represents.

## Why Dot Keys?

Dot keys make the runtime contract flat and deterministic while keeping the authored AST readable. They also make memory layout, snapshots, diagnostics, and handoff validation easier to inspect.

## Why Do Processor Enum Params Read as Numbers?

The controller side accepts enum labels because it is the softer integration side. The processor side sees numeric indices because the runtime view is backed by shared memory. Use enum helpers when translating values for UI or logging.

## Can I Hold Onto Array Views from Processor `within(...)` or `stage(...)`?

No. Processor `params.within(...)` arrays and controller/processor `stage(...)`
arrays are ephemeral shared views. Copy data you need after the callback.
Observer snapshots and observer `params.within(...)` return detached array
copies instead.

## Can I Import Internal Modules?

No. Use the root package and diagnostics subpath. Internal modules can change without public compatibility guarantees.

## Are Domain Semantics Built In?

No. SeqWire provides typed params, meters, plans, backings, handoff validation, bindings, diagnostics, and structured errors. Domain commands and higher-level orchestration belong outside the package.

## Does SeqWire Power Dekzer?

No. Dekzer helped motivate some of the systems questions, but SeqWire is not
used by Dekzer and is not planned as a Dekzer dependency.

## Is SeqWire Part of Projection Runtime?

No. The projects are independent and have no runtime dependency in either
direction. See [Research lineage](/research-lineage).
