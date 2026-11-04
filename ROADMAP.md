# Roadmap — from instrument collection to DAW

This is the **metaplan**: the ordered list of projects we execute one at a time.
Process: pick the top open item → produce a concrete implementation plan (plan
mode) → approve → implement → verify per CLAUDE.md → mark done here. Items may
be reordered between cycles; scope notes below are starting points, not specs —
the real spec is the per-item plan, written just-in-time.

Status: `[ ]` planned · `[~]` in progress · `[x]` done

---

## Phase 0 — Know the ground

Audits first: the DAW shell will multiply whatever per-instrument costs exist
today (N mounted devices instead of 3 fixed ones), and DSP fixes get more
expensive once more engines are built on the same patterns.

### 1. [x] Scalability audit & improvements — done 2026-08-07
Everything below the future shell is now multi-instance-safe, leak-free, and
guarded: per-instance worklet state (+ change-gated params), per-slot plugin
instantiation keyed by slot id, full disposal chain with real teardown on
unmount, one app-level MIDI-learn adapter, slot-scoped sequels storage,
poly-ticks preset back-compat, routed-channels-only metering, metronome
through the mixer, wasm heap growth (flags unified with CI), and a
conventions guard for the workletFiles map. Verified live incl. a
two-monolog multi-instance smoke test. **Deferred findings for items 3/5/6
live in [docs/scalability-audit.md](docs/scalability-audit.md).**

### 2. [x] DSP audit & improvements — done 2026-08-07
Nine QA'd batches over both engine flavours + the mixer path + the sequencer
clock: envelope/retrigger clicks killed, the saw polyBLEP sign fixed, all
four monolog filter models repaired (KORG rebuilt as a true Korg35),
smoothing on every param path, voice headroom, modulation semantics
(semitone pitch LFOs, perceptual velocity, reachable accent), denormal
guards + hot-path cost cuts, a tempo-honest sequencer clock, and the
template upgraded to model house DSP standards. **Findings ledger and
deferred items (notably sample-accurate event scheduling → item 4) live in
[docs/dsp-audit.md](docs/dsp-audit.md).**

## Phase 1 — DAW foundations

### 3. [x] Dynamic device mounting (the shell) — done 2026-08-07
The shell owns the rack: mountDevice/unmountSlot with full lifecycle
(instantiate → route on a free mixer channel; ramp silent → dispose →
unroute), a device browser rail fed by descriptors (kind + accent added,
dead `tag` dropped), hold-to-eject, collapsible slots (folded devices keep
playing), full-session persistence (layout + per-device state,
`core/rack-storage.ts`), and **KB arming gates ALL computer-keyboard input**
(unarmed sequencers ignore transport keys; N armed respond — groundwork for
item 4's per-device transport commands). Keyed slot rendering makes element
identity follow slot identity. Remaining shell-adjacent items live in
[docs/scalability-audit.md](docs/scalability-audit.md). The device-vs-module
contract is reserved in the `kind` enum; modules land with items 6/7.

### 4. [x] Transport & clock sync (live mode) — done 2026-08-07
The jitter is gone and the mother clock exists. Frame-stamped events
(mod 2^24, ring slot +3) emitted from a 24 ms-lookahead scheduling clock,
applied by instruments in their exact block — measured 91/91 events on time
with 13.5–23.5 ms margin; sample-exact sub-block rendering evaluated and
deliberately skipped (constant ≤2.9 ms residual, jitter-free; see
docs/dsp-audit.md). TransportController (shell-owned, AudioContext-anchored,
pluggable sources — MIDI clock in later drives the same calls): SYNC per
slot, shared sample-anchored downbeats, beat-quantized local launches, ghosted
child BPM, persisted with the session, plus a minimal transport bar (final
chrome home: item 4b). Stop releases exactly the sounding notes (tracked in
the drain) instead of 128-note bursts; instrument rings 64 → 256. **MIDI
clock in/out remain future work by design** (no hardware to test).

### 4b. [x] DAW workspace layout — done 2026-08-09
The page became a workspace: daw-element is a 100vh grid — a collapsible
device-browser rail docked left (kind sections, accent nameplates), an
independently scrolling rack viewport, a thin top transport strip (global
menu grows there), and a bottom hardware-desk mixer board (contiguous
full-width strips, CLICK + MASTER at the right; folds, meters stop drawing
while folded) — settled after a UI-pattern review of DAW layouts.
Sequencer metronomes sum into a shared CLICK bus instead of eating
channels. **The rack is user-arranged rows** with drag-and-drop (label =
handle, drop markers, new-row zone, empty rows prune, row indices persist);
the default is one flowing row that wraps, so wide viewports stay fully
used, and prepared "+" slots pad the last line to screen capacity — drag a
device off the menu onto one to mount it there (shared `device-menu`). Conditional-relevance codified: SYNC ghosts local
transport, CYCLE ghosts off non-square waves. `--rack-slot-width`
tokenized; AudioContext unlock shipped with item 4 (power-on overlay).
Item 5 lands into the docked mixer instead of being styled twice.

### 5. [x] Mixer: dynamic routing, EQ, effect loops, audio input — done 2026-11-02
Six QA'd batches. Channels are dynamic (slot-keyed, created on mount, ramped
silent on eject) and the full-width board pads its unused capacity with
prepared strips — clickable (shared `device-picker`, also on rack "+" slots)
and drop targets, with devices droppable anywhere on the rack. Per-channel
insert chain landed with its first resident (3-band EQ: low shelf 120 Hz,
sweepable mid, high shelf 8 kHz, ±15 dB); desk fader law (+6 dB headroom,
unity at 3/4 throw) with the state kept in linear amplitude; master safety
limiter + GR LED. Effect loops proved with ECHO (`src/devices/echo`, native
tape delay — Butterworth tone after a lowpass-Q-is-in-dB self-oscillation
bug, tanh loop saturator): one post-fader send bus per mounted effect, the
return on the effect's own ⏎ channel, and **returns never send** (cross-
sending returns measured a ×10^8 runaway cycle). AUDIO IN shipped as a
device (gesture-driven permission, LCD input stepper, MONITOR gate default
OFF, tracks stopped on eject). Mixer state persists per slot (gain/pan/mute/
solo/eq/sends, pruned) + master/click on the session; legacy sessions load.
Monolog's four filter models level-matched in the kernel (<1 dB spread,
post-saturator trims). Duplicate mounts auto-number; `src/devices/*` joined
the conventions guard. **MIDI-learn persistence and effect chaining (cycle-
aware sends) deliberately deferred** — items 8+.

