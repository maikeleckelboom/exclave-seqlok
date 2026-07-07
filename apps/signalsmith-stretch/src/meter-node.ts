import meterWorkletUrl from "./meter-worklet.ts?worker&url";

import type { SignalsmithStretchHandoff } from "./seqlok-spec";

const PROCESSOR_NAME = "seqlok-meter";
const loadedWorklets = new WeakMap<BaseAudioContext, Promise<void>>();

export type SeqlokMeterWorkletNode = AudioWorkletNode;

export async function createSeqlokMeterNode(
  audioContext: AudioContext,
  handoff: SignalsmithStretchHandoff,
): Promise<SeqlokMeterWorkletNode> {
  await loadMeterWorklet(audioContext);

  const node = new AudioWorkletNode(audioContext, PROCESSOR_NAME, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  node.port.postMessage({ handoff, type: "init" });

  return node;
}

export function disposeSeqlokMeterNode(node: SeqlokMeterWorkletNode): void {
  node.port.postMessage({ type: "dispose" });
  node.disconnect();
}

function loadMeterWorklet(audioContext: AudioContext): Promise<void> {
  const loaded = loadedWorklets.get(audioContext);
  if (loaded) {
    return loaded;
  }

  const next = audioContext.audioWorklet.addModule(meterWorkletUrl);
  loadedWorklets.set(audioContext, next);
  return next;
}
