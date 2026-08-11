import { invariant } from "../errors/invariant";

/**
 * Number of 32-bit header words reserved for a SWSR ring.
 *
 * The header is 16 × 4 bytes = 64 bytes, which matches a typical cache line.
 * This keeps metadata (indices, counters) separate from slot payloads and
 * avoids false sharing when the producer and consumer are active.
 */
export const SWSR_HEADER_WORDS = 16;

/**
 * Header word indices.
 *
 * Layout (all fields are unsigned 32-bit words):
 *
 * - [0] writeIndex: next physical slot the producer will write into
 * - [1] readIndex:  next physical slot the consumer will read from
 * - [2] writeSeq:   successful-enqueue counter, modulo 2^32
 * - [3] dropped:    full-ring rejection counter, modulo 2^32
 * - [4..15] reserved/padding
 */
export const SWSR_HEADER_WRITE_INDEX = 0;
export const SWSR_HEADER_READ_INDEX = 1;
export const SWSR_HEADER_WRITE_SEQ = 2;
export const SWSR_HEADER_DROPPED = 3;

/**
 * Layout parameters used when allocating a SWSR ring.
 *
 * @remarks
 * - `capacity` is the usable number of queued entries (must be ≥ 1).
 * - The implementation allocates one additional physical slot to distinguish
 *   full from empty without reducing the requested usable capacity.
 * - Arbitrary capacities are supported; powers of two are not required.
 * - `wordsPerSlot` is the number of 32-bit words in each slot (≥ 1).
 *   The application is responsible for defining the slot payload layout.
 */
export interface SwsrRingLayout {
  readonly capacity: number;
  readonly wordsPerSlot: number;
}

/**
 * Backing views for a SWSR ring over a SharedArrayBuffer.
 *
 * @remarks
 * - `sab` is the raw SharedArrayBuffer that holds both header and slots.
 * - `header` is a 16-word Uint32Array view over the header.
 * - `slots` is a contiguous view over all slot payload words.
 */
export interface SwsrRingBacking {
  readonly sab: SharedArrayBuffer;
  readonly header: Uint32Array;
  readonly slots: Uint32Array;
  /** Usable number of queued entries. */
  readonly capacity: number;
  readonly wordsPerSlot: number;
}

/**
 * Encoder from a typed payload `T` into a slot.
 *
 * Implementations must write exactly `wordsPerSlot` 32-bit values starting
 * at `dst[offset]`. The ring does not enforce this at runtime.
 */
export interface SwsrRingEncode<T> {
  encode(value: T, dst: Uint32Array, offset: number): void;
}

/**
 * Decoder from a slot payload into a typed value `T`.
 *
 * Implementations must read exactly `wordsPerSlot` 32-bit values starting
 * at `src[offset]`. The ring does not enforce this at runtime.
 */
export interface SwsrRingDecode<T> {
  decode(src: Uint32Array, offset: number): T;
}

/**
 * Lightweight statistics for a producer.
 *
 * @remarks
 * Tracks the number of enqueue attempts rejected because the ring was full.
 */
export interface SwsrRingStats {
  readonly dropped: number;
}

/**
 * Single-writer producer API for a SWSR ring.
 *
 * @template T Typed payload representation.
 */
export interface SwsrRingProducer<T> {
  /**
   * Enqueue a value into the ring.
   *
   * @returns
   * - `true` if the value was enqueued successfully.
   * - `false` if the ring was full and the value was dropped.
   *
   * @remarks
   * The ring protocol does not block, spin, or retry. On a full ring it does
   * not invoke the encoder or modify queued entries; it increments `dropped`
   * and returns `false`. The caller-supplied encoder runs synchronously on a
   * successful enqueue and remains responsible for its own bounded behavior.
   * If the encoder throws, that error propagates and the slot remains
   * unpublished: `writeIndex`, `writeSeq`, and `dropped` are unchanged, so a
   * later enqueue can reuse the slot.
   * Reentrant `enqueue(...)` on this same producer is rejected with
   * `primitives.swsrRingReentrant` before it can reuse the outer slot.
   */
  enqueue(value: T): boolean;

  /**
   * Read a snapshot of producer-side statistics.
   *
   * @remarks
   * The returned `dropped` value is an exact atomic snapshot of the counter at
   * the time of the load. It wraps modulo 2^32.
   */
  stats(): SwsrRingStats;
}

/**
 * Single-reader consumer API for a SWSR ring.
 *
 * @template T Typed payload representation.
 */
