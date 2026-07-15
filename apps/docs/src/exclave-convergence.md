# Exclave Convergence and SeqWire Disposition

**Status:** Authoritative
**Decision date:** 2026-07-15
**Scope:** `exclave-seqwire` on `main` and its relationship to Exclave

This document is the ownership boundary and disposition record for SeqWire. It
supersedes every forward-looking production claim in SeqWire's older README,
architecture, guide, ADR, proof, and release documents.

## Decision

Exclave is the sole production architecture for the Electron renderer to native
Rust audio-engine boundary.

SeqWire is not that boundary runtime. It is frozen as a private, unpublished
research donor and archive candidate. It may contribute implementation knowledge,
translated tests, benchmark methods, and a future protocol/conformance lab, but
it must not evolve a second compiler, layout authority, compatibility identity,
lifecycle, or shared-memory ABI.

The expected production path is:

1. An Exclave authored projection contract is compiled.
2. The canonical manifest and hot layout are the only ABI authority.
3. Generated Rust authority code publishes into an authority-owned native
   shared mapping.
4. An Electron host adapter brokers a revocable mapping descriptor and hot
   handle.
5. A generated TypeScript consumer validates and opens a read-only binding.
6. Reads are bounded and coherent, retain owned last-good state, and never
   expose a torn candidate.
7. Authority restart invalidates the old handle even when its bytes remain
   physically reachable.
8. The consumer receives a new authority epoch, remaps, and explicitly rebases
   continuity.
9. Rust and TypeScript remain locked through byte-level conformance fixtures.

SeqWire is evaluated only in relation to this path.

## Classification vocabulary

Every disposition in this document uses exactly one of these values:

- `KEEP`: remains useful inside SeqWire without conflicting with Exclave.
- `PORT`: can move into Exclave substantially as-is after names and fixtures are
  translated.
- `REBUILD`: the capability is useful but must be implemented against Exclave's
  canonical ABI and lifecycle.
- `LAB`: belongs only in an Exclave protocol, conformance, visualization, or
  fault-injection laboratory.
- `DELETE`: obsolete, misleading, or valueless duplication that must not remain
  an active production surface.
- `ARCHIVE`: retained only as historical evidence.

`DELETE` is a target-state disposition, not authorization to remove files during
this convergence slice. Historical material is preserved until the archive
gates at the end of this document are satisfied.

## Disposition matrix

Order values refer to the ordered migration queue below.

