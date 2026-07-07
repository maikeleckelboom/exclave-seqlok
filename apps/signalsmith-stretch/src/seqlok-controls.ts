import {
  allocatePacked,
  bindController,
  bindObserver,
  defineSpec,
  planLayout,
  type ControllerBinding,
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
  readonly pitchSemitones: number;
  readonly rate: number;
  readonly tonalityEnabled: boolean;
  readonly tonalityHz: number;
}

export const stretchControlSpec = defineSpec(({ param }) => ({
  id: "signalsmith-stretch/slim-controls" as const,
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
      pitchSemitones: param.f32({ min: -12, max: 12 }),
      rate: param.f32({ min: 0.25, max: 4 }),
      tonalityEnabled: param.bool(),
      tonalityHz: param.f32({ min: 2_000, max: 20_000 }),
    },
  },
}));

type StretchControlSpec = typeof stretchControlSpec;

const STRETCH_CONTROL_PARAM_KEYS = [
  "config.blockMs",
  "config.intervalMs",
  "control.active",
  "control.desiredSequence",
  "control.formantBaseHz",
  "control.formantCompensation",
  "control.formantSemitones",
  "control.pitchSemitones",
  "control.rate",
  "control.tonalityEnabled",
  "control.tonalityHz",
] as const;

export interface StretchControlSession {
  readonly controller: ControllerBinding<StretchControlSpec>;
  readonly observer: ObserverBinding<StretchControlSpec>;
  readonly plan: ReturnType<typeof planLayout<StretchControlSpec>>;
}

export interface StretchControlPlanSummary {
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
    pitchSemitones: 0,
    rate: 1,
    tonalityEnabled: true,
    tonalityHz: 8_000,
  };
}

export function createStretchControlSession(): StretchControlSession {
  const plan = planLayout(stretchControlSpec);
  const backing = allocatePacked(plan);
  const controller = bindController(stretchControlSpec, plan, backing, {
    params: { rangePolicy: "clamp" },
  });
  const observer = bindObserver(stretchControlSpec, plan, backing);
  const session = { controller, observer, plan };

  writeStretchControls(session, defaultStretchControls());

  return session;
}

export function disposeStretchControlSession(
  session: StretchControlSession,
): void {
  session.controller.dispose();
  session.observer.dispose();
}

export function writeStretchControls(
  session: StretchControlSession,
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
    "control.pitchSemitones": controls.pitchSemitones,
    "control.rate": controls.rate,
    "control.tonalityEnabled": controls.tonalityEnabled,
    "control.tonalityHz": controls.tonalityHz,
  });
}

export function readStretchControls(
  session: StretchControlSession,
): StretchControls {
  const {
    "config.blockMs": blockMs,
    "config.intervalMs": intervalMs,
    "control.active": active,
    "control.desiredSequence": desiredSequence,
    "control.formantBaseHz": formantBaseHz,
    "control.formantCompensation": formantCompensation,
    "control.formantSemitones": formantSemitones,
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
    pitchSemitones,
    rate,
    tonalityEnabled,
    tonalityHz,
  };
}

export function summarizeStretchControlPlan(
  session: StretchControlSession,
): StretchControlPlanSummary {
  return {
    bytesTotal: session.plan.bytesTotal,
    hash: session.plan.hash,
    id: session.plan.id,
  };
}
