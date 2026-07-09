import type { PublishedMeters } from "./seqwire-spec";

interface MeterChannelUi {
  displayPeakPercent: number;
  readonly holdMarker: HTMLElement;
  readonly holdValue: HTMLElement;
  lastFrameAt: number;
  readonly peakFill: HTMLElement;
  readonly peakMarker: HTMLElement;
  readonly peakValue: HTMLElement;
  readonly readout: HTMLElement;
  readonly rmsBar: HTMLElement;
  readonly rmsValue: HTMLElement;
  readonly track: HTMLElement;
}

interface MeterUi {
  channelReadoutDueAt: number;
  readonly clipL: HTMLElement;
  readonly clipR: HTMLElement;
  readonly left: MeterChannelUi;
  readonly publishFact: HTMLElement;
  readonly right: MeterChannelUi;
  runtimeReadoutDueAt: number;
}

const MIN_METER_DB = -60;
const MAX_METER_DB = 6;
const CHANNEL_READOUT_INTERVAL_MS = 120;
const PEAK_RELEASE_DB_PER_SECOND = 18;
const RUNTIME_READOUT_INTERVAL_MS = 250;
const METER_SCALE_TICKS = [-60, -48, -36, -24, -12, -6, 0, 6] as const;

export function renderMeterPanel(): string {
  return `
    <section class="meter-panel" aria-label="SeqWire RMS level meters">
      <div class="meter-panel-heading">
        <div>
          <h2>SeqWire RMS meters</h2>
          <p>Post-stretch output</p>
        </div>
        <output id="publishFact" class="meter-runtime readout">0 publishes; 0 dropped; 0 frames</output>
      </div>
      <div class="meter-stack">
        ${renderMeterScale()}
        ${renderChannelRow("L", "Left")}
        ${renderChannelReadout("L")}
        ${renderChannelRow("R", "Right")}
        ${renderChannelReadout("R")}
      </div>
    </section>
  `;
}

function renderMeterScale(): string {
  return `
    <div class="meter-scale" aria-hidden="true">
      <span class="meter-scale-spacer"></span>
      <div class="meter-scale-track">
        ${METER_SCALE_TICKS.map((tick) => {
          const label = tick > 0 ? `+${tick.toString()}` : tick.toString();
          return `<span class="meter-scale-tick" style="--meter-tick: ${dbToPercent(tick).toFixed(3)}%">${label}</span>`;
        }).join("")}
      </div>
      <span class="meter-scale-clip">dB</span>
    </div>
  `;
}

function renderChannelRow(channel: "L" | "R", label: string): string {
  return `
    <div class="meter-row">
      <div class="meter-channel-label">
        <strong>${channel}</strong>
        <span>${label}</span>
      </div>
      <div id="meterTrack${channel}" class="meter-track" aria-hidden="true">
        <div id="peakFill${channel}" class="meter-peak-fill"></div>
        <div id="rms${channel}" class="meter-rms"></div>
        <span id="peak${channel}" class="meter-peak"></span>
        <span id="hold${channel}" class="meter-hold"></span>
      </div>
      <output id="clip${channel}" class="clip-badge" aria-live="off">CLIP</output>
    </div>
  `;
}

function renderChannelReadout(channel: "L" | "R"): string {
  return `
    <output id="meterReadout${channel}" class="meter-readout" aria-live="off">${[
      `<span class="meter-readout-spacer"></span>`,
      `<span class="meter-readout-values">`,
      renderReading("RMS", `meterRmsValue${channel}`),
      renderReading("Peak", `meterPeakValue${channel}`),
      renderReading("Hold", `meterHoldValue${channel}`),
      `</span>`,
      `<span class="meter-readout-clip-spacer"></span>`,
    ].join("")}</output>
  `;
}

function renderReading(label: string, valueId: string): string {
  return `<span class="meter-reading"><span class="meter-reading-label">${label}</span> <span id="${valueId}" class="meter-reading-value">-inf dB</span></span>`;
}

export function createMeterUi(root: ParentNode): MeterUi {
  return {
    channelReadoutDueAt: Number.NEGATIVE_INFINITY,
    clipL: must(root, "#clipL", HTMLElement),
    clipR: must(root, "#clipR", HTMLElement),
    left: createMeterChannelUi(root, "L"),
    publishFact: must(root, "#publishFact", HTMLElement),
    right: createMeterChannelUi(root, "R"),
    runtimeReadoutDueAt: Number.NEGATIVE_INFINITY,
  };
}

function createMeterChannelUi(
  root: ParentNode,
  channel: "L" | "R",
): MeterChannelUi {
  return {
    displayPeakPercent: 0,
    holdMarker: must(root, `#hold${channel}`, HTMLElement),
    holdValue: must(root, `#meterHoldValue${channel}`, HTMLElement),
    lastFrameAt: Number.NEGATIVE_INFINITY,
    peakFill: must(root, `#peakFill${channel}`, HTMLElement),
    peakMarker: must(root, `#peak${channel}`, HTMLElement),
    peakValue: must(root, `#meterPeakValue${channel}`, HTMLElement),
    readout: must(root, `#meterReadout${channel}`, HTMLElement),
    rmsBar: must(root, `#rms${channel}`, HTMLElement),
    rmsValue: must(root, `#meterRmsValue${channel}`, HTMLElement),
    track: must(root, `#meterTrack${channel}`, HTMLElement),
  };
}

