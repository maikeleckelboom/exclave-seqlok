import type { PublishedMeters } from "./seqlok-spec";

interface MeterUi {
  readonly clipL: HTMLElement;
  readonly clipR: HTMLElement;
  readonly holdL: HTMLElement;
  readonly holdR: HTMLElement;
  readonly peakL: HTMLElement;
  readonly peakR: HTMLElement;
  readonly publishFact: HTMLElement;
  readonly readoutL: HTMLElement;
  readonly readoutR: HTMLElement;
  readonly rmsL: HTMLElement;
  readonly rmsR: HTMLElement;
}

export function renderMeterPanel(): string {
  return `
    <section class="meter-panel" aria-label="Seqlok level meters">
      <div class="section-heading">
        <h2>Seqlok level meters</h2>
        <output id="publishFact" class="readout">0 publishes; 0 dropped; 0 frames</output>
      </div>
      <div class="meter-stack">
        <div class="meter-row">
          <div class="meter-label">
            <strong>Left</strong>
            <output id="meterReadoutL">RMS -inf dB | sample peak -inf dB | peak hold -inf dB</output>
          </div>
          <div class="meter-track">
            <div id="rmsL" class="meter-rms"></div>
            <span id="peakL" class="meter-peak"></span>
            <span id="holdL" class="meter-hold"></span>
          </div>
          <output id="clipL" class="clip-badge">clear</output>
        </div>
        <div class="meter-row">
          <div class="meter-label">
            <strong>Right</strong>
            <output id="meterReadoutR">RMS -inf dB | sample peak -inf dB | peak hold -inf dB</output>
          </div>
          <div class="meter-track">
            <div id="rmsR" class="meter-rms"></div>
            <span id="peakR" class="meter-peak"></span>
            <span id="holdR" class="meter-hold"></span>
          </div>
          <output id="clipR" class="clip-badge">clear</output>
        </div>
      </div>
    </section>
  `;
}

export function createMeterUi(root: ParentNode): MeterUi {
  return {
    clipL: must(root, "#clipL", HTMLElement),
    clipR: must(root, "#clipR", HTMLElement),
    holdL: must(root, "#holdL", HTMLElement),
    holdR: must(root, "#holdR", HTMLElement),
    peakL: must(root, "#peakL", HTMLElement),
    peakR: must(root, "#peakR", HTMLElement),
    publishFact: must(root, "#publishFact", HTMLElement),
    readoutL: must(root, "#meterReadoutL", HTMLElement),
    readoutR: must(root, "#meterReadoutR", HTMLElement),
    rmsL: must(root, "#rmsL", HTMLElement),
    rmsR: must(root, "#rmsR", HTMLElement),
  };
}

export function renderMeterUi(ui: MeterUi, meters: PublishedMeters): void {
  renderChannel(ui.rmsL, ui.peakL, ui.holdL, ui.readoutL, {
    hold: meters.holdL,
    peak: meters.peakL,
    rms: meters.rmsL,
  });
  renderChannel(ui.rmsR, ui.peakR, ui.holdR, ui.readoutR, {
    hold: meters.holdR,
    peak: meters.peakR,
    rms: meters.rmsR,
  });
  setClip(ui.clipL, meters.clippedL);
  setClip(ui.clipR, meters.clippedR);
  ui.publishFact.textContent =
    `${meters.publishCount.toString()} publishes; ` +
    `${meters.droppedPublishCount.toString()} dropped; ` +
    `${meters.frame.toString()} frames`;
}

function renderChannel(
  rmsBar: HTMLElement,
  peakMarker: HTMLElement,
  holdMarker: HTMLElement,
  readout: HTMLElement,
  values: { readonly hold: number; readonly peak: number; readonly rms: number },
): void {
  rmsBar.style.transform = `scaleX(${clamp01(values.rms).toFixed(4)})`;
  peakMarker.style.left = `${(clamp01(values.peak) * 100).toFixed(2)}%`;
  holdMarker.style.left = `${(clamp01(values.hold) * 100).toFixed(2)}%`;
  readout.textContent =
    `RMS ${formatDb(values.rms)} | ` +
    `sample peak ${formatDb(values.peak)} | ` +
    `peak hold ${formatDb(values.hold)}`;
}

function setClip(element: HTMLElement, clipped: boolean): void {
  element.textContent = clipped ? "clip" : "clear";
  element.classList.toggle("is-clipped", clipped);
}

function formatDb(value: number): string {
  if (value <= 0 || !Number.isFinite(value)) {
    return "-inf dB";
  }

  return `${(20 * Math.log10(value)).toFixed(1)} dB`;
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
