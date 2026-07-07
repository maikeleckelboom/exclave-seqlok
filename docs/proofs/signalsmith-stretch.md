# Seqlok Signalsmith Stretch Demo

- **Status:** slim demo authority; not package API authority
- **Date:** 2026-07-08
- **Product:** Signalsmith Stretch
- **Seqlok package:** `@exclave/seqlok`
- **Contract id:** `signalsmith-stretch/meter-boundary`

## Current Scope

`apps/signalsmith-stretch` is a compact browser demo proving a full
Signalsmith control plus meter boundary in Seqlok while the official
Signalsmith Web Audio wrapper owns the real DSP, WASM AudioWorklet, buffering,
scheduling, and playback behavior.

Seqlok owns the typed engine-control and meter contract. The app writes the full
Signalsmith control state into Seqlok, reads back the canonical Seqlok control
snapshot, and applies that snapshot to the upstream Signalsmith API from the
main thread. The custom AudioWorklet in this demo is only a downstream
Seqlok-backed meter/gain proof node.

The demo intentionally does not contain a custom Signalsmith DSP Worklet, custom
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
SignalsmithStretchNode -> SeqlokMeterWorkletNode -> audioContext.destination
```

The active path is:

1. Create an `AudioContext`.
2. Await `SignalsmithStretch(audioContext, channelOptions)`.
3. Browser-decode the bundled loop or a user-selected file.
4. Reset and load the upstream node with `dropBuffers()` and `addBuffers(...)`.
5. Write the UI control state into Seqlok.
6. Read the canonical Seqlok control snapshot.
7. Apply that snapshot to the upstream node with `configure(...)`,
   `schedule(...)`, `start(...)`, and `stop(...)`.
8. Read `control.outputGain` from Seqlok inside `SeqlokMeterWorkletNode`.
9. Publish RMS, sample peak, peak hold, clip flags, frame count, publish count,
   and dropped publish count back through Seqlok.

## Seqlok Boundary

The control surface remains modeled in Seqlok rather than plain local state:

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

The published meter surface is:

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
WASM build step in this slim demo.

## Guardrails

- Keep `@exclave/seqlok` public API untouched.
- Keep Signalsmith-specific code private to the demo app.
- Do not claim custom Signalsmith DSP, custom Signalsmith transport, or
  zero-copy audio behavior.
- Do not reintroduce a fake engine or streaming source architecture unless the
  work is explicitly re-scoped as an integration lab.
- Keep the bundled source labeled as the official Signalsmith demo loop unless
  upstream publishes more specific metadata.
