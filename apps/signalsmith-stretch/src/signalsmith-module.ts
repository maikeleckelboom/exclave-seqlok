import SignalsmithStretchFactory from "../vendor/signalsmith-stretch/web/release/SignalsmithStretch.mjs";

export interface SignalsmithConfig {
  readonly blockMs?: number;
  readonly intervalMs?: number;
  readonly preset?: "cheaper" | "default";
  readonly splitComputation?: boolean;
}

export interface SignalsmithSchedule {
  active?: boolean;
  formantBaseHz?: number;
  formantCompensation?: boolean;
  formantSemitones?: number;
  input?: number;
  loopEnd?: number;
  loopStart?: number;
  output?: number;
  outputTime?: number;
  rate?: number;
  semitones?: number;
  tonalityHz?: number;
}

export interface SignalsmithStretchNode extends AudioWorkletNode {
  inputTime: number;
  addBuffers(sampleBuffers: readonly Float32Array[]): Promise<number>;
  configure(config: SignalsmithConfig): Promise<unknown>;
  dropBuffers(toSeconds?: number): Promise<{
    readonly end: number;
    readonly start: number;
  }>;
  latency(): Promise<number>;
  schedule(
    options: SignalsmithSchedule,
    adjustPrevious?: boolean,
  ): Promise<SignalsmithSchedule>;
  setUpdateInterval(
    seconds: number,
    callback: (inputSeconds: number) => void,
  ): Promise<unknown>;
  start(
    when?: number | SignalsmithSchedule,
    offset?: number,
    duration?: number,
    rate?: number,
    semitones?: number,
  ): Promise<SignalsmithSchedule>;
  stop(when?: number): Promise<SignalsmithSchedule>;
}

export type SignalsmithStretchFactory = (
  audioContext: AudioContext,
  options?: AudioWorkletNodeOptions,
) => Promise<SignalsmithStretchNode>;

export const createSignalsmithStretch =
  SignalsmithStretchFactory as SignalsmithStretchFactory;
