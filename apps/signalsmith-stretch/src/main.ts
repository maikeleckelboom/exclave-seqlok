import "./styles.css";

import {
  createMeterUi,
  renderMeterPanel,
  renderMeterUi,
} from "./meter-ui";
import {
  createSeqlokMeterNode,
  disposeSeqlokMeterNode,
  type SeqlokMeterWorkletNode,
} from "./meter-node";
import {
  createStretchMeterSession,
  defaultStretchControls,
  disposeStretchMeterSession,
  readPublishedMeters,
  readStretchControls,
  summarizeStretchMeterPlan,
  writeStretchControls,
  type StretchControls,
  type StretchMeterSession,
} from "./seqlok-spec";
import {
  createSignalsmithStretch,
  type SignalsmithSchedule,
  type SignalsmithStretchNode,
} from "./signalsmith-module";

const DEFAULT_SOURCE = {
  fileName: "signalsmith-demo-loop.wav",
  label: "official Signalsmith demo loop",
  url: "/audio/signalsmith-demo-loop.wav",
} as const;

interface DecodedPcmSource {
  readonly channelData: readonly Float32Array[];
  readonly duration: number;
  readonly length: number;
  readonly numberOfChannels: number;
  readonly sampleRate: number;
}

interface LoadedSource {
  readonly decoded: DecodedPcmSource;
  readonly fileName: string;
  readonly label: string;
}

interface Runtime {
  readonly audioContext: AudioContext;
  readonly meterNode: SeqlokMeterWorkletNode;
  readonly node: SignalsmithStretchNode;
}

interface DemoState {
  audioContext: AudioContext | null;
  configuredKey: string | null;
  controls: StretchControls;
  loadRequest: number;
  loadedSource: LoadedSource | null;
  meterNode: SeqlokMeterWorkletNode | null;
  meterUiFrame: number | null;
  node: SignalsmithStretchNode | null;
  playheadSeconds: number;
  playing: boolean;
  session: StretchMeterSession;
}

const appRoot = getAppRoot();

const session = createStretchMeterSession();
const state: DemoState = {
  audioContext: null,
  configuredKey: null,
  controls: defaultStretchControls(),
  loadRequest: 0,
  loadedSource: null,
  meterNode: null,
  meterUiFrame: null,
  node: null,
  playheadSeconds: 0,
  playing: false,
  session,
};

appRoot.innerHTML = renderShell();
const meterUi = createMeterUi(appRoot);

const elements = {
  blockMs: must("#blockMs", HTMLInputElement),
  blockMsNumber: must("#blockMsNumber", HTMLInputElement),
  canvas: must("#waveform", HTMLCanvasElement),
  chooseFile: must("#chooseFile", HTMLInputElement),
  durationFact: must("#durationFact", HTMLElement),
  fileName: must("#fileName", HTMLElement),
  formantBase: must("#formantBase", HTMLInputElement),
  formantBaseAuto: must("#formantBaseAuto", HTMLInputElement),
  formantBaseValue: must("#formantBaseValue", HTMLElement),
  formantCompensation: must("#formantCompensation", HTMLInputElement),
  formantShift: must("#formantShift", HTMLInputElement),
  formantShiftValue: must("#formantShiftValue", HTMLElement),
  loadedSource: must("#loadedSource", HTMLElement),
  overlap: must("#overlap", HTMLInputElement),
  overlapNumber: must("#overlapNumber", HTMLInputElement),
  outputGain: must("#outputGain", HTMLInputElement),
  outputGainValue: must("#outputGainValue", HTMLElement),
  pauseButton: must("#pauseButton", HTMLButtonElement),
  pitch: must("#pitch", HTMLInputElement),
  pitchValue: must("#pitchValue", HTMLElement),
  planFact: must("#planFact", HTMLElement),
  playButton: must("#playButton", HTMLButtonElement),
  playheadFact: must("#playheadFact", HTMLElement),
  rate: must("#rate", HTMLInputElement),
  rateValue: must("#rateValue", HTMLElement),
  resetButton: must("#resetButton", HTMLButtonElement),
  runtimeFact: must("#runtimeFact", HTMLElement),
  sampleFact: must("#sampleFact", HTMLElement),
  seek: must("#seek", HTMLInputElement),
  status: must("#status", HTMLElement),
  stopButton: must("#stopButton", HTMLButtonElement),
  tonalityEnabled: must("#tonalityEnabled", HTMLInputElement),
  tonalityHz: must("#tonalityHz", HTMLInputElement),
  tonalityHzValue: must("#tonalityHzValue", HTMLElement),
};