| Item | Source | Current responsibility and reality | Disposition and rationale | Target owner and dependencies | Risk | Order | Behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authored `defineSpec` DSL and compiler | `packages/core/src/spec/define.ts`; `collapse.ts`; `canonicalize.ts`; `canonical-hash.ts` | Implements nested authoring, canonical dot-key collapse, validation, defaults, anonymous identity, and canonical spec production. | `DELETE`: it duplicates Exclave's authored contracts, compiler, field identity, and compatibility identity. | Exclave projection compiler; depends on Exclave authored-contract and canonical-manifest APIs. | Critical: two canonical identities can silently diverge. | 7 | Intentionally change. Do not preserve the DSL, anonymous hash, or canonical object as a production contract. |
| Spec validation/property cases | `packages/core/tests/spec/define.fast-check.test.ts` | Generates valid and invalid numeric ranges and proves rejection of inversions and non-finite bounds. | `PORT`: the invariant and generators remain useful without carrying the compiler. | Exclave compiler/conformance tests; depends on Exclave field-definition generators. | Low after translation. | 2 | Preserve accepted/rejected classes, not SeqWire error codes or AST types. |
| Params/meters doctrine | `packages/core/src/spec/types.ts`; `binding/common/types.ts` | Defines the entire model as controller-written params and processor-written meters with role-specific type surfaces. | `ARCHIVE`: useful design history, but the locked production model is authored Exclave projections, control intent, and published projection state. | No production owner for the doctrine; individual fields and directions belong to Exclave contracts. | High if migrated because it would collapse product concepts into a generic pair. | 7 | Intentionally change. Never make params/meters the Exclave schema root. |
| `planLayout` | `packages/core/src/plan/layout.ts`; `plan/types.ts`; `primitives/planes.ts` | Computes byte totals, typed planes, aligned PU/MU locks, slots, and a plan hash. It is a complete layout and ABI authority. | `DELETE`: Exclave's canonical manifest and hot layout are the only ABI authority. | Exclave compiler, lane planner, manifest, and generated artifacts. | Critical: a second planner creates irreconcilable byte identity. | 7 | Intentionally change. Only generic alignment/non-overlap invariants survive separately. |
| Packed SAB backing | `packages/core/src/backing/allocate-packed.ts`; `map-views.ts` | Allocates a mutable `SharedArrayBuffer` from a SeqWire Plan and maps all planes. | `LAB`: useful for deterministic browser and fault-injection experiments, never for renderer-owned production memory. | Private Exclave protocol lab; depends on generated fixture layouts and read-only consumer adapters. | Medium: accidental reuse would expose mutable memory to application code. | 5 | Preserve allocation experiments only; production resource ownership changes. |
| Partitioned backing | `packages/core/src/backing/allocate-partitioned.ts`; `backing/types.ts` | Allocates one mutable SAB per SeqWire plane. | `ARCHIVE`: it has no role in the selected native authority-owned mapping. | Historical record only. | Low once clearly labeled; high if retained as an integration option. | 7 | Do not preserve production behavior. |
| Shared WebAssembly backing | `packages/core/src/backing/allocate-wasm.ts`; `map-views.ts`; `handoff/handoff.ts` | Allocates or grows shared `WebAssembly.Memory` and maps SeqWire planes; the handoff implementation rejects this backing. | `LAB`: useful for protocol experiments, but internally incomplete as a handoff path and not the production native mapping. | Private Exclave protocol lab; depends on generated Exclave fixtures. | Medium. | 5 | Preserve only controlled allocation/mapping experiments. |
| Handoff envelope | `packages/core/src/handoff/types.ts`; `handoff/handoff.ts` | Structured-clone envelope embeds version, SeqWire Plan, and SAB resources. Acceptance performs shallow shape checks; verification compares plan hash and byte total. | `DELETE`: the embedded Plan and version form a competing ABI and lifecycle envelope. | Exclave host adapter and generated manifest validator; depends on revocable descriptor, hot handle, authority epoch, and canonical ABI identity. | Critical: current acceptance can bless structurally plausible but non-canonical layouts. | 6 | Intentionally change. Do not preserve envelope identity or embedded Plan. |
| Accepted-handoff trust concept | `packages/core/src/handoff/accepted-brand.ts`; `apps/docs/src/handoff-acceptance.md` | Adds a process-local symbol brand after shallow validation and is documented as a trust boundary. It has no independent canonical recomputation, epoch, revocation, or authority. | `REBUILD`: validate-before-bind remains valuable, but the capability must be backed by Exclave identity and host authority. | Exclave generated TS binding and Electron host adapter. | High if the local brand is mistaken for authority. | 3 | Preserve the rule that unknown input is validated before binding; change every identity and lifetime semantic. |
| Controller binding | `packages/core/src/binding/controller/impl.ts` | Claims a process-local role, writes params, stages arrays, hydrates state, and snapshots params/meters over mutable backing. Meter policy options are not applied to controller meter snapshots. | `ARCHIVE`: production TypeScript consumers are read-only and must not own the publication resource. | Native Rust authority for publication; Exclave control plane for intent. | Critical if imported: it exposes renderer-side mutation and an incorrect authority model. | 7 | Do not preserve the role API. |
| Processor binding | `packages/core/src/binding/processor/impl.ts` | Reads params with bounded retries and publishes scalar, array, and grouped meters under the MU seqlock. | `REBUILD`: publication ergonomics and prevalidation are useful, but writers must be generated Rust authorities over Exclave layout. | Exclave generated Rust authority writer; depends on canonical projection groups and publication lifecycle. | High. | 4 | Preserve validation-before-mutation and coherent-group intent; change API, roles, counters, and layout. |
| Observer binding | `packages/core/src/binding/observer/impl.ts`; `observer/snapshot.ts` | Implements bounded full snapshots and a full-snapshot last-good cache. Partial snapshots fall back to raw shared views, and array snapshots are live aliases. | `REBUILD`: bounded read-only observation is required, but it must use Exclave ABI, lifecycle, owned last-good storage, and torn-candidate rejection. | Exclave generated TS hot consumer; depends on manifest validation, read-only mapping, epoch/remap, and continuity policy. | Critical correctness risk. | 1 | Preserve bounded coherent reads; intentionally change partial, degraded, array, initial-read, and lifetime semantics. |
| Controller/processor role registry | `packages/core/src/binding/common/registry.ts` | Uses process-local `WeakMap` state to claim one controller and one processor for reachable memory. | `DELETE`: process-local reachability is not authority, revocation, or cross-process ownership. | Native authority and Electron host adapter. | High if treated as lifecycle enforcement. | 7 | No behavior preservation. |
| Dual-counter seqlock ABI | `packages/core/src/primitives/seqlock.ts`; `plan/types.ts`; `primitives/planes.ts` | Uses separate lock and sequence counters for PU and MU publication domains. | `ARCHIVE`: explicitly excluded as the production ABI. | Exclave hot-layout protocol. | Critical if copied because it forks byte and memory-order semantics. | 7 | Preserve no counter placement, order, or wrap identity. |
| Retry and spin budgets | `packages/core/src/primitives/seqlock.ts`; `binding/common/coherent.ts`; observer/processor bindings | Implements finite spin/retry budgets and distinguishes writer-active and exhausted outcomes. | `PORT`: boundedness, zero-budget, and observable exhaustion cases translate directly to Exclave tests. | Exclave hot-consumer and conformance tests. | Low if translated against the actual Exclave reader. | 1 | Preserve bounded return and diagnostic intent, not numeric defaults or status types. |
| Degraded candidate behavior | `packages/core/src/primitives/seqlock.ts`; `binding/common/coherent.ts` | `tryRead` can execute the payload reader while the writer lock is odd. Higher layers sometimes discard the candidate, but the primitive can return it. | `DELETE`: production readers must never expose a candidate sampled during active or inconsistent publication. | Exclave generated TS reader. | Critical data-integrity risk. | 1 | Intentionally change to no-candidate failure plus owned last-good fallback. |
| Last-good state | `packages/core/src/binding/observer/impl.ts`; `observer/snapshot.ts`; snapshot tests | Caches only full snapshots. Partial reads bypass the cache, initial degradation reads raw bytes, and array values can remain shared-memory aliases. | `REBUILD`: continuity is required, but last-good data must be independently owned and bound to authority epoch/continuity decisions. | Exclave hot consumer; depends on owned snapshot buffers and publication/authority metadata. | Critical. | 1 | Preserve continuity intent; change storage, partial reads, first-read behavior, and epoch handling. |
| Grouped coherent publication | `packages/core/src/binding/processor/impl.ts`; `tests/binding/processor.meters.group.runtime.test.ts` | Prevalidates exact group membership and array lengths before a single meter publication; invalid input does not advance the counter. | `PORT`: validation-before-mutation and one-commit properties are portable. | Exclave generated Rust writer and cross-language conformance tests. | Medium because group identity must come from Exclave projections. | 2 | Preserve atomic group intent and no-publication-on-invalid-input; replace meter/MU mechanics. |
| Enum utilities | `packages/core/src/spec/enums.ts`; `binding/common/enum-utils.ts` | Supplies labels, indices, values, arrays, and palettes. Invalid indices can degrade to a stringified integer. | `KEEP`: useful to the frozen proof/lab while extraction proceeds and does not by itself claim ABI ownership. | SeqWire proof/lab only; production equivalents are generated by Exclave. | Low in the lab; medium if silent invalid-index behavior escapes. | 5 | Keep lab ergonomics; production behavior must report invalid/corrupt values explicitly. |
| Snapshot `into` and typed-array copy utilities | `packages/core/src/binding/common/snapshot-util.ts`; `tests/binding/snapshot.*.into.identity.test.ts` | Supports allocation-free copies into caller-owned arrays and tests exact buffer reuse. | `PORT`: this is directly useful for generated TypeScript readers. | Exclave generated TS hot consumer. | Low. | 2 | Preserve type/length checks, exact target reuse, and allocation-free steady state. |
| SWSR ring primitive | `packages/core/src/primitives/swsr-ring.ts`; `tests/primitives/swsr-ring.runtime.test.ts`; root exports | Implements a fixed header, one reserved slot, drop-newest overflow, FIFO producer/consumer, and finite snapshot drain. Tests are single-process and lack native byte fixtures. | `LAB`: useful for control-intent and fault experiments, not the production boundary ABI. | Private Exclave protocol lab or product-owned control plane, only if a real need is established. | High if generalized into another core protocol. | 5 | Capacity, overflow, epoch, and failure behavior may intentionally change. |
| Command-ring doctrine | `packages/core/docs/adr/ADR-010-ring-primitive-in-seqwire-core.md`; `architecture/18-command-ring-swsr.md` | Specifies a generic command mechanism and fixed ABI beyond the proven runtime tests. Its drop-newest explanation conflates preserving queued work with preserving the newest command. | `ARCHIVE`: retain the design lesson, not an active ABI decision. | Historical docs; any future control protocol belongs to Exclave/product ownership. | Medium. | 6 | Do not preserve the ABI or overflow doctrine automatically. |
| Diagnostics counters and environment probes | `packages/core/src/diagnostics.ts`; `diagnostics/*` | Exposes degraded/retry counters, environment probes, and SeqWire-plan view descriptions; also contains speculative unexported swap features. | `PORT`: counter and environment-test patterns are useful after translation. | Exclave hot consumer, host adapter, and conformance tooling. | Low to medium. | 3 | Preserve bounded-read observability; rebuild labels/details around Exclave manifests and lifecycle. |
| Structured errors and health | `packages/core/src/errors/*`; root exports; error tests | Implements structured error domains, serialization metadata, health aggregation, and tests. | `PORT`: registry, serialization, and health test patterns can move substantially as-is. | Exclave runtime and conformance packages. | Low after replacing domains. | 3 | Preserve structured narrowing/serialization behavior; replace SeqWire codes and Plan details. |
| Layout property tests | `packages/core/tests/backing/mapViews.parity.prop.test.ts`; `packing.alignment.prop.test.ts` | Uses generated plans to prove view-length parity, alignment, and contiguous packing across SeqWire backings. | `PORT`: alignment, bounds, deterministic-layout, and non-overlap properties remain valuable. | Exclave compiler/conformance tests; depends on canonical manifest generators and TS/Rust decoders. | Medium because tests must not instantiate SeqWire Plan. | 2 | Preserve mathematical invariants; drop partitioned-backing parity as a production requirement. |
| Cross-thread coherence tests | `packages/core/tests/primitives/seqlock.coherence.worker.node.test.ts`; `seqlock.stress.worker.node.test.ts`; `binding/observer.coherence.worker.node.test.ts` | Exercises workers and stress, but worker publication order differs from `endWrite` and most assertions cover monotonic single values rather than correlated torn fields. | `REBUILD`: valuable scenarios need deterministic barriers and the real Exclave protocol. | Exclave TS/Rust conformance and hot-consumer tests. | High if current tests are treated as byte/lifecycle proof. | 1 | Preserve stress categories; replace protocol, publication order, assertions, and fixtures. |
| Benchmarks | `packages/core/bench/*.bench.ts`; `bench/README.md` | Seven suites cover seqlock, param operations, arrays/staging, grouped meters, observers, scenarios, and the complete SeqWire pipeline. | `PORT`: preallocation, allocation sensitivity, contention cases, and relative comparisons are reusable. | Exclave benchmark suite over generated manifests/readers/writers. | Medium: accidental benchmarking of the rejected ABI would legitimize it. | 4 | Preserve methodology only; replace subjects and expected baselines. |
| Generated benchmark report | `packages/core/docs/performance/bench-results.generated.md`; performance index | Records a 2025-11-24 Node 20 run, predates current cases, and references a missing JSON artifact. | `ARCHIVE`: historical measurements are not current production evidence. | Historical docs only. | Low once labeled. | 6 | Preserve only as dated evidence; never compare it as an Exclave baseline. |
| Package smoke test technique | `packages/core/scripts/pack-smoke.ts`; package scripts | Packs a tarball, inspects contents, blocks proof/workspace leakage, installs into a fresh consumer, and executes a runtime flow. It does not smoke every export or consumer typecheck. | `PORT`: packed-artifact isolation is valuable for Exclave-generated packages. | Exclave package/release conformance; depends on generated package outputs. | Low. | 3 | Preserve tar inspection, fresh install, and no-workspace checks; expand export and type checks. |
| SeqWire package release and publication | `packages/core/package.json`; `apps/docs/src/release-checklist.md`; public READMEs | Historical surfaces presented `@exclave/seqwire` as installable and documented public publication. Publication is mechanically disabled in this slice: the core package is private, `publishConfig` is absent, live `npm view @exclave/seqwire` returned `E404`, and pack smoke still passes. | `DELETE`: the former active release path was a competing product/runtime claim. | No target package. Repository verification remains while donor extraction is active. | Critical if a future change silently recreates external compatibility obligations. | 0 | Installation and publication guidance intentionally ends; private packing remains only as reproducibility evidence. |
| Repository verification harness | Root scripts; package scripts; docs and Signalsmith checks | Builds, lints, typechecks, tests, packs, and exercises the proof application. | `KEEP`: required to keep the frozen donor trustworthy during extraction. | SeqWire repository maintainers until archive gates pass. | Low; `verify:fresh` is destructive to untracked files. | 0 | Preserve deterministic verification; do not interpret a green gate as production endorsement. |
| Signalsmith Stretch proof | `apps/signalsmith-stretch/src/seqwire-spec.ts`; `meter-worklet.ts`; `tests/browser/signalsmith-smoke.spec.ts`; `docs/proofs/signalsmith-stretch.md` | Real AudioWorklet proof: controller state reaches DSP, audio passes through, and grouped telemetry returns. It uses SeqWire spec/planner/backing/handoff and partial observer snapshots. It is not native Rust, Electron, restart, revocation, or byte-conformance proof. | `LAB`: valuable product-shaped workload for an Exclave protocol/conformance lab. | Private Exclave lab consuming generated artifacts; depends on generated TS reader, Rust fixture/authority, host simulation, and deterministic browser tests. | Medium. | 5 | Preserve real audio graph, controls, worklet timing, telemetry, and browser assertions; replace the entire boundary session. |
| AudioWorklet proof technique | `apps/signalsmith-stretch/src/meter-worklet.ts`; browser smoke tests | Demonstrates downstream binding, allocation-aware processing, and one grouped telemetry publish in a real worklet. | `PORT`: workload and assertions can move without the SeqWire ABI. | Exclave proof/lab test suite. | Medium because browser worklets do not prove Electron/native authority. | 4 | Preserve DSP/output behavior and assertions; change transport, bindings, and authority. |
| Electron per-process topology ADR | `packages/core/docs/adr/ADR-00E-electron-multi-process-runtimes.md` | Informational future design recommends separate renderer/main SeqWire systems and IPC. No Electron or native Rust implementation exists. | `ARCHIVE`: directly conflicts with one native Rust authority and read-only TypeScript consumers. | Historical record only. | Critical if read as future direction. | 0 | Do not preserve topology. |
| MWMR and golden-topology ADRs | `ADR-00Y-mwmr-architecture.md`; `ADR-011-mwmr-ground-truth.md`; related MWMR guides | Describe hubs, multiple rings, observers, swap tickets, and broad JS/Wasm/native/platform compatibility. Several APIs and lifecycle mechanisms do not exist. | `ARCHIVE`: speculative system design and unsupported portability claims are not current architecture. | Historical record; selected fault scenarios may inform a lab. | High. | 0 | Preserve only rationale/history; do not preserve package topology or compatibility claims. |
| Observer ADR | `ADR-00Z-observer-binding-role.md`; observer guides | Documents a distinct observer role and coherence policies, but current partial and array behavior does not fulfill a robust last-good contract. | `ARCHIVE`: role doctrine is SeqWire-specific; reader lessons are classified separately. | Historical record. | Medium. | 6 | Do not migrate the role taxonomy. |
| Primitive-visibility ADR | `ADR-00D-primitives-internal-and-pruned.md`; `packages/core/src/index.ts` | Claims primitives are internal while the public root exports the SWSR primitive. | `ARCHIVE`: useful evidence of documentation drift, not an active ownership decision. | Historical record. | Low. | 6 | No behavior commitment. |
| Historical architecture and guides | `packages/core/docs/architecture/*`; `guides/*`; `internals/*`; `appendix/*` | Explain SeqWire's DSL, golden flow, planes, bindings, Electron/WASM assumptions, and internal policy. Some claims conflict with source or the locked direction. | `ARCHIVE`: preserve the record but remove it from authoritative production navigation. | SeqWire archive. | High if unlabelled pages are treated as current guidance. | 0 | Preserve bytes as historical evidence; current entry points must route here first. |
| Obsolete package-family proposals | Git history for the former compose proposal; current `ADR-00X-introduce-seqwire-compose-for-system-level-composition.md` | Historical proposals included compose, command-ring, agents, and platform-adapter package families. Current text says not to treat them as an active package plan but still grants SeqWire an overly broad future. | `ARCHIVE`: never revive, rename, or migrate this package family. | Historical record only. | Critical architecture-sprawl risk. | 0 | Preserve only evidence that the proposal was rejected. |
| SeqWire repository after extraction | Entire repository | Contains valuable evidence but a complete duplicate production architecture and misleading package posture. | `ARCHIVE`: default end state after donor extraction. A lab is justified only if it consumes Exclave artifacts and produces ongoing conformance value. | Repository archive, or a private lab application with no runtime package authority. | Medium: indefinite limbo invites the duplicate architecture to restart. | 8 | Preserve history and selected proof workloads; stop product/runtime evolution. |