export interface SwsrRingConsumer<T> {
  /**
   * Drain all currently enqueued values and invoke `handle` for each.
   *
   * @remarks
   * - This method processes a finite snapshot of the ring contents: it drains
   *   only entries published before the `writeIndex` load at the start.
   * - Entries enqueued while `handle` is running wait for the next call.
   * - Each decoded entry is marked consumed after `handle` returns or throws.
   *   If `handle` throws, that error propagates and later entries remain
   *   queued, but the entry already handed to `handle` is not replayed.
   * - If decoding throws, the entry remains queued because `handle` was not
   *   invoked.
   * - It does not block and does not spin or wait for new data.
   * - Reentrant `drain(...)` on this same consumer is rejected with
   *   `primitives.swsrRingReentrant`.
   * - Typical usage is "once per audio block" or "once per render tick".
   */
  drain(handle: (value: T) => void): void;
}

/**
 * Allocate a new single-writer single-reader ring buffer on a fresh
 * SharedArrayBuffer.
 *
 * @param layout Capacity and slot-size parameters.
 *
 * @returns A backing structure with views over the header and slot region.
 *
 * @throws If `capacity` is not an integer in `[1, 2^32 - 1]`, if
 * `wordsPerSlot` is not a positive safe integer, or if their allocation size
 * exceeds safe integer bounds.
 *
 * @remarks
 * - The underlying buffer is zero-initialized.
 * - The header is 16 words (64 bytes) aligned at the start of the buffer
 *   and is followed by `(capacity + 1) * wordsPerSlot` payload words. The
 *   extra physical slot distinguishes full from empty; callers can enqueue
 *   exactly `capacity` entries.
 * - The caller is responsible for sharing `sab` with the producer and
 *   consumer threads (e.g. via postMessage or AudioWorkletOptions).
 */
export function allocateSwsrRing(layout: SwsrRingLayout): SwsrRingBacking {
  const { capacity, wordsPerSlot } = layout;

  invariant(
    Number.isSafeInteger(capacity) && capacity > 0 && capacity <= 0xffffffff,
    "primitives.swsrRingInvalidLayout",
    "SwsrRing: capacity must be an integer between 1 and 2^32 - 1",
    { capacity, wordsPerSlot },
  );

  invariant(
    Number.isSafeInteger(wordsPerSlot) && wordsPerSlot > 0,
    "primitives.swsrRingInvalidLayout",
    "SwsrRing: wordsPerSlot must be a positive safe integer",
    { capacity, wordsPerSlot },
  );

  const physicalSlotCount = capacity + 1;
  const slotWords = physicalSlotCount * wordsPerSlot;

  invariant(
    Number.isSafeInteger(slotWords),
    "primitives.swsrRingInvalidLayout",
    "SwsrRing: layout exceeds safe integer bounds",
    { capacity, wordsPerSlot },
  );

  const totalWords = SWSR_HEADER_WORDS + slotWords;

  invariant(
    Number.isSafeInteger(totalWords) &&
      Number.isSafeInteger(totalWords * Uint32Array.BYTES_PER_ELEMENT),
    "primitives.swsrRingInvalidLayout",
    "SwsrRing: allocation size exceeds safe integer bounds",
    { capacity, wordsPerSlot },
  );

  const sab = new SharedArrayBuffer(totalWords * Uint32Array.BYTES_PER_ELEMENT);

  const header = new Uint32Array(sab, 0, SWSR_HEADER_WORDS);
  const slots = new Uint32Array(
    sab,
    SWSR_HEADER_WORDS * Uint32Array.BYTES_PER_ELEMENT,
    slotWords,
  );

  header[0] = 0; // writeIndex
  header[1] = 0; // readIndex
  header[2] = 0; // writeSeq
  header[3] = 0; // dropped
  // [4..15] remain zeroed (reserved/padding)

  return {
    sab,
    header,
    slots,
    capacity,
    wordsPerSlot,
  };
}

function assertValidSwsrBacking(backing: SwsrRingBacking): void {
  const { sab, header, slots, capacity, wordsPerSlot } = backing;
  const physicalSlotCount = capacity + 1;
  const slotWords = physicalSlotCount * wordsPerSlot;
  const expectedBytes =
    (SWSR_HEADER_WORDS + slotWords) * Uint32Array.BYTES_PER_ELEMENT;

  const layoutIsValid =
    Number.isSafeInteger(capacity) &&
    capacity > 0 &&
    capacity <= 0xffffffff &&
    Number.isSafeInteger(wordsPerSlot) &&
    wordsPerSlot > 0 &&
    Number.isSafeInteger(slotWords) &&
    Number.isSafeInteger(expectedBytes);

  const viewsAreValid =
    sab instanceof SharedArrayBuffer &&
    header instanceof Uint32Array &&
    slots instanceof Uint32Array &&
    header.buffer === sab &&
    slots.buffer === sab &&
    header.byteOffset === 0 &&
    header.length === SWSR_HEADER_WORDS &&
    slots.byteOffset === SWSR_HEADER_WORDS * Uint32Array.BYTES_PER_ELEMENT &&
    slots.length === slotWords &&
    sab.byteLength === expectedBytes;

  invariant(
    layoutIsValid && viewsAreValid,
    "primitives.swsrRingInvalidLayout",
    "SwsrRing: backing views do not match the declared layout",
    { capacity, wordsPerSlot },
  );
}