bindUi();
syncControlsToDom(state.controls);
render();
startMeterUiLoop();
void loadDefaultSource();

window.addEventListener("beforeunload", () => {
  disposeStretchMeterSession(state.session);
  if (state.meterUiFrame !== null) {
    cancelAnimationFrame(state.meterUiFrame);
  }
  if (state.meterNode) {
    disposeSeqlokMeterNode(state.meterNode);
  }
  state.node?.disconnect();
  void state.audioContext?.close();
});

function renderShell(): string {
  return `
    <div class="app-shell">
      <header class="app-header">
        <h1>Signalsmith Stretch</h1>
        <div id="runtimeFact" class="mode-badge">initializing</div>
      </header>

      <main class="demo-layout">
        <section class="source-panel" aria-label="Source">
          <div>
            <strong id="fileName">Loading bundled loop</strong>
            <p id="loadedSource">Official Signalsmith demo loop.</p>
          </div>
          <label class="file-picker">
            <span>Choose file</span>
            <input id="chooseFile" type="file" accept="audio/*" />
          </label>
        </section>

        <section class="waveform-panel" aria-label="Playback">
          <div class="section-heading">
            <h2>Playback</h2>
            <output id="playheadFact" class="readout">0:00.0</output>
          </div>
          <canvas id="waveform" class="waveform" width="1200" height="260"></canvas>
          <label>
            <span>Seek</span>
            <input id="seek" type="range" min="0" max="0" step="0.01" value="0" disabled />
          </label>
        </section>

        <section class="transport-panel" aria-label="Transport">
          <div class="button-row">
            <button id="playButton" type="button" disabled>Play</button>
            <button id="pauseButton" type="button" disabled>Pause</button>
            <button id="stopButton" type="button" disabled>Stop</button>
            <button id="resetButton" type="button">Reset</button>
          </div>
        </section>

        <section class="control-grid" aria-label="Stretch controls">
          <div class="control-panel">
            <h2>Time and pitch</h2>
            <label>
              <span>Rate</span>
              <input id="rate" type="range" min="0.25" max="4" step="0.001" value="1" />
              <output id="rateValue">1.000x</output>
            </label>
            <label>
              <span>Pitch</span>
              <input id="pitch" type="range" min="-12" max="12" step="0.1" value="0" />
              <output id="pitchValue">0.0 st</output>
            </label>
          </div>

          <div class="control-panel">
            <h2>Tone</h2>
            <label class="toggle-row">
              <input id="tonalityEnabled" type="checkbox" checked />
              <span>Tonality enabled</span>
            </label>
            <label>
              <span>Tonality limit</span>
              <input id="tonalityHz" type="range" min="2000" max="20000" step="1" value="8000" />
              <output id="tonalityHzValue">8000 Hz</output>
            </label>
            <label>
              <span>Formant shift</span>
              <input id="formantShift" type="range" min="-12" max="12" step="0.1" value="0" />
              <output id="formantShiftValue">0.0 st</output>
            </label>
            <label class="toggle-row">
              <input id="formantCompensation" type="checkbox" />
              <span>Formant compensation</span>
            </label>
            <label class="toggle-row">
              <input id="formantBaseAuto" type="checkbox" checked />
              <span>Auto formant base</span>
            </label>
            <label>
              <span>Manual base</span>
              <input id="formantBase" type="range" min="50" max="500" step="1" value="200" disabled />
              <output id="formantBaseValue">Auto</output>
            </label>
          </div>

          <div class="control-panel">
            <h2>Engine config</h2>
            <label>
              <span>Block (ms)</span>
              <div class="dual-input">
                <input id="blockMs" type="range" min="50" max="240" step="1" value="120" />
                <input id="blockMsNumber" type="number" min="50" max="240" step="1" value="120" />
              </div>
            </label>
            <label>
              <span>Overlap</span>
              <div class="dual-input">
                <input id="overlap" type="range" min="2" max="8" step="0.1" value="4" />
                <input id="overlapNumber" type="number" min="2" max="8" step="0.1" value="4" />
              </div>
            </label>
            <label>
              <span>Output gain</span>
              <input id="outputGain" type="range" min="0" max="2" step="0.001" value="1" />
              <output id="outputGainValue">1.000x</output>
            </label>
          </div>
        </section>

        ${renderMeterPanel()}

        <section class="facts-panel" aria-label="Demo facts">
          <dl class="fact-list">
            <div><dt>Duration</dt><dd id="durationFact">none</dd></div>
            <div><dt>Source format</dt><dd id="sampleFact">none</dd></div>
            <div><dt>Signalsmith API</dt><dd>addBuffers + schedule + start/stop</dd></div>
            <div><dt>Seqlok contract</dt><dd id="planFact">pending</dd></div>
          </dl>
        </section>
      </main>

      <p id="status" class="status-area" role="status" aria-live="polite">Loading.</p>
    </div>
  `;
}

