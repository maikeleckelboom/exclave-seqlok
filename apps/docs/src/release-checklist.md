# Release Checklist

Run these checks before publishing `@exclave/seqwire`.

```sh
pnpm install
pnpm format
pnpm lint
pnpm test:types
pnpm test
pnpm build
pnpm run docs
pnpm docs:build
pnpm test:pack
pnpm --filter @exclave/seqwire pack
```

## Package Checks

- `packages/core/package.json` is named `@exclave/seqwire`.
- `private` is absent from `packages/core/package.json`.
- `license`, `repository`, `keywords`, `publishConfig`, `sideEffects`, `exports`, and `files` are correct.
- `pnpm --filter @exclave/seqwire pack` includes only release files.
- The packed package installs in a fresh consumer.
- The installed package has no `workspace:*` runtime dependencies.

## API Checks

- Nested authored specs flatten to canonical dot keys.
- Plain canonical object specs compile equivalently.
- Anonymous ids are deterministic.
- Expanded param and meter kinds are covered by tests.
- Binding factories return structured errors for invalid call shapes.
- `SeqWireError` narrowing works for unknown catches.

## Documentation Review

- Install and quickstart import `@exclave/seqwire`.
- Twoslash examples compile against workspace source or built declarations.
- Blog and concept pages describe the current API, not the old prototype branch.
- Audio examples are framed as the clearest first use case, not the only domain.
- Public docs use `SeqWire` as the product identity and `seqlock` only as the primitive term.

## Publish Steps

```sh
pnpm --filter @exclave/seqwire pack
pnpm --filter @exclave/seqwire publish --access public --dry-run
pnpm --filter @exclave/seqwire publish --access public
```
