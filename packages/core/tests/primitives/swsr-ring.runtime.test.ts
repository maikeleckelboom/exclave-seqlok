import { describe, expect, it, vi } from "vitest";

import { isSeqWireError, SeqWireError } from "../../src/errors/error";
import {
  allocateSwsrRing,
  bindSwsrRingConsumer,
  bindSwsrRingProducer,
  SWSR_HEADER_DROPPED,
  SWSR_HEADER_READ_INDEX,
  SWSR_HEADER_WORDS,
  SWSR_HEADER_WRITE_INDEX,
  SWSR_HEADER_WRITE_SEQ,
} from "../../src/primitives/swsr-ring";

import type {
  SwsrRingConsumer,
  SwsrRingProducer,
} from "../../src/primitives/swsr-ring";

const encodeNumber = {
  encode(value: number, destination: Uint32Array, offset: number): void {
    destination[offset] = value;
  },
};

const decodeNumber = {
  decode(source: Uint32Array, offset: number): number {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return source[offset]!;
  },
};

function createNumberRing(capacity: number) {
  const backing = allocateSwsrRing({ capacity, wordsPerSlot: 1 });
  return {
    backing,
    producer: bindSwsrRingProducer(backing, encodeNumber),
    consumer: bindSwsrRingConsumer(backing, decodeNumber),
  };
}

function expectErrorCode(callback: () => unknown, code: string): SeqWireError {
  let thrown: unknown;
  try {
    callback();
  } catch (error) {
    thrown = error;
  }
  expect(isSeqWireError(thrown)).toBe(true);
  if (!isSeqWireError(thrown)) {
    throw new Error(`Expected SeqWireError ${code}`);
  }
  expect(thrown.code).toBe(code);
  return thrown;
}

