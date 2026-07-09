# SeqWire Signalsmith Stretch Demo

- **Status:** proof demo authority; not package API authority
- **Date:** 2026-07-08
- **Product:** Signalsmith Stretch
- **SeqWire package:** `@exclave/seqwire`
- **Contract id:** `signalsmith-stretch/control-meter-boundary`

## Current Scope

`apps/signalsmith-stretch` proves that SeqWire can model the full typed control
and telemetry contract around a real DSP engine. Signalsmith remains the DSP
engine. SeqWire owns the control and meter contract. The adapter applies
canonical SeqWire snapshots to the upstream Signalsmith Web API, and the
downstream meter Worklet proves realtime SeqWire reads and published telemetry
across the audio boundary.

The demo intentionally uses one bundled official Signalsmith demo loop. There
is no file picker path and no waveform renderer. The UI surface is deliberately
reduced to the full control surface, transport and seek controls, compact
source/contract metadata, and the SeqWire meter readout.

The full Signalsmith control surface is mapped into SeqWire rather than held as
plain local state. The app writes the UI control state into SeqWire, reads back
the canonical SeqWire control snapshot, and applies that snapshot to the upstream
Signalsmith API from the main thread. The custom AudioWorklet is a downstream
realtime SeqWire audio-boundary proof node that reads `control.outputGain` and
publishes live meters back through SeqWire.

This is not a fake DSP demo, not a custom Signalsmith fork, and not a claim that
the internal upstream Signalsmith DSP Worklet reads SeqWire memory directly. The
demo intentionally does not contain a custom Signalsmith DSP Worklet, custom
Signalsmith transport, command ring, streaming source state, custom WAV parser,
source prefetcher, fake engine, private C++ build, generated WASM module, or
production runtime monitor.

## Runtime Model

The app uses the vendored upstream release wrapper:

```ts
import SignalsmithStretch from "../vendor/signalsmith-stretch/web/release/SignalsmithStretch.mjs";
```

The audio graph is:

```text
SignalsmithStretchNode -> SeqWireMeterWorkletNode -> audioContext.destination
```

The active path is:

1. Create an `AudioContext`.
2. Await `SignalsmithStretch(audioContext, channelOptions)`.
3. Browser-decode the bundled official Signalsmith demo loop.
4. Reset and load the upstream node with `dropBuffers()` and `addBuffers(...)`.
5. Write the UI control state into SeqWire.
6. Read the canonical SeqWire control snapshot.
7. Apply that canonical SeqWire snapshot to the upstream node with
   `configure(...)`, `schedule(...)`, `start(...)`, and `stop(...)`.
8. Read `control.outputGain` from SeqWire inside `SeqWireMeterWorkletNode`.
9. Publish RMS, sample peak, peak hold, clip flags, frame count, publish count,
   and dropped publish count back through SeqWire.

No alternate manual file path exists in this proof demo. The deterministic
source is the bundled official Signalsmith demo loop, decoded by the browser and
loaded into the upstream node with `dropBuffers()` followed by `addBuffers(...)`.

## SeqWire Boundary

The full Signalsmith control surface remains modeled in SeqWire:

- `config.blockMs`
- `config.intervalMs`
- `control.active`
- `control.desiredSequence`
- `control.rate`
- `control.pitchSemitones`
- `control.tonalityEnabled`
- `control.tonalityHz`
- `control.formantSemitones`
- `control.formantCompensation`
- `control.formantBaseHz`
- `control.outputGain`

The downstream Worklet publishes this meter surface back through SeqWire:

- `levels.rmsL`
- `levels.rmsR`
- `levels.peakL`
- `levels.peakR`
- `levels.holdL`
- `levels.holdR`
- `levels.clippedL`
- `levels.clippedR`
- `runtime.frame`
- `runtime.publishCount`
- `runtime.droppedPublishCount`

## Commands

```sh
pnpm signalsmith:dev
pnpm signalsmith:build
pnpm signalsmith:check
pnpm signalsmith:test:browser
```

There is no simulator mode, real-adapter mode, `signalsmith:prepare`, or local
WASM build step in this proof demo.

## Guardrails

- Keep `@exclave/seqwire` public API untouched.
- Keep Signalsmith-specific code private to the demo app.
- Do not claim custom Signalsmith DSP, custom Signalsmith transport, or
  zero-copy audio behavior.
- Do not claim the internal upstream Signalsmith DSP Worklet reads SeqWire memory
  directly.
- Do not reintroduce a fake engine or streaming source architecture unless the
  work is explicitly re-scoped as an integration lab.
- Keep the bundled source labeled as the official Signalsmith demo loop unless
  upstream publishes more specific metadata.
- Keep the demo free of file-picker and waveform-renderer paths unless the proof
  is explicitly re-scoped.
