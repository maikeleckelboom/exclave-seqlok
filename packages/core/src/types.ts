import type {
  MetersSnapshot,
  MeterWriter,
  ParamsSnapshot,
  ProcessorParamsView,
  SnapshotMetersObject,
  SnapshotParamsObject,
} from "./binding/common/types";
import type { MeterKeys, ParamKeys, SpecInput } from "./spec/types";

/**
 * All controller-visible param values for a spec.
 *
 * - Scalars are plain JS numbers/booleans.
 * - Enums are *label unions* (e.g. `'normal' | 'granular'`).
 * - Arrays are readonly views of the exact typed-array class declared by the
 *   spec.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * type AllParams = ParamValues<Spec>;
 * // AllParams:
 * // {
 * //   gain: number;
 * //   mode: 'normal' | 'granular';
 * //   spectrum: Readonly<Float32Array>;
 * //   ...
 * // }
 */
export type ParamValues<S extends SpecInput> = ParamsSnapshot<S>;

/**
 * All controller-visible meter values for a spec.
 *
 * - Scalars are plain JS numbers.
 * - Arrays are readonly views of the exact typed-array class declared by the
 *   spec.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * type AllMeters = MeterValues<Spec>;
 * // AllMeters:
 * // {
 * //   engineFps: number;
 * //   workMs: number;
 * //   spectrum: Readonly<Float32Array>;
 * //   ...
 * // }
 */
export type MeterValues<S extends SpecInput> = MetersSnapshot<S>;

/**
 * Processor-side parameter view.
 *
 * This is the type you see inside `params.within()` on the processor:
 * scalars are seqlock-verified plain numbers/booleans, while arrays are live,
 * callback-scoped scratch views backed by shared memory rather than detached
 * coherent copies.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * // In an AudioWorklet / worker:
 * params.within((view: ProcessorParamView<Spec>) => {
 *   const gain = view.gain;
 *   const spectrum = view.spectrum; // Float32Array scratch view
 * });
 */
export type ProcessorParamView<S extends SpecInput> = ProcessorParamsView<S>;

/**
 * Processor-side meter writer view.
 *
 * This is the type you see inside `meters.publish()` on the processor:
 * scalars are writer functions, while arrays are written through
 * `stage(key, callback)`.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * meters.publish((view: ProcessorMeterView<Spec>) => {
 *   view.engineFps(60);
 *   view.stage('spectrum', (destination) => {
 *     destination.set(spectrumSource);
 *   });
 * });
 */
export type ProcessorMeterView<S extends SpecInput> = MeterWriter<S>;

/**
 * Shape of a param snapshot constrained to a key list.
 *
 * When used with a single type parameter, `SnapshotOf<S>` describes the
 * *full* param snapshot shape for the spec.
 *
 * When used with an explicit key tuple, `SnapshotOf<S, K>` narrows to just
 * those keys. This mirrors the shape returned by `params.snapshot({ keys })`.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 * @typeParam K - Readonly tuple of param keys for `S`. Defaults to all keys.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * // Full snapshot (all params):
 * type ParamsSnapshot = SnapshotOf<Spec>;
 *
 * // Partial snapshot for specific params:
 * type GainAndModeSnapshot = SnapshotOf<Spec, ['gain', 'mode']>;
 * // {
 * //   gain: number;
 * //   mode: 'normal' | 'granular';
 * // }
 */
export type SnapshotOf<
  S extends SpecInput,
  K extends readonly ParamKeys<S>[] = readonly ParamKeys<S>[],
> = SnapshotParamsObject<S, K>;

/**
 * Shape of a meter snapshot constrained to a key list.
 *
 * When used with a single type parameter, `SnapshotMetersOf<S>` describes
 * the *full* meter snapshot shape for the spec.
 *
 * When used with an explicit key tuple, `SnapshotMetersOf<S, K>` narrows to
 * just those keys. This mirrors the shape returned by `meters.snapshot({ keys })`.
 *
 * @typeParam S - The spec input produced by {@link defineSpec}.
 * @typeParam K - Readonly tuple of meter keys for `S`. Defaults to all keys.
 *
 * @example
 * const spec = defineSpec(/* ... *\/);
 * type Spec = typeof spec;
 *
 * // Full meter snapshot (all meters):
 * type MetersSnapshot = SnapshotMetersOf<Spec>;
 *
 * // Partial snapshot for a HUD:
 * type HudMetersSnapshot = SnapshotMetersOf<Spec, ['engineFps', 'workMs']>;
 * // {
 * //   engineFps: number;
 * //   workMs: number;
 * // }
 */
export type SnapshotMetersOf<
  S extends SpecInput,
  K extends readonly MeterKeys<S>[] = readonly MeterKeys<S>[],
> = SnapshotMetersObject<S, K>;
