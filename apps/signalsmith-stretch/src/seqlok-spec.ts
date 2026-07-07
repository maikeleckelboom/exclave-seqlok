import {
  allocatePacked,
  bindController,
  bindObserver,
  buildHandoff,
  defineSpec,
  planLayout,
  type ControllerBinding,
  type Handoff,
  type ObserverBinding,
  type SpecAstInput,
} from "@exclave/seqlok";

export interface StretchControls {
  readonly active: boolean;
  readonly blockMs: number;
  readonly desiredSequence: number;
  readonly formantBaseHz: number;
  readonly formantCompensation: boolean;
  readonly formantSemitones: number;
  readonly intervalMs: number;
  readonly outputGain: number;
  readonly pitchSemitones: number;
  readonly rate: number;
  readonly tonalityEnabled: boolean;
  readonly tonalityHz: number;
}

export interface PublishedMeters {
  readonly clippedL: boolean;
  readonly clippedR: boolean;
  readonly droppedPublishCount: number;
  readonly frame: number;
  readonly holdL: number;
  readonly holdR: number;
  readonly peakL: number;
  readonly peakR: number;
  readonly publishCount: number;
  readonly rmsL: number;
  readonly rmsR: number;
}

export const signalsmithStretchSpecAst = {
  id: "signalsmith-stretch/control-meter-boundary",
  params: {
    config: {
      blockMs: { kind: "f32", min: 50, max: 240 },
      intervalMs: { kind: "f32", min: 6.25, max: 120 },
    },
    control: {
      active: { kind: "bool" },
      desiredSequence: { kind: "u32" },
      formantBaseHz: { kind: "f32", min: 0, max: 500 },
      formantCompensation: { kind: "bool" },
      formantSemitones: { kind: "f32", min: -12, max: 12 },
      outputGain: { kind: "f32", min: 0, max: 2 },
      pitchSemitones: { kind: "f32", min: -12, max: 12 },
      rate: { kind: "f32", min: 0.25, max: 4 },
      tonalityEnabled: { kind: "bool" },
      tonalityHz: { kind: "f32", min: 2_000, max: 20_000 },
    },
  },
  meters: {
    levels: {
      clippedL: { kind: "bool" },
      clippedR: { kind: "bool" },
      holdL: { kind: "f32" },
      holdR: { kind: "f32" },
      peakL: { kind: "f32" },
      peakR: { kind: "f32" },
      rmsL: { kind: "f32" },
      rmsR: { kind: "f32" },
    },
    runtime: {
      droppedPublishCount: { kind: "u32" },
      frame: { kind: "u32" },
      publishCount: { kind: "u32" },
    },
  },
} as const satisfies SpecAstInput;

export const signalsmithStretchSpec = defineSpec(signalsmithStretchSpecAst);

export type SignalsmithStretchSpec = typeof signalsmithStretchSpec;
export type SignalsmithStretchHandoff = Handoff<SignalsmithStretchSpec>;

const STRETCH_CONTROL_PARAM_KEYS = [
  "config.blockMs",
  "config.intervalMs",
  "control.active",
  "control.desiredSequence",
  "control.formantBaseHz",
  "control.formantCompensation",
  "control.formantSemitones",
  "control.outputGain",
  "control.pitchSemitones",
  "control.rate",
  "control.tonalityEnabled",
  "control.tonalityHz",
] as const;

const STRETCH_METER_KEYS = [
  "levels.clippedL",
  "levels.clippedR",
  "levels.holdL",
  "levels.holdR",
  "levels.peakL",
  "levels.peakR",
  "levels.rmsL",
  "levels.rmsR",
  "runtime.droppedPublishCount",
  "runtime.frame",
  "runtime.publishCount",
] as const;

export interface SignalsmithStretchSession {
  readonly controller: ControllerBinding<SignalsmithStretchSpec>;
  readonly handoff: SignalsmithStretchHandoff;
  readonly observer: ObserverBinding<SignalsmithStretchSpec>;
  readonly plan: ReturnType<typeof planLayout<SignalsmithStretchSpec>>;
}