## Correctness findings that constrain migration

These are implementation findings, not stylistic objections:

- Controller meter policy options are accepted, but controller meter snapshots
  are raw reads and do not apply the documented coherent/degraded policy.
- Observer partial snapshots bypass the full-snapshot last-good cache and can
  fall back to live shared views.
- Observer array snapshots are shared-memory aliases. A cached object containing
  one is not independently retained last-good state.
- Before any successful full snapshot, degraded observation can read raw bytes;
  there is no explicit no-last-good outcome.
- The seqlock primitive can invoke a reader while the writer lock is active. A
  production consumer must not expose that candidate.
- Publication exceptions advance the sequence before unlocking, while
  `architecture/10-seqwire-primitives-and-seqlock.md` says they unlock without
  advancing it.
- Cross-thread test workers publish counters in the opposite order from the
  implementation and mainly assert monotonic scalar values, so they do not prove
  correlated-field coherence.
- Handoff acceptance is a process-local brand after shallow shape checks, not a
  canonical ABI, authority, session, or resource validation boundary.
- The process-local binding registry cannot revoke a handle or establish native
  authority. Reachable bytes remain reachable after disposal.
- There is no authority epoch, restart invalidation, remap/rebase protocol,
  publication continuity model, generated Rust authority, read-only generated
  TypeScript binding, or Rust/TypeScript byte-conformance fixture in this repo.
