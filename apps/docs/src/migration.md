# Migration from Earlier Package Names

Current integrations should use `@exclave/seqlok`. Older names may appear only in historical notes or frozen artifacts, not in current public examples.

## Import Path

Use the current package import:

```ts
import { defineSpec } from "@exclave/seqlok";
```

Do not use old prototype package names in new code or docs.

## Vocabulary

- Use Seqlok for the public package and docs.
- Use `seqlock` only for the concurrency primitive.

## Practical Changes

| Prototype-era habit | Current guidance |
| --- | --- |
| Importing prototype package names. | Import `@exclave/seqlok`. |
| Treating docs as repository archaeology. | Explain the current package contract first. |
| Reconstructing layout on both sides. | Build a handoff from one plan and accept it at the boundary. |
| Treating audio as the only domain. | Use audio as the clearest first example, not the abstraction limit. |
| Importing internals for convenience. | Stay on root exports or `@exclave/seqlok/diagnostics`. |

## Runtime Semantics

The public package is a typed shared-memory contract, not a full application runtime. Orchestration, transport protocols, worker lifecycle management, and domain-specific command semantics stay outside `@exclave/seqlok`.