function bindUi(): void {
  bindMirroredInputs(elements.blockMs, elements.blockMsNumber);
  bindMirroredInputs(elements.overlap, elements.overlapNumber);

  for (const input of controlInputs()) {
    input.addEventListener("input", () => {
      handleControlInput();
    });
  }

  elements.chooseFile.addEventListener("change", () => {
    const file = elements.chooseFile.files?.item(0);
    if (file) {
      void loadSourceFromFile(file);
    }
  });
  elements.playButton.addEventListener("click", () => {
    void play();
  });
  elements.pauseButton.addEventListener("click", () => {
    void pause();
  });
  elements.stopButton.addEventListener("click", () => {
    void stop();
  });
  elements.resetButton.addEventListener("click", () => {
    state.controls = defaultStretchControls();
    writeStretchControls(state.session, state.controls);
    syncControlsToDom(readStretchControls(state.session));
    void configureAndSchedule("Controls reset.");
  });
  elements.seek.addEventListener("input", () => {
    const next = clampNumber(Number(elements.seek.value), 0, sourceDuration());
    state.playheadSeconds = next;
    renderPlayhead();
    if (state.playing) {
      void scheduleNode({ inputSeconds: next, reason: "Seek applied." });
    }
  });
}

function controlInputs(): readonly HTMLInputElement[] {
  return [
    elements.blockMs,
    elements.blockMsNumber,
    elements.formantBase,
    elements.formantBaseAuto,
    elements.formantCompensation,
    elements.formantShift,
    elements.overlap,
    elements.overlapNumber,
    elements.outputGain,
    elements.pitch,
    elements.rate,
    elements.tonalityEnabled,
    elements.tonalityHz,
  ];
}

function bindMirroredInputs(
  rangeInput: HTMLInputElement,
  numberInput: HTMLInputElement,
): void {
  rangeInput.addEventListener("input", () => {
    numberInput.value = rangeInput.value;
  });
  numberInput.addEventListener("input", () => {
    rangeInput.value = numberInput.value;
  });
}

function handleControlInput(): void {
  state.controls = readControlsFromDom();
  writeStretchControls(state.session, state.controls);
  state.controls = readStretchControls(state.session);
  syncControlsToDom(state.controls);
  void configureAndSchedule("Controls updated.");
}

