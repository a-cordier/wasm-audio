# wasm-audio — working agreement

Browser synths & sequencers: C++ DSP → Emscripten/wasm → AudioWorklet, with Lit UI.
This file is the always-on house style. Deeper procedures live in the `add-synth`
skill; design rationale lives in the memory files (see bottom).

## Architecture — how a synth is wired

A synth is a **plugin** registered in `src/instruments/<synth>/register.ts` via
`pluginRegistry.register({ descriptor, controllerFactory, elementTag, workletModules, keyboardOctaveShift })`,
and imported once in `src/components/root-element.ts`.

Parameter signal path (one direction, lock-free):

```
UI control @change → controller setter → node.setParam(id, raw)     // raw = 0..127
   → SharedParamBuffer.set(id, raw)     // sized from ParamId.PARAM_COUNT
   → worklet processor drains PARAM_COUNT floats each block
   → engine.setParam(id, raw) → applyParams(): Range.map(raw, midiRange) → voice
```

The controller always sends **raw 0–127**; the engine owns the mapping to real
units via a `Range` (`dsp/range.h`). Discrete selectors emit their enum/index
directly; continuous knobs also get MIDI-learn wiring (`reg(...)` + `getLearnableParams()`).

**Two engine flavours:**
- **C++ / wasm** (reference: `monolog`) — `engine/*.h` + `*-kernel.cpp` → `make build` (Docker emscripten) regenerates `*.wasmmodule.js`.
- **Pure-JS worklet** (reference: `sequels`, `template`) — logic lives in `*-processor.js`; **no build step**.

Any **new worklet file** (`*-processor.js`, `*.wasmmodule.js`) must be added to the `workletFiles` map in `vite.config.ts` — that's how it's served in dev and copied on build. Miss it and `addModule()` 404s.

## Control idioms

- **Continuous value → knob** (`knob-element`): GATE, SWING, HUMAN, SLIDE, cutoff…
- **Discrete choice → LCD stepper** (label + `[-] lcd [+]`): SCALE, SHAPE, EUCL, ROT…
- **Mode selector → full-width name buttons** spanning the panel (MOOG｜ACID｜SCREAM｜KORG).
- Labels sit on a shared baseline; knobs are centered in the band above them.

## Panel / visual language

- **Neutral charcoal panels + one Pantone accent per instrument** (monolog yellow, poly-ticks cyan, sequels green LCD).
- **Camaïeu**: a faint per-zone tint over the neutral base, distributed **by function** — same tonal weight, ~±5/channel.
- **Tokenize the look** — add a CSS custom property (per-device configurable), never hardcode a colour/radius/size. Restyle via vars, not edits.
- **Compact-first**: dense, tidy layouts; borrow whitespace toward content.

## Params — invariants

- **Append params, never reorder** — indices are baked into saved presets.
- `PARAM_COUNT` must be identical in **all three**: the TS param enum, the C++ `ParamId`, and the `*-processor.js` const. A mismatch silently misaligns *every* param.
- Backward-compat: new state fields get defaults and flow through `mergeSection` so old presets keep loading.

## Verify before saying "done"

1. `npm run check` — `tsc --noEmit` + the convention smoke test (`check:conventions`) that asserts every synth's `PARAM_COUNT` is aligned across its layers (the untyped `processor.js` const `tsc` can't see) and the template still registers.
2. Drive the **live app** (HMR is already running): traverse shadow DOM, treat the **controller as source of truth** (read it back, not just the UI array), `await el.updateComplete` between steps (not `requestAnimationFrame` — it stalls when the browser pane is hidden; `innerWidth === 0` means hidden, so geometry is unreliable).
3. Clean up any scratch pattern/state you created.
4. Report failures with the actual output; never claim a rebuild/verify you didn't run.

## The template instrument (living reference)

`src/instruments/template/` is a minimal JS-worklet synth that's **opt-in**: it
only registers/appears when you load the app with a `?template` URL flag (dev
only, never shipped), so it never clutters normal work. `tsc` still compiles it
either way. It wires every cross-concern the right way — registration, params,
controller, state/presets, MIDI-learn, and all the control/panel idioms. It's
executable documentation: **clone this folder to start a new synth.** Because it
compiles and renders alongside everything, a breaking API change breaks *it*
first. When you change a shared primitive or a design rule, update the template
in the same commit (and this file / the `add-synth` skill).

## Where the deeper rules live

- `ROADMAP.md` — the ordered metaplan of upcoming projects (DAW direction); pick the top open item, plan it, execute, mark it done there.
- Skill `add-synth` — the full param-plumbing checklist + cross-concern scaffold for a new synth.
- Memory: `design-language`, `lcd-and-controls-are-tokenized`, `sequels-step-data-layout`.