- There is no Electron or native Rust implementation. WASM and AudioWorklet
  demonstrations cannot substantiate Electron/native compatibility claims.
- The generated benchmark report is dated and incomplete; it is not a current
  baseline.

These gaps are why a direct "port SeqWire into Exclave" migration is prohibited.

## Archive versus protocol lab

The default repository recommendation is `ARCHIVE`, not indefinite maintenance
as a second runtime.

A smaller `LAB` future is credible only with this one-way boundary:

```text
Exclave authored contract
  -> Exclave canonical manifest and generated artifacts
  -> private protocol/conformance lab
  -> fixtures, fault results, and conformance evidence back to Exclave
```

The lab may depend on Exclave-generated artifacts. Exclave must never depend on
SeqWire. The lab must be private and must not publish a generic core package,
compiler, planner, handoff, lifecycle, or ABI.

A credible lab can:

- visualize the exact generated hot-region layout;
- run generated TypeScript readers against generated Rust writers;
- inject writer-active, retry-exhausted, and correlated torn-read conditions;
- simulate authority epoch replacement;
- revoke a handle while old bytes remain physically reachable;
- exercise warm-to-hot promotion, remap, and explicit rebase;
- replay publication metadata and continuity decisions;
- generate and verify byte-level conformance fixtures; and
- compare Rust and TypeScript interpretation of the same bytes.