describe("SWSR ring primitives", () => {
  it("treats capacity as usable entries and reserves one physical slot", () => {
    const capacity = 1;
    const wordsPerSlot = 2;
    const backing = allocateSwsrRing({ capacity, wordsPerSlot });

    expect(backing.capacity).toBe(1);
    expect(backing.wordsPerSlot).toBe(2);
    expect(backing.header).toHaveLength(SWSR_HEADER_WORDS);
    expect(backing.slots).toHaveLength((capacity + 1) * wordsPerSlot);
    expect(backing.sab.byteLength).toBe(
      (SWSR_HEADER_WORDS + (capacity + 1) * wordsPerSlot) *
        Uint32Array.BYTES_PER_ELEMENT,
    );
    expect(Array.from(backing.header)).toEqual(
      Array.from({ length: SWSR_HEADER_WORDS }, () => 0),
    );
  });

  it("supports arbitrary positive capacities rather than requiring powers of two", () => {
    const { producer, consumer } = createNumberRing(3);

    expect(producer.enqueue(1)).toBe(true);
    expect(producer.enqueue(2)).toBe(true);
    expect(producer.enqueue(3)).toBe(true);

    const values: number[] = [];
    consumer.drain((value) => values.push(value));
    expect(values).toEqual([1, 2, 3]);
  });

  it.each([0, -1, 1.5, Number.NaN, 0x1_0000_0000, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid capacity %s",
    (capacity) => {
      expect(() => allocateSwsrRing({ capacity, wordsPerSlot: 1 })).toThrow(
        SeqWireError,
      );
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid wordsPerSlot %s",
    (wordsPerSlot) => {
      expect(() => allocateSwsrRing({ capacity: 1, wordsPerSlot })).toThrow(
        SeqWireError,
      );
    },
  );

  it("reports invalid layout details through the structured error", () => {
    try {
      allocateSwsrRing({ capacity: 0, wordsPerSlot: 2 });
      throw new Error("expected allocation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SeqWireError);
      const seqwireError =
        error as SeqWireError<"primitives.swsrRingInvalidLayout">;
      expect(seqwireError.code).toBe("primitives.swsrRingInvalidLayout");
      expect(seqwireError.details).toMatchObject({
        capacity: 0,
        wordsPerSlot: 2,
      });
    }
  });

  it("rejects malformed structurally constructed backing at bind time", () => {
    const backing = allocateSwsrRing({ capacity: 2, wordsPerSlot: 2 });
    const invalidCapacity = { ...backing, capacity: 0 };
    const invalidWordsPerSlot = { ...backing, wordsPerSlot: 0 };
    const shortHeader = {
      ...backing,
      header: backing.header.subarray(0, SWSR_HEADER_WORDS - 1),
    };
    const shortSlots = {
      ...backing,
      slots: backing.slots.subarray(0, backing.slots.length - 1),
    };
    const detachedHeader = {
      ...backing,
      header: new Uint32Array(new SharedArrayBuffer(64)),
    };

    for (const malformed of [
      invalidCapacity,
      invalidWordsPerSlot,
      shortHeader,
      shortSlots,
      detachedHeader,
    ]) {
      expectErrorCode(
        () => bindSwsrRingProducer(malformed, encodeNumber),
        "primitives.swsrRingInvalidLayout",
      );
      expectErrorCode(
        () => bindSwsrRingConsumer(malformed, decodeNumber),
        "primitives.swsrRingInvalidLayout",
      );
    }
  });

  it("drains an empty ring without invoking the handler", () => {
    const { consumer } = createNumberRing(2);
    const handler = vi.fn();

    consumer.drain(handler);

    expect(handler).not.toHaveBeenCalled();
  });

  it("preserves FIFO order", () => {
    const { backing, producer, consumer } = createNumberRing(4);

    expect(producer.enqueue(10)).toBe(true);
    expect(producer.enqueue(20)).toBe(true);
    expect(producer.enqueue(30)).toBe(true);

    const values: number[] = [];
    consumer.drain((value) => values.push(value));

    expect(values).toEqual([10, 20, 30]);
    expect(backing.header[SWSR_HEADER_READ_INDEX]).toBe(
      backing.header[SWSR_HEADER_WRITE_INDEX],
    );
  });

  it("preserves FIFO order through repeated wraparound", () => {
    const { producer, consumer } = createNumberRing(3);
    const values: number[] = [];

    for (let batch = 0; batch < 12; batch += 1) {
      for (let offset = 1; offset <= 3; offset += 1) {
        expect(producer.enqueue(batch * 3 + offset)).toBe(true);
      }
      consumer.drain((value) => values.push(value));
    }

    expect(values).toEqual(Array.from({ length: 36 }, (_, index) => index + 1));
  });

  it("rejects the incoming value when full without changing queued values", () => {
    const { backing, producer, consumer } = createNumberRing(3);

    expect(producer.enqueue(10)).toBe(true);
    expect(producer.enqueue(11)).toBe(true);
    expect(producer.enqueue(12)).toBe(true);

    const slotsBeforeFailure = Array.from(backing.slots);
    expect(producer.enqueue(99)).toBe(false);
    expect(producer.enqueue(100)).toBe(false);

    expect(Array.from(backing.slots)).toEqual(slotsBeforeFailure);
    expect(backing.header[SWSR_HEADER_WRITE_SEQ]).toBe(3);
    expect(backing.header[SWSR_HEADER_DROPPED]).toBe(2);
    expect(producer.stats()).toEqual({ dropped: 2 });

    const values: number[] = [];
    consumer.drain((value) => values.push(value));
    expect(values).toEqual([10, 11, 12]);
  });

  it("keeps counter behavior exact modulo 2^32", () => {
    const { backing, producer } = createNumberRing(1);

    Atomics.store(backing.header, SWSR_HEADER_WRITE_SEQ, 0xffffffff);
    expect(producer.enqueue(1)).toBe(true);
    expect(backing.header[SWSR_HEADER_WRITE_SEQ]).toBe(0);

    Atomics.store(backing.header, SWSR_HEADER_DROPPED, 0xffffffff);
    expect(producer.enqueue(2)).toBe(false);
    expect(producer.stats().dropped).toBe(0);
  });

  it("drains only the write-index snapshot captured at call start", () => {
    const { producer, consumer } = createNumberRing(3);
    expect(producer.enqueue(1)).toBe(true);
    expect(producer.enqueue(2)).toBe(true);

    const firstDrain: number[] = [];
    consumer.drain((value) => {
      firstDrain.push(value);
      if (value === 1) {
        expect(producer.enqueue(3)).toBe(true);
      }
    });

    expect(firstDrain).toEqual([1, 2]);

    const secondDrain: number[] = [];
    consumer.drain((value) => secondDrain.push(value));
    expect(secondDrain).toEqual([3]);
  });

  it("does not free the current slot until its handler completes", () => {
    const { producer, consumer } = createNumberRing(1);
    expect(producer.enqueue(1)).toBe(true);

    consumer.drain((value) => {
      expect(value).toBe(1);
      expect(producer.enqueue(2)).toBe(false);
    });

    expect(producer.enqueue(2)).toBe(true);
  });

  it("does not replay callbacks completed before or during a handler throw", () => {
    const { producer, consumer } = createNumberRing(4);
    for (const value of [1, 2, 3]) {
      expect(producer.enqueue(value)).toBe(true);
    }

    const delivered: number[] = [];
    expect(() => {
      consumer.drain((value) => {
        delivered.push(value);
        if (value === 2) {
          throw new Error("handler failed");
        }
      });
    }).toThrow("handler failed");
    expect(delivered).toEqual([1, 2]);

    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([1, 2, 3]);
  });

  it("keeps an entry queued when decoding throws before delivery", () => {
    const backing = allocateSwsrRing({ capacity: 1, wordsPerSlot: 1 });
    const producer = bindSwsrRingProducer(backing, encodeNumber);
    let shouldThrow = true;
    const consumer = bindSwsrRingConsumer(backing, {
      decode(source, offset): number {
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error("decode failed");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return source[offset]!;
      },
    });

    expect(producer.enqueue(7)).toBe(true);
    expect(() => {
      consumer.drain(() => undefined);
    }).toThrow("decode failed");

    const delivered: number[] = [];
    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([7]);
  });

  it("propagates encoder failure without publishing or losing slot reuse", () => {
    const backing = allocateSwsrRing({ capacity: 1, wordsPerSlot: 1 });
    let shouldThrow = true;
    const producer = bindSwsrRingProducer(backing, {
      encode(value: number, destination, offset): void {
        destination[offset] = value;
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error("encode failed");
        }
      },
    });
    const consumer = bindSwsrRingConsumer(backing, decodeNumber);

    expect(() => producer.enqueue(99)).toThrow("encode failed");
    expect(backing.header[SWSR_HEADER_WRITE_INDEX]).toBe(0);
    expect(backing.header[SWSR_HEADER_WRITE_SEQ]).toBe(0);
    expect(backing.header[SWSR_HEADER_DROPPED]).toBe(0);
    expect(producer.stats()).toEqual({ dropped: 0 });

    expect(producer.enqueue(7)).toBe(true);
    const delivered: number[] = [];
    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([7]);
  });

  it("rejects reentrant enqueue on the same producer and restores the guard", () => {
    const backing = allocateSwsrRing({ capacity: 2, wordsPerSlot: 1 });
    let shouldReenter = true;
    const producerRef: { current?: SwsrRingProducer<number> } = {};
    const producer = bindSwsrRingProducer(backing, {
      encode(value: number, destination: Uint32Array, offset: number): void {
        destination[offset] = value;
        if (shouldReenter) {
          const activeProducer = producerRef.current;
          if (!activeProducer) {
            throw new Error("producer not initialized");
          }
          activeProducer.enqueue(value + 1);
        }
      },
    });
    producerRef.current = producer;
    const consumer = bindSwsrRingConsumer(backing, decodeNumber);

    const error = expectErrorCode(
      () => producer.enqueue(1),
      "primitives.swsrRingReentrant",
    );
    expect(error.details).toEqual({ operation: "enqueue" });
    expect(backing.header[SWSR_HEADER_WRITE_INDEX]).toBe(0);
    expect(backing.header[SWSR_HEADER_WRITE_SEQ]).toBe(0);
    expect(backing.header[SWSR_HEADER_DROPPED]).toBe(0);

    shouldReenter = false;
    expect(producer.enqueue(7)).toBe(true);
    const delivered: number[] = [];
    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([7]);
  });

  it("rejects reentrant drain from a decoder without consuming the entry", () => {
    const backing = allocateSwsrRing({ capacity: 1, wordsPerSlot: 1 });
    const producer = bindSwsrRingProducer(backing, encodeNumber);
    let shouldReenter = true;
    const consumerRef: { current?: SwsrRingConsumer<number> } = {};
    const consumer = bindSwsrRingConsumer(backing, {
      decode(source, offset): number {
        if (shouldReenter) {
          const activeConsumer = consumerRef.current;
          if (!activeConsumer) {
            throw new Error("consumer not initialized");
          }
          activeConsumer.drain(() => undefined);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return source[offset]!;
      },
    });
    consumerRef.current = consumer;

    expect(producer.enqueue(5)).toBe(true);
    const error = expectErrorCode(() => {
      consumer.drain(() => undefined);
    }, "primitives.swsrRingReentrant");
    expect(error.details).toEqual({ operation: "drain" });
    expect(backing.header[SWSR_HEADER_READ_INDEX]).toBe(0);

    shouldReenter = false;
    const delivered: number[] = [];
    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([5]);
  });

  it("rejects handler reentrancy, consumes that delivered entry, and restores the guard", () => {
    const { backing, producer, consumer } = createNumberRing(1);
    expect(producer.enqueue(1)).toBe(true);

    expectErrorCode(() => {
      consumer.drain(() => {
        consumer.drain(() => undefined);
      });
    }, "primitives.swsrRingReentrant");
    expect(backing.header[SWSR_HEADER_READ_INDEX]).toBe(
      backing.header[SWSR_HEADER_WRITE_INDEX],
    );

    expect(producer.enqueue(2)).toBe(true);
    const delivered: number[] = [];
    consumer.drain((value) => delivered.push(value));
    expect(delivered).toEqual([2]);
  });
});
