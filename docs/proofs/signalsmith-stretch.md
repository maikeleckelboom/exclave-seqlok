# Seqlok Signalsmith Stretch Demo

- **Status:** slim demo authority; not package API authority
- **Date:** 2026-07-07
- **Product:** Signalsmith Stretch
- **Seqlok package:** `@exclave/seqlok`

## Current Scope

`apps/signalsmith-stretch` is now a compact browser demo. It exists to show that
Seqlok can own a small typed control contract while the official Signalsmith
Web Audio wrapper owns the DSP, WASM, AudioWorklet, buffering, scheduling, and
loop playback.

The demo intentionally does not contain a custom audio transport, custom WAV
parser, source prefetcher, simulator, private C++ build, generated WASM module,
or production runtime monitor.

## Runtime Model

The app uses the vendored upstream release wrapper:

```ts
import SignalsmithStretch from "../vendor/signalsmith-stretch/web/release/SignalsmithStretch.mjs";
```

The active path is:

1. Create an `AudioContext`.
2. Await `SignalsmithStretch(audioContext)`.
3. Browser-decode the bundled loop or a user-selected file.
4. Send channel buffers to the node with `addBuffers(...)`.
5. Use `schedule(...)`, `start(...)`, and `stop(...)` for playback.
6. Store UI-owned controls in a small Seqlok spec under
   `signalsmith-stretch/slim-controls`.

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
- Do not claim custom Worklet or zero-copy audio behavior.
- Do not reintroduce a fake engine or streaming source architecture unless the
  work is explicitly re-scoped as an integration lab.
- Keep the bundled source labeled as the official Signalsmith demo loop unless
  upstream publishes more specific metadata.
