# FAQ

> [!WARNING]
> Historical donor reference only. Current ownership and repository status are defined by the
> [Exclave convergence audit](/exclave-convergence).

## What Does the Exclave Scope Mean?

`@exclave` is only the npm scope. The package and product name are SeqWire, and current integrations should target `@exclave/seqwire`.

## Is This AudioWorklet-Only?

No. Audio is a useful first example because it makes timing sensitivity obvious. The package models shared-memory boundaries for timing-sensitive systems more generally.

## Does It Replace Message Passing?

No. Message passing can carry a handoff. SeqWire defines the shared-memory contract that the handoff represents.

## Why Dot Keys?

Dot keys make the runtime contract flat and deterministic while keeping the authored AST readable. They also make memory layout, snapshots, diagnostics, and handoff validation easier to inspect.

## Why Do Processor Enum Params Read as Numbers?

The controller side accepts enum labels because it is the softer integration side. The processor side sees numeric indices because the runtime view is backed by shared memory. Use enum helpers when translating values for UI or logging.

## Can I Hold Onto Array Views from `within(...)` or `stage(...)`?

No. Array views exposed inside callbacks are ephemeral. Copy the data if you need to retain it after the callback returns.

## Can I Import Internal Modules?

No. Use the root package and diagnostics subpath. Internal modules can change without public compatibility guarantees.

## Are Domain Semantics Built In?

No. SeqWire provides typed params, meters, plans, backings, handoff validation, bindings, diagnostics, and structured errors. Domain commands and higher-level orchestration belong outside the package.
