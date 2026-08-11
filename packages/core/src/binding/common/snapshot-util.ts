/**
 * @fileoverview
 * Shared helpers for snapshot implementations.
 *
 * @remarks
 * - Centralizes bound-check + error shape for scalar reads.
 * - Used by controller and observer snapshot helpers.
 *
 * @internal
 */

import { getEnumLabelForIndex, isEnumDef } from "./enum-utils";
import { createError } from "../../errors/error";

import type { MeterPlane, ParamPlane } from "./validate";
import type { MeterPlaneViews, ParamPlaneViews } from "../../backing/map-views";
import type { ParamDef } from "../../spec/types";

export interface NormalizedSnapshotSelection {
  /** `undefined` means the caller omitted an explicit key selection. */
  readonly keys: readonly string[] | undefined;
  /** Object-form options, or the second argument after an array selection. */
  readonly options: Readonly<Record<string, unknown>> | undefined;
}

/**
 * Normalize the key-selection forms shared by controller and observer snapshots.
 *
 * @remarks
 * - No arguments means no explicit selection (a full snapshot).
 * - Arrays, varargs, and `{ keys }` are explicit selections, including `[]`.
 * - Controller-only options such as `into` remain available to the caller via
 *   `options`; this helper does not assign role-specific meaning to them.
 */
export function normalizeSnapshotSelection(
  args: readonly unknown[],
): NormalizedSnapshotSelection {
  if (args.length === 0) {
    return { keys: undefined, options: undefined };
  }

  const first = args[0];

  if (Array.isArray(first)) {
    const second = args[1];
    const options =
      second !== null && typeof second === "object" && !Array.isArray(second)
        ? (second as Readonly<Record<string, unknown>>)
        : undefined;
    return { keys: first as readonly string[], options };
  }

  if (args.every((argument) => typeof argument === "string")) {
    return { keys: args, options: undefined };
  }

  if (
    args.length === 1 &&
    first !== null &&
    typeof first === "object" &&
    !Array.isArray(first)
  ) {
    const options = first as Readonly<Record<string, unknown>>;
    const keys = Array.isArray(options.keys)
      ? (options.keys as readonly string[])
      : undefined;
    return { keys, options };
  }

  return { keys: undefined, options: undefined };
}

/**
 * Load a scalar value from a numeric array, enforcing bounds.
 *
 * @remarks
 * - Works with any numeric ArrayLike (TypedArray, Array<number>, etc.).
 * - Throws a structured `internal.assertionFailed` error if the index is OOB.
 */
export function requireIndex(
  arr: ArrayLike<number>,
  index: number,
  where: string,
  message: string,
): number {
  const value = arr[index];
  if (value === undefined) {
    throw createError("internal.assertionFailed", message, {
      where,
      detail: `index ${String(index)}`,
    });
  }
  return value;
}

export type ParamArray =
  | Float32Array
  | Int32Array
  | Uint32Array
  | Uint8Array
  | Int8Array
  | Int16Array
  | Uint16Array;
export type MeterArray = Float32Array | Float64Array | Uint32Array;

function copyTypedArray<T extends ParamArray | MeterArray>(
  src: T,
  into?: T,
): T {
  if (
    into &&
    into.constructor === src.constructor &&
    into.length === src.length
  ) {
    into.set(src);
    return into;
  }

  if (src instanceof Float32Array) {
    return new Float32Array(src) as T;
  }
  if (src instanceof Float64Array) {
    return new Float64Array(src) as T;
  }
  if (src instanceof Int32Array) {
    return new Int32Array(src) as T;
  }
  if (src instanceof Uint32Array) {
    return new Uint32Array(src) as T;
  }
  if (src instanceof Int8Array) {
    return new Int8Array(src) as T;
  }
  if (src instanceof Int16Array) {
    return new Int16Array(src) as T;
  }
  if (src instanceof Uint16Array) {
    return new Uint16Array(src) as T;
  }
  return new Uint8Array(src) as T;
}

export function copyParamArray(
  src: Float32Array,
  into?: Float32Array,
): Float32Array;
export function copyParamArray(src: Int32Array, into?: Int32Array): Int32Array;
export function copyParamArray(
  src: Uint32Array,
  into?: Uint32Array,
): Uint32Array;
export function copyParamArray(src: Uint8Array, into?: Uint8Array): Uint8Array;
export function copyParamArray(src: Int8Array, into?: Int8Array): Int8Array;
export function copyParamArray(src: Int16Array, into?: Int16Array): Int16Array;
export function copyParamArray(
  src: Uint16Array,
  into?: Uint16Array,
): Uint16Array;
export function copyParamArray(src: ParamArray, into?: ParamArray): ParamArray;
export function copyParamArray(src: ParamArray, into?: ParamArray): ParamArray {
  return copyTypedArray(src, into);
}

export function copyMeterArray(
  src: Float32Array,
  into?: Float32Array,
): Float32Array;
export function copyMeterArray(
  src: Float64Array,
  into?: Float64Array,
): Float64Array;
export function copyMeterArray(
  src: Uint32Array,
  into?: Uint32Array,
): Uint32Array;
export function copyMeterArray(src: MeterArray, into?: MeterArray): MeterArray {
  return copyTypedArray(src, into);
}

/**
 * Read a scalar meter value from the correct data plane.
 *
 * @remarks
 * - MU32-backed scalars use the meter kind to decode signedness / booleans.
 */
export function readMeterScalar(
  plane: MeterPlane,
  views: MeterPlaneViews,
  key: string,
  start: number,
  kind?: string,
): number | boolean {
  if (plane === "MF32") {
    return requireIndex(views.MF32, start, key, "Meter MF32 scalar OOB");
  }
  if (plane === "MF64") {
    return requireIndex(views.MF64, start, key, "Meter MF64 scalar OOB");
  }
  const raw = requireIndex(views.MU32, start, key, "Meter MU32 scalar OOB");
  if (kind === "i32") {
    return raw | 0;
  }
  if (kind === "bool") {
    return raw !== 0;
  }
  return raw >>> 0;
}

/**
 * Read a scalar param value from the correct data plane and decode to a public value.
 *
 * @remarks
 * - PF32 → number
 * - PI32 → number or enum label string
 * - PB   → boolean (0/1 → false/true)
 */
export function readParamScalar(
  plane: ParamPlane,
  views: ParamPlaneViews,
  defs: Readonly<Record<string, ParamDef>>,
  key: string,
  start: number,
): number | string | boolean {
  if (plane === "PF32") {
    return requireIndex(views.PF32, start, key, "Param PF32 scalar OOB");
  }

  if (plane === "PI32") {
    const raw = requireIndex(views.PI32, start, key, "Param PI32 scalar OOB");
    const def = defs[key];
    if (def?.kind === "u32") {
      return raw >>> 0;
    }
    return isEnumDef(def) ? getEnumLabelForIndex(def, raw) : raw;
  }

  // PB: bool param stored as 0/1 byte
  const b = requireIndex(views.PB, start, key, "Param PB scalar OOB");
  return b !== 0;
}
