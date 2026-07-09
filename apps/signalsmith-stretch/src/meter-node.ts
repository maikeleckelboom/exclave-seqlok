import meterWorkletUrl from "./meter-worklet.ts?worker&url";

import type { SignalsmithStretchHandoff } from "./seqwire-spec";

const PROCESSOR_NAME = "seqwire-meter";
const loadedWorklets = new WeakMap<BaseAudioContext, Promise<void>>();

export type SeqWireMeterWorkletNode = AudioWorkletNode;

export async function createSeqWireMeterNode(
  audioContext: AudioContext,
  handoff: SignalsmithStretchHandoff,
): Promise<SeqWireMeterWorkletNode> {
  await loadMeterWorklet(audioContext);

  const node = new AudioWorkletNode(audioContext, PROCESSOR_NAME, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  node.port.postMessage({ handoff, type: "init" });

  return node;
}

export function disposeSeqWireMeterNode(node: SeqWireMeterWorkletNode): void {
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
