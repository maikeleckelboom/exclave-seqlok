# Memory and Layout Model

The authored spec is not memory. `planLayout(spec)` is the lowering step that turns canonical fields into byte sizes, plane offsets, and a layout identity.

## Canonical Fields

Nested authored fields collapse to canonical dot keys before layout:

```text
params.filter.cutoff -> "filter.cutoff"
meters.engine.rms    -> "engine.rms"
```

The plan uses that canonical field set. Controller writes, snapshots, diagnostics, and generated examples should use the same keys.

## Plan First, Allocate Second

Allocation consumes a plan:

```ts
const plan = planLayout(spec);
const backing = allocatePacked(plan);
```

The binding layer does not silently re-plan. Passing a plan and backing that do not describe the same memory is a contract error.

## Planes

The implementation maps fields into typed planes for scalar and array storage. The exact plane names are implementation detail, but the public consequence is stable:

- Numeric param and meter fields map to typed shared-memory regions.
- Boolean and enum values have explicit storage representations.
- Array fields reserve fixed lengths at plan time.
- Parameter and meter publication uses seqlock-protected domains; processor
  parameter reads and observer snapshots verify those sequences.

## Seqlock-Checked Reads

Coherent snapshots are built around a small sequence check. The writer marks a sequence as changing, writes values, then marks it stable; the reader only uses a copied snapshot when the sequence is stable before and after the copy.

```mermaid
flowchart TD
  subgraph writer["Writer side"]
    w1["begin publish"]
    w2["mark sequence changing"]
    w3["write values"]
    w4["mark sequence stable"]
  end

  subgraph reader["Reader side"]
    r1["read sequence before"]
    r2["copy values"]
    r3["read sequence after"]
    r4{"sequence stable?"}
    r5["use coherent snapshot"]
    r6["retry bounded read"]
  end

  w1 --> w2 --> w3 --> w4
  r1 --> r2 --> r3 --> r4
  r4 -->|yes| r5
  r4 -->|no| r6
  r6 --> r1
  w2 -. "may invalidate in-flight read" .-> r4
  w4 -. "next stable snapshot" .-> r1
```

This is the mechanism behind processor parameter reads and observer snapshots.
Each attempt is bounded by a spin budget and a retry budget. Processor and
observer `within(...)` calls fail when they cannot obtain a coherent candidate.
Observer snapshots additionally apply their configured degradation policy.

Controller meter snapshots are different: they copy values directly and are
not seqlock-verified as a multi-field unit. Use an observer for coherent
multi-field sampling.

## Backing Choices

| Allocation | Use |
| --- | --- |
| `allocatePacked(plan)` | One contiguous `SharedArrayBuffer`; the simplest handoff shape. |
| `allocatePartitioned(plan)` | Separate buffers per plane; useful when host integration wants plane-level separation. |
| `allocateWasm(plan, memory?)` | Allocate or attach compatible shared `WebAssembly.Memory`; useful for WASM-oriented runtimes. |

Only `packed` and `partitioned` backing are currently represented by the handoff protocol.

## Callback-Scoped Views

Array views in `params.within(...)`, `params.stage(...)`, and meter `stage(...)`
callbacks are ephemeral. They point into shared backing; creating the callback
view or snapshot result can still allocate JavaScript wrapper objects. Do not
store the shared views for later use.
