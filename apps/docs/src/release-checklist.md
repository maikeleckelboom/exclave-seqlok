# Frozen Donor Verification Checklist

SeqWire is a private, unpublished research donor and archive candidate. There
are no package publish steps. The core package is private, has no
`publishConfig`, and a live npm registry lookup found no published version
(`E404`). Do not publish `@exclave/seqwire`, create a release, or add a new
consumer.

The authoritative ownership and disposition record is the
[Exclave convergence audit](/exclave-convergence).

## Why package checks remain

The existing passing pack smoke is retained because it proves that the frozen
private artifact can be inspected in isolation, excludes workspace and
proof-app leakage, and provides a donor technique for Exclave package
conformance. Passing it is not approval to release the package.

## Verification gate

From a clean checkout with the repository-pinned toolchain:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm test:types
pnpm test
pnpm build
pnpm run docs
pnpm test:pack
pnpm signalsmith:check
pnpm signalsmith:test:browser
pnpm support --json
```

`pnpm verify` runs the repository's combined non-release gate. `pnpm format`
mutates files. `pnpm verify:fresh` invokes cleanup including `git clean -xfd`
and must not run in a worktree with untracked user work.

## Frozen-package checks

- No source or documentation change reopens the package as a production
  boundary.
- No new runtime consumer or compatibility promise is introduced.
- Packed output remains isolated from `workspace:*` runtime dependencies.
- Proof application files do not leak into the packed artifact.
- Existing exports still build only so donor tests remain reproducible.
- Benchmark and browser proof results are described as SeqWire research
  evidence, not Exclave production conformance.

## Documentation checks

- Public entry points lead to the convergence audit.
- Exclave is named as sole production owner.
- Older architecture, guide, ADR, and proof pages are marked or navigated as
  historical rather than silently deleted.
- No current page recommends installation, publication, a SeqWire Electron
  topology, or native compatibility.
- The ordered migration queue and archive gates remain current.

## Explicitly forbidden actions

Do not run any public publish command, remove the private guard, recreate
`publishConfig`, create a new generic SeqWire package, import SeqWire into
Exclave, or treat package version metadata as a release instruction. Repository
archive requires an explicit repository-owner decision after the audit's archive
gates pass.