## Phase 2 — DAW modules

### 6. [x] Automation routing module — done 2026-11-03
Four QA'd batches. MOTION is the first `kind:"module"` device (descriptor
`type:"control"`: no audio, no MIDI, no mixer channel) — an automation
source routed to any learnable param of any mounted device through the new
**ParamDirectory** (`src/control/param-directory.ts`): the shell registers
every Learnable mount, and automation dispatches straight to
`handleControlChange(ControlID, raw)` — the MIDI-learn addresses — so the
target's engine AND panel knob follow, with zero session-save churn
(knob-element now fires `change` on user gestures only). Timing rides a
silent worklet tick clock (port messages — hidden-tab-proof); synced, the
cycle reads `transport.beatsAt()` live off the shared downbeat (DIV
4B…1/32, tempo changes free), free-running it's a RATE accumulator
(0.02–20 Hz) — SYNC ghosts RATE/RUN, free ghosts DIV. Shapes
SIN/TRI/RMP/SQR/S&H plus a 16-step drag-bar lane (paint across with gap
interpolation, COUNT 2–16), universal GLIDE slew (one-pole, 2 ms–2 s),
MIN/MAX range (inverts), playhead + output meter (rAF, value-quantized),
INIT preset. One target per module — mount more MOTIONs for more lanes
(they cost no channel). Rode along: sequels gates SEQ_BPM control writes
under SYNC (the ghosted stepper's rule now covers MIDI-learn/automation
too) and a 400 ms retarget settle so browsing the DEVICE stepper can't
slam params in passing. **Mixer-param targets and module-as-target
deferred** — dispositions in [docs/scalability-audit.md](docs/scalability-audit.md).

### 7. [x] Song mode module — done 2026-11-04
Three QA'd batches. SONG (`src/devices/song`) is scenes + chain — groovebox
song row, not timeline, decided at plan time: the transport stays beats-only
(no bars/locate API), so arrangement lives entirely in the module.
Groundwork: sequels grew frame-targeted addressing (**PatternAddressable**,
`core/types.ts`, resolved through ParamDirectory entries) —
`selectPatternAt(i, frame)` lands the pattern's step 0 sample-exactly on the
bar with the WORKLET as single authority (config syncs only on
`__pattern_applied`; the config-driven path stays suppressed until it
catches up), plus a scheduler-level mute (note-ons gated, frame-stamped offs
flow, the open slide releases ON the bar; volatile by design). A scene =
per-sequencer cells (pattern `A0–D9` / `M` / `—` no-change, slot-keyed, so
cells survive ejects invisibly); launches are instant when stopped or
unsynced (snapshot recall) and bar-quantized under a running master (~80 ms
dispatch lead, 64-frame boundary safety, measured ~20 ms scheduling lead at
120–180 BPM). The chain plays scenes in order, N bars each, mapped from the
**absolute** master bar: manual launch takes over (CHAIN off), re-engaging
rejoins the song position, LOOP wraps or holds at the end (a module never
stops the master), stop/start restarts at entry 0, tempo changes re-aim the
pending dispatch. Eject lifts every mute SONG set. **SEQ_PATTERN/SEQ_MUTE
ControlIDs (MIDI pattern-launch) and scene-mute re-apply after reload
deferred** — dispositions in
[docs/scalability-audit.md](docs/scalability-audit.md).

## Phase 3 — Devices & niceties

### 8. [ ] Effects suite
- A handful of effect devices (delay, reverb, drive, chorus… pick at plan
  time) using the kind:effect contract from item 3 and loops from item 5.

### 9. [ ] Drum synthesizer
- New instrument, born into the post-shell plugin contract. Engine flavour
  (C++/wasm vs JS worklet) decided at plan time, informed by item 2.

### 10. [ ] Chord sequencer
- Sequencer device emitting chords to other devices over the MIDI bus —
  the routing pattern sequels→monolog already proves.

### 11. [ ] LFO clock sync (nice-to-have)
- Per-LFO sync switch: free rate ↔ tempo-synced divisions of the master
  clock (needs item 4). Retrofit existing instruments' LFOs; template
  updated alongside.