Signalsmith is a useful workload for that lab, but its current SeqWire session is
not the foundation. If nobody owns the lab as an active Exclave conformance
product, archive the proof with the repository rather than keeping the runtime
alive speculatively.

## Forbidden migrations

The following must not move into Exclave:

- `defineSpec`, its anonymous identity, or its canonical object as a second
  authored-contract system;
- `planLayout`, Plan hashes, plane order, slot model, lock stride, or PU/MU as a
  second layout/ABI authority;
- params/meters as the root production domain model;
- SeqWire handoff or accepted-handoff envelopes as compatibility or authority
  identity;
- controller/processor/observer role ownership as the production lifecycle;
- mutable shared memory exposed to renderer application code;
- the process-local role registry as authority or revocation;
- the dual-counter ABI merely because its tests and benchmarks exist;
- the partitioned/WASM backing choices as Electron transport design;
- the SWSR/command-ring ABI without an independently justified Exclave or
  product-owned control-plane design;
- the compose, command-ring, agents, or platform-adapter package-family plan;
- a new generic core package that sits beside Exclave ownership;
- speculative Electron transport, native mapping, epoch, or restart behavior
  represented only in TypeScript; or
- claims of compatibility based only on typechecking, same-process SAB tests, or
  AudioWorklet demonstrations.