async function loadDefaultSource(): Promise<void> {
  await loadSource(DEFAULT_SOURCE.fileName, DEFAULT_SOURCE.label, async (runtime) => {
    const response = await fetch(DEFAULT_SOURCE.url);
    if (!response.ok) {
      throw new Error(`Unable to fetch ${DEFAULT_SOURCE.url}: ${response.status.toString()}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await runtime.audioContext.decodeAudioData(
      arrayBuffer.slice(0),
    );
    return createDecodedPcmSource(audioBuffer);
  });
}

async function loadSourceFromFile(file: File): Promise<void> {
  await loadSource(file.name, "local browser-decoded source", async (runtime) => {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await runtime.audioContext.decodeAudioData(
      arrayBuffer.slice(0),
    );
    return createDecodedPcmSource(audioBuffer);
  });
}

async function loadSource(
  fileName: string,
  label: string,
  decode: (runtime: Runtime) => Promise<DecodedPcmSource>,
): Promise<void> {
  const request = state.loadRequest + 1;
  state.loadRequest = request;
  setBusy(`Loading ${fileName}.`);

  try {
    const runtime = await ensureRuntime();
    const decoded = await decode(runtime);

    if (request !== state.loadRequest) {
      return;
    }

    await runtime.node.dropBuffers();
    await runtime.node.addBuffers(decoded.channelData);

    state.loadedSource = { decoded, fileName, label };
    state.playheadSeconds = 0;
    state.playing = false;
    await configureNode(runtime.node, state.controls);
    await scheduleNode({ active: false, inputSeconds: 0, reason: "Source ready." });
    drawWaveform(decoded);
    render();
  } catch (error) {
    setError(error);
    render();
  }
}

async function ensureRuntime(): Promise<Runtime> {
  if (state.audioContext && state.node && state.meterNode) {
    return {
      audioContext: state.audioContext,
      meterNode: state.meterNode,
      node: state.node,
    };
  }

  const audioContext = new AudioContext();
  const node = await createSignalsmithStretch(audioContext, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  const meterNode = await createSeqlokMeterNode(audioContext, state.session.handoff);

  node.connect(meterNode);
  meterNode.connect(audioContext.destination);
  await node.setUpdateInterval(0.05, (inputSeconds) => {
    state.playheadSeconds = normalizePlayhead(inputSeconds);
    renderPlayhead();
  });

  state.audioContext = audioContext;
  state.meterNode = meterNode;
  state.node = node;

  return { audioContext, meterNode, node };
}

async function play(): Promise<void> {
  const runtime = await ensureRuntime();
  const duration = sourceDuration();
  if (duration <= 0) {
    return;
  }

  await runtime.audioContext.resume();
  state.playing = true;
  state.controls = { ...state.controls, active: true };
  writeStretchControls(state.session, state.controls);
  await scheduleNode({
    active: true,
    inputSeconds: normalizePlayhead(state.playheadSeconds),
    reason: "Playing.",
  });
  render();
}

async function pause(): Promise<void> {
  if (!state.node) {
    return;
  }

  state.playing = false;
  state.controls = { ...state.controls, active: false };
  writeStretchControls(state.session, state.controls);
  state.playheadSeconds = normalizePlayhead(state.node.inputTime);
  await state.node.stop();
  render();
  setStatus("Paused.");
}

async function stop(): Promise<void> {
  if (!state.node) {
    return;
  }

  state.playing = false;
  state.playheadSeconds = 0;
  state.controls = { ...state.controls, active: false };
  writeStretchControls(state.session, state.controls);
  await state.node.stop();
  await scheduleNode({ active: false, inputSeconds: 0, reason: "Stopped." });
  render();
}

async function configureAndSchedule(reason: string): Promise<void> {
  if (!state.node) {
    render();
    return;
  }

  await configureNode(state.node, state.controls);
  await scheduleNode({ adjustPrevious: true, reason });
  render();
}

async function configureNode(
  node: SignalsmithStretchNode,
  controls: StretchControls,
): Promise<void> {
  const configKey = [
    controls.blockMs.toFixed(1),
    controls.intervalMs.toFixed(1),
    "split",
  ].join(":");

  if (state.configuredKey === configKey) {
    return;
  }

  await node.configure({
    blockMs: controls.blockMs,
    intervalMs: controls.intervalMs,
    splitComputation: true,
  });
  state.configuredKey = configKey;
}

async function scheduleNode(options: {
  readonly active?: boolean;
  readonly adjustPrevious?: boolean;
  readonly inputSeconds?: number;
  readonly reason: string;
}): Promise<void> {
  const duration = sourceDuration();

  if (!state.audioContext || !state.node || duration <= 0) {
    return;
  }

  const controls = readStretchControls(state.session);
  const schedule: SignalsmithSchedule = {
    active: options.active ?? state.playing,
    formantBaseHz: controls.formantBaseHz,
    formantCompensation: controls.formantCompensation,
    formantSemitones: controls.formantSemitones,
    loopEnd: duration,
    loopStart: 0,
    outputTime: state.audioContext.currentTime + 0.02,
    rate: controls.rate,
    semitones: controls.pitchSemitones,
    tonalityHz: controls.tonalityEnabled ? controls.tonalityHz : 0,
  };

  if (options.inputSeconds !== undefined) {
    schedule.input = normalizePlayhead(options.inputSeconds);
  }

  await state.node.schedule(schedule, options.adjustPrevious ?? false);
  setStatus(options.reason);
}

function createDecodedPcmSource(buffer: AudioBuffer): DecodedPcmSource {
  const channels: Float32Array[] = [];
  const channelCount = Math.max(1, Math.min(2, buffer.numberOfChannels));

  for (let index = 0; index < channelCount; index += 1) {
    const channel = new Float32Array(buffer.length);
    buffer.copyFromChannel(channel, index);
    channels.push(channel);
  }

  if (channels.length === 1) {
    channels.push((channels[0] ?? new Float32Array(buffer.length)).slice());
  }

  return {
    channelData: channels,
    duration: buffer.duration,
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  };
}

function readControlsFromDom(): StretchControls {
  const blockMs = clampNumber(Number(elements.blockMs.value), 50, 240);
  const overlap = clampNumber(Number(elements.overlap.value), 2, 8);
  const formantBaseHz = elements.formantBaseAuto.checked
    ? 0
    : clampNumber(Number(elements.formantBase.value), 50, 500);

  return {
    active: state.playing,
    blockMs,
    desiredSequence: nextSequence(state.controls.desiredSequence),
    formantBaseHz,
    formantCompensation: elements.formantCompensation.checked,
    formantSemitones: clampNumber(Number(elements.formantShift.value), -12, 12),
    intervalMs: blockMs / overlap,
    outputGain: clampNumber(Number(elements.outputGain.value), 0, 2),
    pitchSemitones: clampNumber(Number(elements.pitch.value), -12, 12),
    rate: clampNumber(Number(elements.rate.value), 0.25, 4),
    tonalityEnabled: elements.tonalityEnabled.checked,
    tonalityHz: clampNumber(Number(elements.tonalityHz.value), 2_000, 20_000),
  };
}

function syncControlsToDom(controls: StretchControls): void {
  const overlap = controls.blockMs / controls.intervalMs;
  elements.rate.value = controls.rate.toString();
  elements.pitch.value = controls.pitchSemitones.toString();
  elements.tonalityEnabled.checked = controls.tonalityEnabled;
  elements.tonalityHz.value = controls.tonalityHz.toString();
  elements.formantShift.value = controls.formantSemitones.toString();
  elements.formantCompensation.checked = controls.formantCompensation;
  elements.formantBaseAuto.checked = controls.formantBaseHz === 0;
  elements.formantBase.disabled = controls.formantBaseHz === 0;
  elements.formantBase.value =
    controls.formantBaseHz === 0 ? "200" : controls.formantBaseHz.toString();
  elements.blockMs.value = controls.blockMs.toString();
  elements.blockMsNumber.value = controls.blockMs.toString();
  elements.overlap.value = overlap.toFixed(1);
  elements.overlapNumber.value = overlap.toFixed(1);
  elements.outputGain.value = controls.outputGain.toString();
  elements.rateValue.textContent = `${controls.rate.toFixed(3)}x`;
  elements.pitchValue.textContent = `${controls.pitchSemitones.toFixed(1)} st`;
  elements.tonalityHzValue.textContent = `${Math.round(controls.tonalityHz).toString()} Hz`;
  elements.formantShiftValue.textContent = `${controls.formantSemitones.toFixed(1)} st`;
  elements.outputGainValue.textContent = `${controls.outputGain.toFixed(3)}x`;
  elements.formantBaseValue.textContent =
    controls.formantBaseHz === 0
      ? "Auto"
      : `${Math.round(controls.formantBaseHz).toString()} Hz`;
}

function render(): void {
  const loaded = state.loadedSource;
  const hasSource = Boolean(loaded);
  const plan = summarizeStretchMeterPlan(state.session);

  elements.playButton.disabled = !hasSource;
  elements.pauseButton.disabled = !hasSource;
  elements.stopButton.disabled = !hasSource;
  elements.seek.disabled = !hasSource;
  elements.runtimeFact.textContent = state.playing ? "playing" : "ready";
  elements.planFact.textContent = `${plan.id}; ${plan.bytesTotal.toString()} bytes; ${plan.hash.slice(0, 12)}`;

  if (!loaded) {
    elements.fileName.textContent = "No source loaded";
    elements.loadedSource.textContent = "Choose a file or wait for the bundled loop.";
    elements.durationFact.textContent = "none";
    elements.sampleFact.textContent = "none";
    renderPlayhead();
    return;
  }

  elements.fileName.textContent = loaded.fileName;
  elements.loadedSource.textContent = loaded.label;
  elements.seek.max = loaded.decoded.duration.toFixed(2);
  elements.durationFact.textContent = formatSeconds(loaded.decoded.duration);
  elements.sampleFact.textContent = `${loaded.decoded.numberOfChannels.toString()} ch, ${loaded.decoded.sampleRate.toString()} Hz, browser decoded`;
  renderPlayhead();
  renderMeters();
}

function renderPlayhead(): void {
  const duration = sourceDuration();
  const playhead = normalizePlayhead(state.playheadSeconds);

  elements.playheadFact.textContent =
    duration > 0
      ? `${formatSeconds(playhead)} / ${formatSeconds(duration)}`
      : "0:00.0";

  if (duration > 0 && document.activeElement !== elements.seek) {
    elements.seek.value = playhead.toFixed(2);
  }
}

function startMeterUiLoop(): void {
  const tick = () => {
    renderMeters();
    state.meterUiFrame = requestAnimationFrame(tick);
  };
  state.meterUiFrame = requestAnimationFrame(tick);
}

function renderMeters(): void {
  renderMeterUi(meterUi, readPublishedMeters(state.session));
}

function drawWaveform(source: DecodedPcmSource): void {
  const context = elements.canvas.getContext("2d");
  if (!context) {
    return;
  }

  const width = elements.canvas.width;
  const height = elements.canvas.height;
  const data = source.channelData[0] ?? new Float32Array(source.length);
  const step = Math.max(1, Math.floor(data.length / width));
  const center = height / 2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f8f7f4";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#0f8c7c";
  context.lineWidth = 2;
  context.beginPath();

  for (let x = 0; x < width; x += 1) {
    const start = x * step;
    let peak = 0;
    for (let offset = 0; offset < step; offset += 1) {
      peak = Math.max(peak, Math.abs(data[start + offset] ?? 0));
    }
    const y = peak * center * 0.9;
    context.moveTo(x, center - y);
    context.lineTo(x, center + y);
  }

  context.stroke();
}

function normalizePlayhead(value: number): number {
  const duration = sourceDuration();
  if (duration <= 0 || !Number.isFinite(value)) {
    return 0;
  }

  const wrapped = value % duration;
  return wrapped < 0 ? wrapped + duration : wrapped;
}

function sourceDuration(): number {
  return state.loadedSource?.decoded.duration ?? 0;
}

function setBusy(message: string): void {
  elements.status.classList.remove("is-error");
  elements.status.textContent = message;
}

function setStatus(message: string): void {
  elements.status.classList.remove("is-error");
  elements.status.textContent = message;
}

function setError(error: unknown): void {
  elements.status.classList.add("is-error");
  elements.status.textContent =
    error instanceof Error ? error.message : String(error);
}

function must<T extends Element>(
  selector: string,
  ctor: new () => T,
): T {
  const element = appRoot.querySelector(selector);
  if (!(element instanceof ctor)) {
    throw new Error(`Missing element ${selector}.`);
  }

  return element;
}

function getAppRoot(): HTMLElement {
  const element = document.querySelector("#app");
  if (!(element instanceof HTMLElement)) {
    throw new Error("Missing #app root.");
  }

  return element;
}

function nextSequence(current: number): number {
  const next = (current + 1) >>> 0;
  return next === 0 ? 1 : next;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function formatSeconds(value: number): string {
  const safeValue = Math.max(0, value);
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue - minutes * 60;

  return `${minutes.toString()}:${seconds.toFixed(1).padStart(4, "0")}`;
}
