# SWSR Ring Primitive

**Status:** Current low-level reference; application command scenarios are
illustrative only

**Authority:** Exported source and tests remain authoritative. See
[`swsr-ring.ts`](../../src/primitives/swsr-ring.ts) and its
[runtime tests](../../tests/primitives/swsr-ring.runtime.test.ts).

The public ring is a small generic queue over a fresh `SharedArrayBuffer`. It
supports exactly one producer and one consumer. It is useful for bounded,
ordered event delivery beside SeqWire's parameter and meter state, but it is
not part of the spec, plan, backing, or handoff pipeline.

## Public API

The root package exports:

- `allocateSwsrRing({ capacity, wordsPerSlot })`
- `bindSwsrRingProducer(backing, encoder)`
- `bindSwsrRingConsumer(backing, decoder)`
- the `SWSR_HEADER_*` constants and corresponding `SwsrRing*` types

```ts
import {
  allocateSwsrRing,
  bindSwsrRingConsumer,
  bindSwsrRingProducer,
} from "@exclave/seqwire";

const backing = allocateSwsrRing({ capacity: 3, wordsPerSlot: 1 });

const producer = bindSwsrRingProducer(backing, {
  encode(value: number, destination, offset) {
    destination[offset] = value;
  },
});

const consumer = bindSwsrRingConsumer(backing, {
  decode(source, offset) {
    return source[offset] ?? 0;
  },
});

producer.enqueue(7);
const received: number[] = [];
consumer.drain((value) => {
  received.push(value);
});
```

The encoder and decoder define the application payload. The ring does not
validate that they read or write exactly `wordsPerSlot` words, and it makes no
allocation or execution-time guarantee about caller-supplied code.

## Capacity and allocation

`capacity` means usable queued entries. A ring allocated with `capacity: N`
accepts exactly `N` successful enqueues before it is full.

Internally, allocation reserves `N + 1` physical slots. One physical slot is
kept unused to distinguish full from empty, so the public capacity is not
reduced by that implementation detail:

```text
header words = 16
physical slots = capacity + 1
slot words = (capacity + 1) * wordsPerSlot
```

The minimum valid capacity is `1`. Capacity may be any integer from `1` through
`2^32 - 1`; it does not need to be a power of two. `wordsPerSlot` must be a
positive safe integer, and the combined allocation size must stay within safe
integer bounds. Platform allocation limits can reject a structurally valid but
impractically large buffer.

`allocateSwsrRing(...)` allocates a dedicated, zero-initialized
`SharedArrayBuffer`. The current package does not expose a ring allocator for
an existing SeqWire plane or `WebAssembly.Memory`.

## Header and circular indices

The 64-byte header is a 16-element `Uint32Array`:

| Word | Field | Contract |
| --- | --- | --- |
| `0` | `writeIndex` | Next physical slot the producer writes. |
| `1` | `readIndex` | Next physical slot the consumer reads. |
| `2` | `writeSeq` | Successful-enqueue counter modulo `2^32`. |
| `3` | `dropped` | Full-ring rejection counter modulo `2^32`. |
| `4..15` | Reserved | Zero-initialized padding for the current ABI. |

`writeIndex` and `readIndex` are circular physical indices. They stay within
the physical slot range and wrap explicitly at `capacity + 1`. They are not
unbounded sequence counters, and the implementation does not derive queue size
by subtracting them.

The queue is empty when `writeIndex === readIndex`. It is full when advancing
`writeIndex` by one physical slot would make it equal `readIndex`.

## Enqueue and overflow

`producer.enqueue(value)` has two outcomes:

- When space exists, the encoder writes the payload, the producer publishes the
  next `writeIndex`, `writeSeq` increments once, and the call returns `true`.
- When full, the call does not invoke the encoder or modify queued entries. The
  incoming value is rejected, `dropped` increments once, `writeSeq` is
  unchanged, and the call returns `false`.

The ring protocol does not block, spin, resize, or retry. The caller owns any
coalescing, deferral, retry, or escalation policy.

## Drain, errors, and replay

`consumer.drain(handle)` loads `writeIndex` once at the start. It drains the
FIFO entries published before that load. Values enqueued while a handler is
running wait for the next `drain(...)` call, even if physical indices wrap.

Consumption is published after each callback completes:

1. Decode the current slot.
2. Invoke `handle(value)`.
3. Store the next `readIndex` in a `finally` path.

This gives the following error contract:

- If decoding throws, the callback was not invoked and the entry remains
  queued for a later drain.
- If the handler throws, that entry is still marked consumed, the error
  propagates, and later snapshot entries remain queued.
- A callback already invoked by `drain(...)` is not replayed by a later call.
- Callback side effects are not transactional; the ring only governs queue
  consumption.

The producer cannot reuse the current physical slot until its handler returns
or throws. Publishing consumption per entry adds one atomic store per delivered
entry; this is the intentional cost of the error and replay contract.

## Ordering and concurrency

The supported topology is one producer and one consumer per backing. The
package documents but does not runtime-enforce that ownership. Concurrent
producer bindings or concurrent consumer bindings are unsupported.

Observable ordering is:

- The producer writes all payload words before atomically publishing the new
  `writeIndex`.
- A consumer reads a slot only after observing the published `writeIndex`.
- The consumer publishes the next `readIndex` only after callback completion.
- The producer tests the latest observed `readIndex` before writing, so it does
  not overwrite an unread or currently handled slot.

JavaScript `Atomics` operations are sequentially consistent. The public
guarantees above describe the JavaScript implementation; the package does not
currently ship or certify a C++ mirror of this ring ABI.

## Statistics

`producer.stats()` returns `{ dropped }`. It is an exact atomic snapshot of the
current unsigned 32-bit counter, although concurrent activity can make any
snapshot stale immediately. Both `dropped` and the header's `writeSeq` wrap
modulo `2^32`.

## Illustrative application context

Earlier SeqWire research used deck commands, engine spawning, swap tickets,
load-track flows, and coalesced nudges to motivate a ring. Those remain useful
examples of application-defined payloads and overflow policy, not current
package types or methods. SeqWire core exports no deck lifecycle, opcode,
ticket, engine, acknowledgement, priority, or multi-producer abstraction.

For current package usage, keep the split simple:

- Params and meters carry shared state.
- An SWSR ring can carry application-defined discrete events.
- Multiple writers or readers require application topology outside this
  primitive.

## Non-goals

- Multiple producers or consumers
- Dynamic resizing
- Blocking enqueue
- Overwrite-oldest behavior
- Built-in retries, priorities, replies, or acknowledgements
- Integration with SeqWire layout hashes or handoff envelopes