## Ordered migration queue

1. **Freeze public direction.** Route current entry points to this document,
   remove install/publish/future-Electron guidance, and preserve older pages as
   historical evidence.
2. **Close bounded-reader conformance gaps in Exclave.** Add writer-active,
   zero-budget, correlated torn-candidate rejection, initial-no-good, owned
   last-good array, partial-read, revoked-handle, authority-restart, epoch,
   remap, and rebase cases against the actual Exclave ABI.
3. **Port deterministic invariants.** Translate range generators, layout
   alignment/bounds/non-overlap properties, grouped validation-before-mutation,
   and snapshot-into tests to Exclave manifests and generated bindings.
4. **Strengthen operational evidence.** Translate structured errors,
   diagnostics, packed-artifact smoke tests, and Rust/TypeScript byte fixtures.
5. **Move proof and measurement methods.** Rehost the AudioWorklet workload and
   useful benchmarks against Exclave artifacts without importing SeqWire's
   compiler, planner, handoff, roles, or ABI.
6. **Decide the lab.** Create only a private artifact-consuming lab with an
   owner and active conformance milestones; otherwise archive Signalsmith with
   the repository.
7. **Retire duplicate product surfaces.** Stop SeqWire package publication and
   remove active production navigation after downstream use has been checked.
8. **Archive.** Freeze the repository read-only after all donor evidence and
   provenance are recorded.

