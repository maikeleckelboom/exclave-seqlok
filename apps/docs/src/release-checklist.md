# Verification and Publication Status

SeqWire is experimental and unpublished. The future package name is
`@exclave/seqwire`, but `private: true` prevents publication from this
workspace. A live npm registry lookup on 2026-08-11 returned `E404`.

The existing package smoke test remains valuable because it verifies the shape
of the built artifact without claiming that the package is released.

## Repository gate

From a clean checkout with the repository-pinned toolchain:

```sh
pnpm install --frozen-lockfile
pnpm verify
```

The combined gate covers build, lint, type tests, runtime tests, the Signalsmith
check, documentation, package smoke, and support diagnostics.

Focused commands are:

```sh
pnpm build
pnpm lint
pnpm test:types
pnpm test
pnpm run docs
pnpm test:pack
pnpm signalsmith:check
pnpm signalsmith:test:browser
pnpm support --json
```

`pnpm format` mutates files. `pnpm verify:fresh` invokes destructive cleanup
through `git clean -xfd` and must not run in a worktree with untracked work.

## Package checks

- Packed output contains the declared entry points and type declarations.
- Workspace-only dependencies do not leak into the artifact.
- Proof application files do not enter the package.
- The root export and diagnostics subpath build together.
- Package metadata remains explicit that publication has not occurred.

## Documentation checks

- Public entry points describe SeqWire as standalone experimental research.
- Registry installation commands are absent while the package is unpublished.
- The Signalsmith proof states its exact runtime boundary.
- Proposed and superseded architecture records are identified as history.
- Projection Runtime is described as a separate project with no runtime
  dependency in either direction.
- No page claims that SeqWire powers or ships inside Dekzer.

Publishing, removing the private guard, or establishing release policy requires
a separate objective after registry ownership and release readiness are
verified.