/**
 * Bind a single-writer producer to an existing SWSR ring backing.
 *
 * @param backing Backing views created by {@link allocateSwsrRing}.
 * @param encode  Typed payload encoder.
 *
 * @returns A producer that can enqueue values of type `T`.
 *
 * @remarks
 * - Binding validates that the declared layout and both typed-array views
 *   exactly describe the supplied shared backing.
 * - This API assumes a single producer thread. Concurrent writers are
 *   undefined behavior.
 * - On a full ring the newest value is dropped; the producer never blocks.
 */
export function bindSwsrRingProducer<T>(
  backing: SwsrRingBacking,
  encode: SwsrRingEncode<T>,
): SwsrRingProducer<T> {
  assertValidSwsrBacking(backing);
  const { header, slots, capacity, wordsPerSlot } = backing;
  const physicalSlotCount = capacity + 1;
  let enqueuing = false;

  const enqueue = (value: T): boolean => {
    const readIndex = Atomics.load(header, SWSR_HEADER_READ_INDEX);
    const writeIndex = Atomics.load(header, SWSR_HEADER_WRITE_INDEX);

    // Compute next index with wrap-around.
    const next = writeIndex + 1 === physicalSlotCount ? 0 : writeIndex + 1;

    if (next === readIndex) {
      // Ring is full: drop newest value and bump diagnostics counter.
      Atomics.add(header, SWSR_HEADER_DROPPED, 1);
      return false;
    }

    invariant(
      !enqueuing,
      "primitives.swsrRingReentrant",
      "SwsrRing: enqueue cannot reenter the same producer",
      { operation: "enqueue" },
    );
    enqueuing = true;
    try {
      const base = writeIndex * wordsPerSlot;
      encode.encode(value, slots, base);
    } finally {
      enqueuing = false;
    }

    // Publish the new writeIndex. JS Atomics are sequentially consistent,
    // which is stronger than the acquire/release pattern we target for C++.
    Atomics.store(header, SWSR_HEADER_WRITE_INDEX, next);
    Atomics.add(header, SWSR_HEADER_WRITE_SEQ, 1);

    return true;
  };

  const stats = (): SwsrRingStats => {
    const dropped = Atomics.load(header, SWSR_HEADER_DROPPED);
    return { dropped };
  };

  return { enqueue, stats };
}

/**
 * Bind a single-reader consumer to an existing SWSR ring backing.
 *
 * @param backing Backing views created by {@link allocateSwsrRing}.
 * @param decode  Typed payload decoder.
 *
 * @returns A consumer that can drain values of type `T`.
 *
 * @remarks
 * - Binding validates that the declared layout and both typed-array views
 *   exactly describe the supplied shared backing.
 * - This API assumes a single consumer thread. Concurrent readers are
 *   undefined behavior.
 * - `drain` loads its terminal `writeIndex` once, then publishes consumption
 *   after each callback completes. This prevents replay after a later callback
 *   throws and prevents the producer from reusing a slot during its callback.
 */
export function bindSwsrRingConsumer<T>(
  backing: SwsrRingBacking,
  decode: SwsrRingDecode<T>,
): SwsrRingConsumer<T> {
  assertValidSwsrBacking(backing);
  const { header, slots, capacity, wordsPerSlot } = backing;
  const physicalSlotCount = capacity + 1;
  let draining = false;

  const drain = (handle: (value: T) => void): void => {
    let readIndex = Atomics.load(header, SWSR_HEADER_READ_INDEX);
    const writeIndex = Atomics.load(header, SWSR_HEADER_WRITE_INDEX);

    if (readIndex === writeIndex) {
      return;
    }

    invariant(
      !draining,
      "primitives.swsrRingReentrant",
      "SwsrRing: drain cannot reenter the same consumer",
      { operation: "drain" },
    );
    draining = true;

    try {
      while (readIndex !== writeIndex) {
        const base = readIndex * wordsPerSlot;
        const value = decode.decode(slots, base);
        const next = readIndex + 1 === physicalSlotCount ? 0 : readIndex + 1;

        try {
          handle(value);
        } finally {
          Atomics.store(header, SWSR_HEADER_READ_INDEX, next);
        }

        readIndex = next;
      }
    } finally {
      draining = false;
    }
  };

  return { drain };
}
