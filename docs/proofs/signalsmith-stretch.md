# Signalsmith Stretch Integration Record

- **Status:** Executable browser integration
- **Recorded:** 2026-07-08
- **SeqWire package:** `@exclave/seqwire`
- **Contract id:** `signalsmith-stretch/control-meter-boundary`
- **Application:** `apps/signalsmith-stretch`

## What Runs

The application runs the vendored upstream Signalsmith Stretch WebAssembly
release in a browser audio graph. It decodes the bundled official Signalsmith
demo loop, loads the decoded channel buffers into the upstream node, and exposes
the complete demo control surface through a SeqWire contract.

The main thread creates one SeqWire plan, packed backing, controller, observer,
and handoff. UI changes are written through the controller. The main-thread
adapter reads the canonical control state through the observer and applies it to
the upstream Signalsmith API.

## Runtime Topology

```text
UI controls
  -> SeqWire controller writes
  -> SeqWire observer control snapshot
  -> main-thread Signalsmith adapter
  -> SignalsmithStretchNode (upstream WebAssembly release)
  -> SeqWireMeterWorkletNode
  -> audioContext.destination

SeqWireMeterWorkletNode
  -> SeqWire processor meter publication
  -> SeqWire observer meter snapshot
  -> UI meter readout
```

The application imports the vendored wrapper through
`src/signalsmith-module.ts`, creates the upstream node with
`SignalsmithStretch(audioContext, channelOptions)`, and connects its output to
the custom downstream meter worklet.

## SeqWire Boundary

The SeqWire parameter contract contains:

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

The main-thread adapter applies the relevant canonical values through the
upstream node's `configure(...)`, `schedule(...)`, `start(...)`, and `stop(...)`
methods. Source replacement uses `dropBuffers()` followed by `addBuffers(...)`.

The downstream worklet receives the SeqWire handoff through its `MessagePort`
and binds a processor. During each audio quantum it reads
`control.outputGain` through `processor.params.within(...)`, applies that gain
to the post-stretch samples, and accumulates meter data. At approximately 60 Hz
it publishes:

- `levels.rmsL` and `levels.rmsR`
- `levels.peakL` and `levels.peakR`
- `levels.holdL` and `levels.holdR`
- `levels.clippedL` and `levels.clippedR`
- `runtime.frame`
- `runtime.publishCount`
- `runtime.droppedPublishCount`

The main thread reads those values through the SeqWire observer for the visible
meter UI.

## Demonstrated Boundary

This integration demonstrates a typed control and telemetry boundary around a
real browser DSP node, plus a real AudioWorklet that consumes SeqWire control
state and publishes SeqWire meters.

Signalsmith itself does not consume SeqWire memory. Its upstream Worklet and
WebAssembly implementation are unchanged; the main-thread adapter supplies its
configuration and scheduling calls. SeqWire's `control.outputGain` is applied
by the downstream meter worklet, after Signalsmith processing.

The source is one bundled official Signalsmith demo loop decoded by the
browser. The integration does not exercise arbitrary file loading, streaming,
custom Signalsmith transport, direct WebAssembly-memory sharing with
Signalsmith, or application lifecycle and recovery behavior.

## Verification

```sh
pnpm signalsmith:build
pnpm signalsmith:check
pnpm signalsmith:test:browser
```

The browser test verifies source loading, playback, seeking, control changes,
live meter publication, audible output, and the downstream output-gain path.
Third-party revisions and source attribution are recorded in
[`apps/signalsmith-stretch/THIRD_PARTY_NOTICES.md`](../../apps/signalsmith-stretch/THIRD_PARTY_NOTICES.md).