export function renderMeterUi(ui: MeterUi, meters: PublishedMeters): void {
  const now = performance.now();
  const shouldUpdateChannelText = now >= ui.channelReadoutDueAt;
  const shouldUpdateRuntimeText = now >= ui.runtimeReadoutDueAt;

  renderChannel(
    ui.left,
    {
      hold: meters.holdL,
      peak: meters.peakL,
      rms: meters.rmsL,
    },
    now,
    shouldUpdateChannelText,
  );
  renderChannel(
    ui.right,
    {
      hold: meters.holdR,
      peak: meters.peakR,
      rms: meters.rmsR,
    },
    now,
    shouldUpdateChannelText,
  );
  setClip(ui.clipL, meters.clippedL);
  setClip(ui.clipR, meters.clippedR);

  if (shouldUpdateChannelText) {
    ui.channelReadoutDueAt = now + CHANNEL_READOUT_INTERVAL_MS;
  }

  if (shouldUpdateRuntimeText) {
    ui.publishFact.textContent =
      `${meters.publishCount.toString()} publishes; ` +
      `${meters.droppedPublishCount.toString()} dropped; ` +
      `${meters.frame.toString()} frames`;
    ui.runtimeReadoutDueAt = now + RUNTIME_READOUT_INTERVAL_MS;
  }
}

function renderChannel(
  ui: MeterChannelUi,
  values: {
    readonly hold: number;
    readonly peak: number;
    readonly rms: number;
  },
  now: number,
  updateText: boolean,
): void {
  const rmsPercent = amplitudeToMeterPercent(values.rms);
  const peakPercent = amplitudeToMeterPercent(values.peak);
  const holdPercent = amplitudeToMeterPercent(values.hold);
  const displayPeakPercent = nextDisplayPeakPercent(ui, peakPercent, now);
  const hasPeak = displayPeakPercent > 0 || hasSignal(values.peak);
  const hasHold = hasSignal(values.hold);

  ui.rmsBar.style.setProperty("--meter-fill", `${rmsPercent.toFixed(2)}%`);
  ui.peakFill.style.setProperty(
    "--meter-fill",
    `${displayPeakPercent.toFixed(2)}%`,
  );
  ui.peakFill.classList.toggle("is-visible", hasPeak);
  ui.peakMarker.style.left = `${displayPeakPercent.toFixed(2)}%`;
  ui.peakMarker.classList.toggle("is-visible", hasPeak);
  ui.holdMarker.style.left = `${holdPercent.toFixed(2)}%`;
  ui.holdMarker.classList.toggle("is-visible", hasHold);
  ui.track.classList.toggle("is-warning", amplitudeToDb(values.peak) >= -6);
  ui.track.classList.toggle("is-hot", amplitudeToDb(values.peak) >= -1);

  if (!updateText) {
    return;
  }

  ui.rmsValue.textContent = formatDb(values.rms);
  ui.peakValue.textContent = formatDb(values.peak);
  ui.holdValue.textContent = formatDb(values.hold);
  ui.readout.setAttribute(
    "aria-label",
    `RMS ${formatDb(values.rms)}, peak ${formatDb(values.peak)}, peak hold ${formatDb(values.hold)}`,
  );
}

function setClip(element: HTMLElement, clipped: boolean): void {
  const state = clipped ? "clip" : "ok";

  if (element.dataset.state === state) {
    return;
  }

  element.dataset.state = state;
  element.textContent = clipped ? "CLIP" : "OK";
  element.classList.toggle("is-clipped", clipped);
  element.setAttribute("aria-label", clipped ? "Clip active" : "No clip");
}

function formatDb(value: number): string {
  const db = amplitudeToDb(value);

  if (!Number.isFinite(db)) {
    return "-inf dB";
  }

  return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
}

function amplitudeToMeterPercent(value: number): number {
  const db = amplitudeToDb(value);

  if (!Number.isFinite(db)) {
    return 0;
  }

  return dbToPercent(db);
}

function amplitudeToDb(value: number): number {
  if (value <= 0 || !Number.isFinite(value)) {
    return Number.NEGATIVE_INFINITY;
  }

  return 20 * Math.log10(value);
}

function hasSignal(value: number): boolean {
  return value > 0 && Number.isFinite(value);
}

function nextDisplayPeakPercent(
  ui: MeterChannelUi,
  targetPercent: number,
  now: number,
): number {
  const elapsedSeconds =
    Number.isFinite(ui.lastFrameAt) && now >= ui.lastFrameAt
      ? (now - ui.lastFrameAt) / 1_000
      : 0;
  const releasePercent =
    (PEAK_RELEASE_DB_PER_SECOND / (MAX_METER_DB - MIN_METER_DB)) *
    100 *
    elapsedSeconds;

  ui.lastFrameAt = now;
  ui.displayPeakPercent =
    targetPercent >= ui.displayPeakPercent
      ? targetPercent
      : Math.max(targetPercent, ui.displayPeakPercent - releasePercent);

  if (targetPercent === 0 && ui.displayPeakPercent < 0.1) {
    ui.displayPeakPercent = 0;
  }

  return ui.displayPeakPercent;
}

function dbToPercent(db: number): number {
  return clamp01((db - MIN_METER_DB) / (MAX_METER_DB - MIN_METER_DB)) * 100;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function must<T extends Element>(
  root: ParentNode,
  selector: string,
  ctor: new () => T,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof ctor)) {
    throw new Error(`Missing meter element ${selector}.`);
  }

  return element;
}
