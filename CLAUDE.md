# wasm-audio — working agreement

Browser synths & sequencers: C++ DSP → Emscripten/wasm → AudioWorklet, with Lit UI.
This file is the always-on house style. Deeper procedures live in the `add-synth`
skill; design rationale lives in the memory files (see bottom).

## Architecture — how a synth is wired

A synth is a **plugin** registered in `src/instruments/<synth>/register.ts` via
`pluginRegistry.register({ descriptor, controllerFactory, elementTag, workletModules, keyboardOctaveShift })`,
and imported once in `src/components/daw-element.ts`. The descriptor carries
`kind` ("instrument" | "sequencer" | future "effect"/"module") and `accent`
(a CSS var) — that's what the device browser displays.

**Transport (mother/child clocks)**: `TransportController` (shell-owned) is
the master — start/stop/tempo anchored on the AudioContext clock; devices opt
in per slot (SYNC toggle, persisted). Master start = shared sample-anchored
downbeat; a synced device's own play quantizes to the master's next beat;
tempo follows the master (local BPM ghosted). Sources are pluggable: external
MIDI clock in later maps onto the same start/stop/setBpm calls. **Scheduled
MIDI events carry their audible AudioContext frame (mod 2^24) in ring slot
+3** — the sequencer emits from a 24 ms-lookahead scheduling clock and
instrument processors take only events due in the current block
(`dequeueBefore`); live sources stamp frame 0 = play now, zero added latency.
**Multi-note sources follow the chord-safe ring rules** (the rings are
strict FIFO and a future-stamped head blocks everything behind it):
reserve the whole burst before writing any of it, all ons before any off,
offs in on-order, stamps non-decreasing in write order — DISCHORD
(`src/instruments/dischord`, the chord sequencer: degree+quality steps
expanded in-processor at schedule time) is the reference, and RUDIMENT
(`src/instruments/rudiment`, the drum sequencer) is its multi-lane form:
11 lanes × velocity bytes, every lane with a hit fires on the step's frame
(same-note lanes dedupe to the louder hit), offs on one shared gate-end
stamp bounded by the next onset; per-lane length = polymeter off one grid
index (`grid mod laneLen`), so a pattern switch lands every lane on step 0.
A MIDI source can name a `preferredTarget` plugin id in its registration
(RUDIMENT → "drumlin", whose receive notes its lanes default to): the
mount wires its OUT to the first such slot, else the first instrument.
Melodic instruments apply events at block start (constant ≤2.9 ms quantum —
accepted, see docs/dsp-audit.md); **drumlin renders sample-exactly** — its
per-sample loop fires each trigger at its in-block offset, the pattern for
any future percussive voice.
**Engines hear the clock through ClockObserver** (`core/types.ts`,
optional): the shell `transport.observe()`s every plugin that implements
`onClock(anchor, playing)` at mount (passive — NOT the slot SYNC opt-in;
unobserve on eject), notified on start, stop and every tempo re-anchor.
The controller replays the last snapshot in init and posts
`{type:"__clock", anchorFrame, bpm, playing}`; the processor derives
`beats` from `currentFrame` per block (wasm: `*_set_clock(beats, bpm)`)
and **reads LFO phase absolutely** — `frac(beats / divBeats)`, never an
accumulator — so tempo changes are phase-continuous, master start snaps
to the downbeat, and a stopped master keeps cycling at tempo.
Divisions live in `core/divisions.ts`: **append-only** (indices are
stored), stepped musically via `stepDivision()`, mirrored by hand in
`dsp/lfo.h` `kDivBeats` and JS processors. The template's vibrato LFO is
the JS reference, `LFOKernel::nextSampleAt` the C++ one.

**The workspace is a fixed-chrome grid**: daw-element is a 100vh grid —
device-browser rail docked left (collapsible tab), an independently
scrolling rack viewport (the PAGE never scrolls), a thin full-width
transport strip pinned to the TOP edge (room to grow the global menu —
export…), and the mixer board docked at the bottom: hardware-desk strips
(contiguous, full width, hairline dividers; CLICK + MASTER close the
board; foldable, meter rAF stops while folded). Sequencers never take a
mixer channel: their metronomes sum into the shared CLICK bus
(`routeToClick`). **The rack is rows of devices**: drag a device by its
name label to arrange (drop markers preview; the end drop zone makes a new
row; empty rows prune). Default is ONE flowing row that wraps — wide
viewports fill edge to edge until the user makes deliberate rows. Prepared
"+" slots pad the last line to the screen's capacity (ResizeObserver-fed):
drag a device from the menu onto one to mount it there (menu entries are
drag sources; click still mounts); eject stays on the slot header. Slot
width lives in `--rack-slot-width` — never hardcode it. Dock/rail states persist in the session's `ui` field; row indices
persist per slot entry.