export interface SignalsmithStretchPlanSummary {
  readonly bytesTotal: number;
  readonly hash: string;
  readonly id: string;
}

export function defaultStretchControls(): StretchControls {
  return {
    active: false,
    blockMs: 120,
    desiredSequence: 1,
    formantBaseHz: 0,
    formantCompensation: false,
    formantSemitones: 0,
    intervalMs: 30,
    outputGain: 1,
    pitchSemitones: 0,
    rate: 1,
    tonalityEnabled: true,
    tonalityHz: 8_000,
  };
}

export function createSignalsmithStretchSession(): SignalsmithStretchSession {
  const plan = planLayout(signalsmithStretchSpec);
  const backing = allocatePacked(plan);
  const controller = bindController(signalsmithStretchSpec, plan, backing, {
    params: { rangePolicy: "clamp" },
  });
  const observer = bindObserver(signalsmithStretchSpec, plan, backing);
  const handoff = buildHandoff(plan, backing);
  const session = { controller, handoff, observer, plan };

  writeStretchControls(session, defaultStretchControls());

  return session;
}

export function disposeSignalsmithStretchSession(
  session: SignalsmithStretchSession,
): void {
  session.controller.dispose();
  session.observer.dispose();
}

export function writeStretchControls(
  session: SignalsmithStretchSession,
  controls: StretchControls,
): void {
  session.controller.params.update({
    "config.blockMs": controls.blockMs,
    "config.intervalMs": controls.intervalMs,
    "control.active": controls.active,
    "control.desiredSequence": controls.desiredSequence,
    "control.formantBaseHz": controls.formantBaseHz,
    "control.formantCompensation": controls.formantCompensation,
    "control.formantSemitones": controls.formantSemitones,
    "control.outputGain": controls.outputGain,
    "control.pitchSemitones": controls.pitchSemitones,
    "control.rate": controls.rate,
    "control.tonalityEnabled": controls.tonalityEnabled,
    "control.tonalityHz": controls.tonalityHz,
  });
}

export function readStretchControls(
  session: SignalsmithStretchSession,
): StretchControls {
  const {
    "config.blockMs": blockMs,
    "config.intervalMs": intervalMs,
    "control.active": active,
    "control.desiredSequence": desiredSequence,
    "control.formantBaseHz": formantBaseHz,
    "control.formantCompensation": formantCompensation,
    "control.formantSemitones": formantSemitones,
    "control.outputGain": outputGain,
    "control.pitchSemitones": pitchSemitones,
    "control.rate": rate,
    "control.tonalityEnabled": tonalityEnabled,
    "control.tonalityHz": tonalityHz,
  } = session.observer.params.snapshot({ keys: STRETCH_CONTROL_PARAM_KEYS });

  return {
    active,
    blockMs,
    desiredSequence,
    formantBaseHz,
    formantCompensation,
    formantSemitones,
    intervalMs,
    outputGain,
    pitchSemitones,
    rate,
    tonalityEnabled,
    tonalityHz,
  };
}

export function readPublishedMeters(
  session: SignalsmithStretchSession,
): PublishedMeters {
  const {
    "levels.clippedL": clippedL,
    "levels.clippedR": clippedR,
    "levels.holdL": holdL,
    "levels.holdR": holdR,
    "levels.peakL": peakL,
    "levels.peakR": peakR,
    "levels.rmsL": rmsL,
    "levels.rmsR": rmsR,
    "runtime.droppedPublishCount": droppedPublishCount,
    "runtime.frame": frame,
    "runtime.publishCount": publishCount,
  } = session.observer.meters.snapshot({ keys: STRETCH_METER_KEYS });

  return {
    clippedL,
    clippedR,
    droppedPublishCount,
    frame,
    holdL,
    holdR,
    peakL,
    peakR,
    publishCount,
    rmsL,
    rmsR,
  };
}

export function summarizeSignalsmithStretchPlan(
  session: SignalsmithStretchSession,
): SignalsmithStretchPlanSummary {
  return {
    bytesTotal: session.plan.bytesTotal,
    hash: session.plan.hash,
    id: session.plan.id,
  };
}
