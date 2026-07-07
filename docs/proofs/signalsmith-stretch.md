# Seqlok Signalsmith Stretch Demo

- **Status:** proof demo authority; not package API authority
- **Date:** 2026-07-08
- **Product:** Signalsmith Stretch
- **Seqlok package:** `@exclave/seqlok`
- **Contract id:** `signalsmith-stretch/control-meter-boundary`

## Current Scope

`apps/signalsmith-stretch` proves that Seqlok can model the full typed control
and telemetry contract around a real DSP engine. Signalsmith remains the DSP
engine. Seqlok owns the control and meter contract. The adapter applies
canonical Seqlok snapshots to the upstream Signalsmith Web API, and the
downstream meter Worklet proves realtime Seqlok reads and published telemetry
across the audio boundary.

The full Signalsmith control surface is mapped into Seqlok rather than held as
plain local state. The app writes the UI control state into Seqlok, reads back
the canonical Seqlok control snapshot, and applies that snapshot to the upstream
Signalsmith API from the main thread. The custom AudioWorklet is a downstream
realtime Seqlok audio-boundary proof node that reads `control.outputGain` and
publishes live meters back through Seqlok.

This is not a fake DSP demo, not a custom Signalsmith fork, and not a claim that
the internal upstream Signalsmith DSP Worklet reads Seqlok memory directly. The
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
SignalsmithStretchNode -> SeqlokMeterWorkletNode -> audioContext.destination
```

The active path is:

1. Create an `AudioContext`.
2. Await `SignalsmithStretch(audioContext, channelOptions)`.
3. Browser-decode the bundled loop or a user-selected file.
4. Reset and load the upstream node with `dropBuffers()` and `addBuffers(...)`.
5. Write the UI control state into Seqlok.
6. Read the canonical Seqlok control snapshot.
7. Apply that canonical Seqlok snapshot to the upstream node with
   `configure(...)`, `schedule(...)`, `start(...)`, and `stop(...)`.
8. Read `control.outputGain` from Seqlok inside `SeqlokMeterWorkletNode`.
9. Publish RMS, sample peak, peak hold, clip flags, frame count, publish count,
   and dropped publish count back through Seqlok.

## Seqlok Boundary

The full Signalsmith control surface remains modeled in Seqlok:

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

The downstream Worklet publishes this meter surface back through Seqlok:

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

- Keep `@exclave/seqlok` public API untouched.
- Keep Signalsmith-specific code private to the demo app.
- Do not claim custom Signalsmith DSP, custom Signalsmith transport, or
  zero-copy audio behavior.
- Do not claim the internal upstream Signalsmith DSP Worklet reads Seqlok memory
  directly.
- Do not reintroduce a fake engine or streaming source architecture unless the
  work is explicitly re-scoped as an integration lab.
- Keep the bundled source labeled as the official Signalsmith demo loop unless
  upstream publishes more specific metadata.
