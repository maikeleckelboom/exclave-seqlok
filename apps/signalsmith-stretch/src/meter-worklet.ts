import {
  bindProcessor,
  type ProcessorBinding,
} from "@exclave/seqlok";

import type {
  StretchMeterHandoff,
  StretchMeterSpec,
} from "./seqlok-spec";

interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: readonly Float32Array[][],
    outputs: readonly Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare const AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (): AudioWorkletProcessor;
};
declare const sampleRate: number;
declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor,
): void;

type MeterMessage =
  | { readonly type: "dispose" }
  | { readonly handoff: StretchMeterHandoff; readonly type: "init" };

const PROCESSOR_NAME = "seqlok-meter";
const TARGET_PUBLISH_HZ = 60;
const HOLD_SECONDS = 0.9;
const HOLD_DECAY_DB_PER_SECOND = 18;
const CLIP_HOLD_SECONDS = 1;

class SeqlokMeterProcessor extends AudioWorkletProcessor {
  private accumulatedFrames = 0;
  private clippedFramesL = 0;
  private clippedFramesR = 0;
  private droppedPublishCount = 0;
  private framesUntilPublish = 0;
  private holdFramesL = 0;
  private holdFramesR = 0;
  private holdL = 0;
  private holdR = 0;
  private peakL = 0;
  private peakR = 0;
  private processor: ProcessorBinding<StretchMeterSpec> | null = null;
  private publishCount = 0;
  private sumSquaresL = 0;
  private sumSquaresR = 0;
  private totalFrame = 0;

  private readonly clipHoldFrames = Math.round(sampleRate * CLIP_HOLD_SECONDS);
  private readonly holdFrames = Math.round(sampleRate * HOLD_SECONDS);
  private readonly publishIntervalFrames = Math.max(
    1,
    Math.round(sampleRate / TARGET_PUBLISH_HZ),
  );

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<MeterMessage>) => {
      this.handleMessage(event.data);
    };
  }

  override process(
    inputs: readonly Float32Array[][],
    outputs: readonly Float32Array[][],
  ): boolean {
    const input = inputs[0];
    const output = outputs[0];
    const leftIn = input?.[0];
    const rightIn = input?.[1] ?? leftIn;
    const leftOut = output?.[0];
    const rightOut = output?.[1] ?? leftOut;
    const frameCount = leftOut?.length ?? leftIn?.length ?? 0;
    const outputGain = this.readOutputGain();

    let quantumPeakL = 0;
    let quantumPeakR = 0;
    let quantumSumSquaresL = 0;
    let quantumSumSquaresR = 0;

    for (let index = 0; index < frameCount; index += 1) {
      const left = (leftIn?.[index] ?? 0) * outputGain;
      const right = (rightIn?.[index] ?? 0) * outputGain;

      if (leftOut) {
        leftOut[index] = left;
      }
      if (rightOut) {
        rightOut[index] = right;
      }

      const absL = Math.abs(left);
      const absR = Math.abs(right);
      quantumPeakL = Math.max(quantumPeakL, absL);
      quantumPeakR = Math.max(quantumPeakR, absR);
      quantumSumSquaresL += left * left;
      quantumSumSquaresR += right * right;
    }

    this.accumulatedFrames += frameCount;
    this.framesUntilPublish -= frameCount;
    this.totalFrame += frameCount;
    this.peakL = Math.max(this.peakL, quantumPeakL);
    this.peakR = Math.max(this.peakR, quantumPeakR);
    this.sumSquaresL += quantumSumSquaresL;
    this.sumSquaresR += quantumSumSquaresR;
    this.updateHoldAndClip(quantumPeakL, quantumPeakR, frameCount);

    if (this.framesUntilPublish <= 0) {
      this.framesUntilPublish += this.publishIntervalFrames;
      this.publishMeters();
    }

    return true;
  }

  private handleMessage(message: MeterMessage): void {
    if (message.type === "dispose") {
      this.processor?.dispose();
      this.processor = null;
      return;
    }

    this.processor?.dispose();
    this.processor = bindProcessor(message.handoff);
  }

  private readOutputGain(): number {
    let outputGain = 1;
    this.processor?.params.within((params) => {
      outputGain = params["control.outputGain"];
    });
    return Number.isFinite(outputGain) ? outputGain : 1;
  }

  private updateHoldAndClip(
    peakL: number,
    peakR: number,
    frameCount: number,
  ): void {
    this.holdL = updatePeakHold(
      this.holdL,
      peakL,
      this.holdFramesL,
      frameCount,
    );
    this.holdR = updatePeakHold(
      this.holdR,
      peakR,
      this.holdFramesR,
      frameCount,
    );
    this.holdFramesL =
      peakL >= this.holdL ? this.holdFrames : Math.max(0, this.holdFramesL - frameCount);
    this.holdFramesR =
      peakR >= this.holdR ? this.holdFrames : Math.max(0, this.holdFramesR - frameCount);
    this.clippedFramesL =
      peakL >= 1 ? this.clipHoldFrames : Math.max(0, this.clippedFramesL - frameCount);
    this.clippedFramesR =
      peakR >= 1 ? this.clipHoldFrames : Math.max(0, this.clippedFramesR - frameCount);
  }

  private publishMeters(): void {
    const frames = Math.max(1, this.accumulatedFrames);
    const rmsL = Math.sqrt(this.sumSquaresL / frames);
    const rmsR = Math.sqrt(this.sumSquaresR / frames);
    const publishCount = (this.publishCount + 1) >>> 0;

    try {
      this.processor?.meters.publish((writer) => {
        writer.set("levels.clippedL", this.clippedFramesL > 0);
        writer.set("levels.clippedR", this.clippedFramesR > 0);
        writer.set("levels.holdL", this.holdL);
        writer.set("levels.holdR", this.holdR);
        writer.set("levels.peakL", this.peakL);
        writer.set("levels.peakR", this.peakR);
        writer.set("levels.rmsL", rmsL);
        writer.set("levels.rmsR", rmsR);
        writer.set("runtime.droppedPublishCount", this.droppedPublishCount);
        writer.set("runtime.frame", this.totalFrame >>> 0);
        writer.set("runtime.publishCount", publishCount);
      });
      this.publishCount = publishCount;
    } catch {
      this.droppedPublishCount = (this.droppedPublishCount + 1) >>> 0;
    }

    this.accumulatedFrames = 0;
    this.peakL = 0;
    this.peakR = 0;
    this.sumSquaresL = 0;
    this.sumSquaresR = 0;
  }
}

function updatePeakHold(
  hold: number,
  peak: number,
  holdFrames: number,
  frameCount: number,
): number {
  if (peak >= hold) {
    return peak;
  }
  if (holdFrames > 0) {
    return hold;
  }

  const elapsedSeconds = frameCount / sampleRate;
  const decay = 10 ** (-(HOLD_DECAY_DB_PER_SECOND * elapsedSeconds) / 20);
  return Math.max(peak, hold * decay);
}

registerProcessor(PROCESSOR_NAME, SeqlokMeterProcessor);
