import { acceptHandoff, bindProcessor } from "@exclave/seqlok";

import type { signalsmithStretchSpec } from "../boundary/specs";
import type { Handoff } from "@exclave/seqlok";

export type StretchWorkletHandoff = Handoff<typeof signalsmithStretchSpec>;

export function bindStretchWorkletSeqlok(handoff: StretchWorkletHandoff) {
  return bindProcessor(acceptHandoff(handoff));
}
