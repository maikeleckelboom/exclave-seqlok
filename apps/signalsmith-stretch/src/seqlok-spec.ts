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

export const stretchMeterSpec = defineSpec(({ meter, param }) => ({
  id: "signalsmith-stretch/meter-boundary" as const,
  params: {
    config: {
      blockMs: param.f32({ min: 50, max: 240 }),
      intervalMs: param.f32({ min: 6.25, max: 120 }),
    },
    control: {
      active: param.bool(),
      desiredSequence: param.u32(),
      formantBaseHz: param.f32({ min: 0, max: 500 }),
      formantCompensation: param.bool(),
      formantSemitones: param.f32({ min: -12, max: 12 }),
      outputGain: param.f32({ min: 0, max: 2 }),
      pitchSemitones: param.f32({ min: -12, max: 12 }),
      rate: param.f32({ min: 0.25, max: 4 }),
      tonalityEnabled: param.bool(),
      tonalityHz: param.f32({ min: 2_000, max: 20_000 }),
    },
  },
  meters: {
    levels: {
      clippedL: meter.bool(),
      clippedR: meter.bool(),
      holdL: meter.f32(),
      holdR: meter.f32(),
      peakL: meter.f32(),
      peakR: meter.f32(),
      rmsL: meter.f32(),
      rmsR: meter.f32(),
    },
    runtime: {
      droppedPublishCount: meter.u32(),
      frame: meter.u32(),
      publishCount: meter.u32(),
    },
  },
}));

export type StretchMeterSpec = typeof stretchMeterSpec;
export type StretchMeterHandoff = Handoff<StretchMeterSpec>;

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

export interface StretchMeterSession {
  readonly controller: ControllerBinding<StretchMeterSpec>;
  readonly handoff: StretchMeterHandoff;
  readonly observer: ObserverBinding<StretchMeterSpec>;
  readonly plan: ReturnType<typeof planLayout<StretchMeterSpec>>;
}

export interface StretchMeterPlanSummary {
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

export function createStretchMeterSession(): StretchMeterSession {
  const plan = planLayout(stretchMeterSpec);
  const backing = allocatePacked(plan);
  const controller = bindController(stretchMeterSpec, plan, backing, {
    params: { rangePolicy: "clamp" },
  });
  const observer = bindObserver(stretchMeterSpec, plan, backing);
  const handoff = buildHandoff(plan, backing);
  const session = { controller, handoff, observer, plan };

  writeStretchControls(session, defaultStretchControls());

  return session;
}

export function disposeStretchMeterSession(
  session: StretchMeterSession,
): void {
  session.controller.dispose();
  session.observer.dispose();
}

export function writeStretchControls(
  session: StretchMeterSession,
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
  session: StretchMeterSession,
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
  session: StretchMeterSession,
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

export function summarizeStretchMeterPlan(
  session: StretchMeterSession,
): StretchMeterPlanSummary {
  return {
    bytesTotal: session.plan.bytesTotal,
    hash: session.plan.hash,
    id: session.plan.id,
  };
}