## First Exclave convergence slice

The first executable Exclave slice is implemented on its feature branch pending
validation and merge. The generated TypeScript reader first seeds `lastGood`
from actual generated Rust-written `deck-runtime-v0` region bytes. Deterministic
zero-budget torn and writer-active attempts must then return only that
Rust-authored `lastGood`. The writer-active candidate contains an invalid boolean
byte so the test proves that an unstable candidate is never decoded, rather than
merely proving that a coincidentally valid candidate was ignored.

The slice imports no SeqWire runtime type, planner, handoff, or ABI. It is the
smallest safe convergence step because it strengthens the selected production
reader, generated-artifact path, and Rust-to-TypeScript evidence while
preserving Exclave ownership.

The next production milestone extends that slice to correlated torn-candidate
rejection and independently owned last-good state, then attaches those semantics
to authority epoch, revocation, remap, and explicit continuity rebase. Passing
TypeScript tests alone is not completion: the milestone requires generated Rust
writer and TypeScript reader byte-level conformance.

## Archive gates

Do not archive or delete this repository during the current goal. Recommend
archive only after all of these gates are true:

1. Exclave documentation names the sole owners for compiler, manifest, layout,
   field identity, authority/session, publication, resource access, and
   conformance.
2. The focused bounded-reader slice and its Rust/TypeScript conformance tests
   pass in Exclave.
3. Every `PORT` and `REBUILD` row has an Exclave issue, test, implementation, or
   explicit rejection with provenance back to this audit.
4. Signalsmith has either been rebuilt as a private Exclave-artifact lab or
   explicitly retained as historical proof.
5. No maintained repository or documentation tells consumers to install,
   publish, or adopt SeqWire as the Electron/native boundary.
6. Unknown consumers are inventoried before repository archive. No published npm
   version or package obligation was found: the live registry lookup returned
   `E404`, while private pack smoke still passes.
7. The final SeqWire verification gate passes so the archive is internally
   reproducible, or any failing environmental dependency is recorded exactly.
8. Repository settings, issue state, and archival ownership are agreed without
   rewriting history or deleting the evidence used by Exclave.

Until then, maintain this repository only enough to keep donor evidence
reviewable. A green SeqWire build does not reopen its product direction.

## Verification while frozen

The repository's existing non-destructive gate is:

```sh
pnpm verify
```

Focused commands include:

```sh
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

`pnpm format` mutates files. `pnpm verify:fresh` invokes cleanup including
`git clean -xfd` and must not be used in a worktree containing untracked work.
Verification demonstrates that the donor remains reproducible; it does not make
SeqWire a supported production runtime.