**The shell owns the rack**: daw-element mounts/unmounts devices at runtime
(`mountDevice`/`unmountSlot` — instantiate → route on a dynamic mixer
channel; ramp silent → dispose → unroute), and the whole session persists
(`core/rack-storage.ts`: layout + per-device state snapshots; the
sequencers self-persist under slot-scoped keys). Duplicate mounts auto-number ("ECHO 2") — slot names flow to
rack headers, strip nameplates and send-knob labels. Slots fold to their
header strip (device keeps running) and hold-to-eject unmounts. **KB arming
gates ALL computer-keyboard input** to a device — notes and document-level
shortcuts alike (sequels' transport keys check the armed flag); N armed
devices all respond. Non-instrument devices (effects, inputs) live under
`src/devices/*` — same registration conventions, scanned by the conventions
guard; the picker/mount affordances are everywhere: rail entries (click or
drag), prepared "+" slots in the rack AND prepared mixer strips (click pops
the shared `device-picker`), or drop a device anywhere on the rack viewport.

**App presets** (`core/preset-storage.ts`, `rack.presets.v1`) are named
whole-workspace snapshots, stepped from `preset-bar` (docked in the
transport strip's `menu` slot). The autosaved session stays the **working
copy** and records `preset: {id, dirty}`; a preset is its snapshot with
EVERY device's state (self-persisting ones included) minus the `ui`
chrome, which never travels or dirties. **INIT** is virtual (never
stored, always first, empty rack); saving on it is save-as. **Factory
presets** ship in code the same way (`core/factory-presets/*`, listed in
`FACTORY_SOURCES`, shown right after INIT): read-only via
`isReadOnlyPreset` — never stored, renamed or deleted, SAVE is save-as —
and sanitized on load like any saved preset. Dirty = the
canonical preset-shaped JSON differs from the baseline taken once the
rack has rendered after an open/save (slot elements push config on
render). `openPreset` is a deliberate switch: queued (latest wins),
transport stopped, board blacked out (`MixerEngine.setBlackout` — a stage
after the master meter, never state), `teardownRack` (modules first) via
`unmountSlot(…, {silent})`, `restoreSession(session, fromPreset)`,
blackout lifted. Slot ids repeat across presets by design (MOTION/SONG
keep their references), so **slot-scoped keys never outlive their slot**:
`SlotAware.forgetPersisted()` runs after dispose on eject/switch and
before init on any fresh mount. An empty stored rack stays empty — the
default rack is first-launch only.

**The mixer is dynamic** (`src/mixer/`): one channel per mounted
non-sequencer device, keyed by slot id — created on mount, ramped silent and
removed on eject; the board renders exactly the engine's channel list and
pads the unused capacity with prepared strips (16 cap). Per-channel chain:
`input → inserts [3-band EQ: low shelf 120 Hz, sweepable mid, high shelf
8 kHz] → fader → pan → meter (+ post-fader send taps) → master → limiter
(hard-knee ceiling, GR LED)`. The fader maps throw → gain through a desk law
(`fader-law.ts`: +6 dB top, unity at 3/4 throw, −∞ at 0) while STATE stays
linear amplitude. **Effect loops**: one send bus per mounted `kind:"effect"`
device (`getInputNode()` in — the `AudioEffect` contract; output returns on
the device's own ⏎ channel). The suite: ECHO (native delay), DRIVE (native
saturation), CHORUS (native doubling), VERB (worklet FDN reverb).
**Separate outs** (`HasAuxOutputs` in `core/types.ts`, optional): a
multi-voice device routes individual voices onto their own strips — the
shell reconciles channels keyed `slot:voice` against the device's routed
set (`getAuxOutputs()` = desired, `"aux-outputs-changed"` announces,
`setAuxActive` confirms — a full board bounces the toggle), persists aux
strips per voice (`RackSlotEntry.auxMixer`) and sweeps them on eject;
drumlin is the reference (route flips crossfade in-processor, no clicks).
**Chaining is cycle-aware — the DAG rule**: a send tap on a return strip
exists ⇔ that effect→effect edge keeps the send graph acyclic (`canSend`
DFS). Return taps build lazily and are DELETED when zeroed (node existence
= edge, freeing the reverse direction); even a zero-gain tap counts — it
closes a real audio cycle through the effects' delays (the ×10^8 runaway).
Refused knobs ghost ("would close a feedback loop"); persisted cyclic
levels zero on restore. **Solo is solo-safe for returns**: a non-soloed
return stays audible (tails survive solo); mute stays explicit; soloing a
return itself works like any strip. Strip settings
(gain/pan/mute/solo/eq/sends) persist per SLOT and
travel with it; send levels prune when their loop unmounts; master/click
levels persist on the session. **AUDIO IN** is a device (kind `"input"`):
getUserMedia behind the standard `getOutputNode()`, gesture-driven ENABLE
(never an unprompted permission dialog), LCD stepper for device selection,
and a MONITOR gate that defaults OFF (feedback protection — the panel LED
reads level pre-monitor).

**Modules are control-plane devices** (`kind:"module"`, descriptor
`type:"control"`): no audio, no MIDI channels, no mixer channel —
`routeSlot`/`defaultChannelsFor` skip them. The **ParamDirectory**
(`src/control/param-directory.ts`) is the automation address book: the
shell registers every Learnable plugin on mount (and unregisters first
thing on eject, before teardown), and automation dispatches straight to
`plugin.handleControlChange(ControlID, raw)` — the same addresses
MIDI-learn uses, so the target's engine AND panel knob follow. Dispatch
deliberately bypasses the BindingManager event bus: a control-rate tick
stream must not fan out through slot listeners or trigger session saves.
Modules are not Learnable themselves (no self-modulation feedback). MOTION
(`src/devices/automation`) is the reference: silent worklet tick clock
(port messages — hidden tabs clamp timers, not ports), `transport.beatsAt()`
read live when synced / phase accumulator when free, universal one-pole
GLIDE slew, and a 400 ms settle after retargeting so stepping the DEVICE
stepper across a device never slams its params in passing.

**SONG** (`src/devices/song`) is the arrangement module: 8 scenes
(per-sequencer cells — a pattern named by the device's own
`patternLabel()` (sequels: bank×pad, "B1"), `M`, or `—` no-change, keyed by
slot id; click a cell for the pattern picker, drag/wheel to step; each
column walks ITS device's `patternCount`, so sequencer kinds mix freely)
plus a chain of scene×bars entries
mapped from the **absolute master bar** — a pure function of `beatsAt()`,
never a counter, so manual launch takes over (CHAIN off) and re-engaging
rejoins the song position. It drives sequencers through
**PatternAddressable** (`core/types.ts`): `selectPatternAt(index, frame)` /
`setMuteAt(muted, frame)` land sample-exactly on the frame (mod 2^24; 0 =
now), `patternLabel(i)` names patterns in the device's own vocabulary —
implement it on any new sequencer to make it song-addressable. SONG mounts
with SYNC already on (`defaultSync` in its registration): it has no
free-run mode, so a half-ghosted birth would be wrong — devices that can
free-run (MOTION, sequencers) keep SYNC off at mount. The
rule that makes it bar-exact: **the target's worklet is the single
authority** — it confirms with `__pattern_applied`, and only then does the
controller write `ACTIVE_PATTERN` (the config-driven switch path stays
suppressed until that write catches up; writing up front races a switch
back). Dispatches go out ~80 ms before the bar with the target frame
computed from the anchor, backed off 64 frames, so dispatch jitter never
moves the boundary. Re-asserting the playing pattern is a no-op
(polymeter-safe). Mute is volatile everywhere: sequels never persists it,
SONG re-applies it per scene and lifts every mute it set on dispose.

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

Worklet-flavoured **effects** (reference: `verb`) take their params as
**port messages** (raw 0..127, smoothed in-processor) — the
SharedParamBuffer/PARAM_COUNT path is the instrument contract, not theirs.
Keep `process()` allocation-free (preallocate every buffer in the
constructor): a worklet that never allocates never gives the audio thread's
GC anything to collect. New effects stay native-node or JS-worklet until
profiling says wasm — SIMD/many-instance DSP is the crossover.

Any **new worklet file** (`*-processor.js`, `*.wasmmodule.js`) must be added to the `workletFiles` map in `vite.config.ts` — that's how it's served in dev and copied on build. Miss it and `addModule()` 404s.

## Control idioms

- **Continuous value → knob** (`knob-element`): GATE, SWING, HUMAN, SLIDE, cutoff…
- **Discrete choice → LCD stepper** (label + `[-] lcd [+]`): SCALE, SHAPE, EUCL, ROT…
- **Mode selector → full-width name buttons** spanning the panel (MOOG｜ACID｜SCREAM｜KORG).
- Labels sit on a shared baseline; knobs are centered in the band above them.
- **knob-element fires `change` only on user gestures** (drag/wheel);
  programmatic `.value` writes re-render silently. External writers
  (MIDI-learn, automation) go through controller setters — never rely on a
  knob echoing a programmatic set back as `change`.
- **Conditional relevance**: a control that does nothing in the current mode
  stays in place and GHOSTS — `?disabled` on `knob-element`/buttons, plus a
  title saying why; never remove it from the layout. The gate lives where
  ALL input paths converge (e.g. sequels' play/stop handlers gate SYNC for
  toolbar AND Space; its `handleControlChange` gates BPM under SYNC so
  MIDI-learn/automation writes are as inert as the ghosted stepper).
  Examples: FM knob outside FM routing, CYCLE off non-square waves, sequels
  local transport & BPM under SYNC, bus strips' pan/M/S, send knobs on
  return strips, MOTION's RATE/RUN↔DIV under SYNC and its step lane
  outside the STEP shape, every instrument LFO's RATE under its own SYNC
  (DIV ghosts when free; monolog's KEY phase-reset ghosts under SYNC).
- **No explainer copy in panels**: if a device panel or strip needs a caption
  to explain routing or behavior, the UX is wrong — fix the affordance
  (label, placement, ghosting, accent link) instead. `title=` tooltips on
  the control itself are fine; LCDs are the status displays (they may read
  "OFF" / "DENIED" / a device name), never prose.

## Panel / visual language

- **Neutral charcoal panels + one Pantone accent per instrument** (monolog yellow, poly-ticks cyan, sequels green LCD, drumlin orange, dischord violet, rudiment magenta).
- **Camaïeu**: a faint per-zone tint over the neutral base, distributed **by function** — same tonal weight, ~±5/channel.
- **Tokenize the look** — add a CSS custom property (per-device configurable), never hardcode a colour/radius/size. Restyle via vars, not edits.
- **Compact-first**: dense, tidy layouts; borrow whitespace toward content.

## Lifecycle — non-negotiables

- **Plugins are instantiated per SLOT** (daw-element walks the slot tree;
  the instance map is keyed by slot id). Never assume one instance per plugin
  id — the same device can be mounted twice.
- **Worklet processors keep all mutable state per instance** (`this._*` or the
  wasm hooks' `state` bag) — a module-scope variable in a processor file is
  shared by every instance and cross-wires them. Load modules via
  `addWorkletModuleOnce`, never raw `addModule`.
- **dispose() must release everything**: controllers dispose their node (which
  posts `__dispose`; processors free the engine and return false from
  process()), and device-slot teardown disposes the plugin + clears its mixer
  routing. New processors must handle `__dispose`.
- **UI elements unsubscribe symmetrically**: stable handler fields,
  addEventListener in connectedCallback, removeEventListener in
  disconnectedCallback (controllers are plain EventTargets — no subscribe
  wrappers). Same for document-level listeners.

## DSP — house standards

- **Band-limit every discontinuous waveform** (polyBLEP/BLAMP; the saw's sign
  convention is documented at `dsp/oscillator.h` `computeSaw`). Naive
  saws/squares alias — the template shows the JS-side idiom.
- **Smooth every param that reaches the audio path** (ramped block buffers or
  ~10 ms one-poles; snap to targets on fresh voices so attacks stay
  percussive). Mixer/graph gains ramp via `setTargetAtTime`, never
  `setValueAtTime`.
- **Envelopes retrigger from their current level**; a full `reset()` is only
  for silent voices. Flush denormals at feedback-state writes
  (`flushDenormal` in `dsp/constants.h` — wasm has no FTZ).
- **Velocity is perceptual** (`pow 0.6`), **pitch modulation is exponential**
  (semitones), waveshapers get oversampled (`Oversampler2x`), and per-sample
  maps use `exp2(c·log2 base)` over `pow`.
- Full findings ledger + deferred DSP work: `docs/dsp-audit.md`.

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
