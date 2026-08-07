---
name: add-synth
description: Add a parameter to a synth engine, or scaffold a whole new synth/instrument, in the wasm-audio project. Covers the generic param-plumbing architecture (TS controller → SharedParamBuffer → worklet → engine), MIDI-learn wiring, state/preset back-compat, plugin registration, the two engine flavours (C++/wasm vs pure-JS worklet), and the control/panel idioms. Use whenever adding or wiring an instrument parameter or building a new instrument.
---

# Adding / scaffolding a synth in wasm-audio

This is the reusable pattern behind every instrument. `monolog` is the C++/wasm
reference; `sequels` is the pure-JS-worklet reference. Nothing here is
monolog-specific — swap the names for your synth.

## The mental model

Every instrument is a **plugin**: an engine (DSP), a worklet processor (the
audio-thread shell), a controller (main-thread brain), typed params + state, and
a Lit UI element. Parameters flow **one way**, lock-free:

```
UI @change → controller.setX(raw) → node.setParam(id, raw)   // raw = 0..127
  → SharedParamBuffer.set(id, raw)          // Float32, sized from ParamId.PARAM_COUNT
  → worklet processor drains PARAM_COUNT floats per block
  → engine.setParam(id, raw) → applyParams(): Range.map(raw, midiRange) → voice
```

Rules that fall out of this and must never be broken:

- The **controller sends raw 0–127**. The **engine owns the unit mapping** via a
  `Range` from `dsp/range.h` (`zeroOneRange`, `centShiftRange`, custom ranges…).
  Don't pre-scale in the controller.
- **`PARAM_COUNT` is one number in three files** — the TS param enum, the C++
  `ParamId`, and `*-processor.js`. The `SharedParamBuffer` is sized from the TS
  value; the processor drains that many floats; the engine indexes into them. If
  they disagree, **every param past the mismatch is silently wrong** (no error).
- **Params are append-only.** Never renumber — saved presets store raw indices.
- Discrete **selectors** push their enum/index straight through; **continuous
  knobs** additionally register for MIDI-learn.

## Task A — add a parameter to an existing synth

Edit in this order; the ⚠ steps are the alignment trio.

1. `types/<synth>-params.ts` — add the id before `PARAM_COUNT`; **`PARAM_COUNT++`** ⚠
2. `engine/<synth>-engine.h` — add to `ParamId` (same position); map it in `applyParams()` with the right `Range` ⚠
3. `engine/<synth>-voice.h` — add the setter + member + apply it in the DSP (skip for pure-JS engines; do the equivalent in the processor)
4. `types/<synth>-state.ts` — add the state field + default; it must flow through `mergeSection` (keeps old presets loading)
5. `<synth>-controller.ts` — add the setter (writes `node.setParam(id, raw)`), send it in `syncParams()`, and for a **knob** add a `reg(ControlID.X, ParamId.X, Event, …)` + a `getLearnableParams()` entry (selectors need neither)
6. `src/control/types.ts` — add the `ML_*` / control id
7. `ui/<synth>-element.ts` — add the control per the **idioms** (knob = continuous, stepper = discrete, full-width buttons = mode)
8. `<synth>-processor.js` — bump the hardcoded `PARAM_COUNT` to match ⚠

Then: **C++ engine → `make build`** (Docker emscripten regenerates the
`*.wasmmodule.js`). **Pure-JS worklet → no build.** Verify (see below).

## Task B — scaffold a NEW instrument (cross-concern checklist)

**Fastest path: clone `src/instruments/template/`** — the dev-only reference synth
that already wires every item below. Rename `template`→`<synth>`, adjust params,
done. The list here is the contract it satisfies:

- **Registration** — `instruments/<synth>/register.ts` calls
  `pluginRegistry.register({ descriptor:{id,name,tag,type:"instrument"}, controllerFactory, elementTag, workletModules, keyboardOctaveShift })`; add `import "../instruments/<synth>/register"` to `src/components/root-element.ts`.
- **Serve the worklet** — add each `workletModules` file to the `workletFiles` map in `vite.config.ts`, or `addModule()` 404s in dev and build.
- **Params** — a `ParamId` enum ending in `PARAM_COUNT`; the alignment trio above.
- **Node** — sizes a `SharedParamBuffer(ParamId.PARAM_COUNT)`, loads the worklet module, owns `setParam`.
- **Worklet processor** — drains the param buffer each block; for a JS engine the DSP lives here, for a C++ engine it forwards into the wasm kernel.
- **Engine** — `setParam` + `applyParams()` mapping every raw value through a `Range`; a `Voice`/render path.
- **Controller** — one setter per param, `syncParams()`, MIDI-learn regs for knobs, autosave/state load.
- **State + presets** — a `create<Synth>State(partial)` built from defaults via `mergeSection`, so partial/old presets forward-migrate.
- **UI element** — a Lit element following the **control idioms** and the **panel language** (neutral charcoal + one accent, camaïeu per zone, everything tokenized via CSS vars; compact-first).
- **Theme tokens** — panel/accent vars in `src/theme/tokens.css.ts` for **both** themes (dark + retro).

Pick the engine flavour deliberately: **C++/wasm** for DSP-heavy voices (costs a
Docker build + a shipped wasm artifact), **pure-JS worklet** for lighter or
event/sequencer logic (no build, self-contained).

## Verify before "done"

1. `npm run check` — `tsc --noEmit` + `check:conventions` (asserts every synth's
   `PARAM_COUNT` is aligned across its layers and the template still registers).
2. Drive the **live app**: traverse shadow DOM, read the **controller back as the
   source of truth**, `await el.updateComplete` between steps (not
   `requestAnimationFrame` — it stalls when the pane is hidden; `innerWidth === 0`
   means hidden → geometry unreliable).
3. For a new C++ engine, `make build` after C++ edits, then sanity-check no
   NaN/blow-up at extremes.
4. Clean up scratch state; report real results.
