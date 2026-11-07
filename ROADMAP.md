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

### 8. [x] Effects suite — done 2026-11-05
Four QA'd batches. The loop suite grows to four: DRIVE
(`src/devices/drive`, parallel saturation — pre-gain into a static
tanh(30x) shaper, 4x oversampled, so the DRIVE knob rides ramped gains
instead of swapping curves; Butterworth tone; 1/√drive loudness makeup) and
CHORUS (`src/devices/chorus`, two delay voices 15/21 ms swept antiphase by
one shared sine LFO, panned apart by SPREAD, −3 dB sum, no feedback path)
clone ECHO's native-node pattern; VERB (`src/devices/verb`) is the **first
worklet-flavoured effect** — an 8-line FDN in pure JS (mutually-prime
lines, unitary Hadamard butterfly, DECAY as true T60 0.3–12 s, per-line
one-pole DAMP 14 kHz–800 Hz, SIZE ×10 gliding the read offsets through
fractional reads — the glide IS the tape pitch-bend), params as port
messages raw 0..127 smoothed in-processor (SharedParamBuffer stays the
instrument contract), denormals flushed at every feedback write. Item 5's
two deferrals resolved: **effect chaining** landed as the DAG rule — a
return's send tap exists ⇔ the effect→effect edge keeps the send graph
acyclic (`canSend` DFS; taps on returns are lazy, zeroing deletes the tap
and frees the reverse edge; persisted cycles zero on restore; knobs ghost
per edge, "would close a feedback loop") — because even a zero-gain tap
closes a real cycle through the effects' delays; and **engine flavour**:
JS worklet until profiling says wasm (SIMD/many-instance DSP is the
crossover, not an 8-line FDN). Solo went **solo-safe for returns** (item
7's open flag): tails stay audible under solo, mute stays explicit.
Verified live: tails track T60 to the decibel, maxed feedback/decay chains
stay bounded (limiter untouched as backstop), chains persist across
reload, eject prunes edges. **PHASER and send-knob drag resolution
deferred** — dispositions in
[docs/scalability-audit.md](docs/scalability-audit.md).

### 9. [x] Drum synthesizer — done 2026-11-05
Four QA'd batches. DRUMLIN (`src/instruments/drumlin`) is the first
instrument born into the post-shell plugin contract — six analog-modeled
one-shot voices (KICK, SNARE, CLAP, closed/open HAT, 3-pitch TOM),
**pure-JS worklet by item 8's flavour rule** (a fixed 6-voice one-shot box
is the opposite of the SIMD/many-instance crossover; the processor can
become a wasm-kernel shim later at zero contract cost). **Triggers land
sample-accurately inside the block** — frame-stamped events keep their
in-block offset into a per-sample render loop — retiring dsp-audit's
deferred block quantum for exactly the case it was deferred for. GM-mapped
(35/36 kick … 41–50 toms at −5/0/+5 st; note-offs never enter the ring —
sequels' GATE is inert on drums by design), keyboard-playable
(`keyboardOctaveShift: -12`). House DSP throughout: exp decays by
recursive multiply with a −80 dB deactivation floor, kick/tom exponential
pitch envelopes, perceptual velocity under a global ACCENT depth law
(gain = 1−a + a·(v/127)^0.6), trigger-time params snap while LEVELs ride
10 ms one-poles, and the hats are ONE shared six-square polyBLEP bank
(TONE scales the inharmonic set) through fixed 10 kHz/7 kHz sizzle
filters into two VCAs — **a CH hit chokes OH through a ~3 ms fade**, the
dsp-audit two-stage-fade idiom's first implementation. The control plane
is one table: 20 ControlSpecs drive panel setters, MIDI-learn,
ParamDirectory/MOTION and syncParams through a single `setControl` gate.
EIGHT (boomy/loose) and NINE (punchy/bright) factory kits ride
`createDrumlinState` defaults (append-only safe). Verified live: choke
timing, tom pitch ratios, SNAP/TONE spectra, a 23-event polymetric bus
burst, MIDI-learn + automation dispatch, kit persistence across reload.

### 9b. [x] DRUMLIN expansion — new voices, note selectors, split hat tone, separate outs — done 2026-11-05
Four QA'd batches, user-requested after the kit's first sessions. **RIM,
RIDE and CRASH** join (9 voices): the 808 rimshot (two Q8 resonant bands
rung by a 4 ms burst) and two cymbals, each owning a **MetalBank** — the
hats' six-square polyBLEP bank extracted into a per-voice class, so
retuning one metallic voice never bends another's ringing tail (which is
also what let **CH and OH split their TONEs**: param 11 stays the CH tone
old sessions saved, OH_TONE appends). **Per-voice receive notes**: nine
LCD steppers (C4 = 60 names — the sequels convention), processor-resolved
from params, tom answers base ±2 at ∓/±5 st, and two voices on one note
BOTH fire (layering by design) — the multi-alias GM map retired with the
selectors. **Separate outs** landed as the first `HasAuxOutputs` device
(`core/types.ts`, optional contract): a STRIP toggle per voice moves it
onto its own mixer channel keyed `slot:voice` (full EQ/pan/sends/solo) —
the shell reconciles strips against the device's routed set and confirms
each via `setAuxActive` (a full board bounces the toggle), the processor
crossfades route flips over 10 ms (never a click), aux strips persist per
voice (`RackSlotEntry.auxMixer`) and sweep on eject, multi-instance
clean. PARAM_COUNT 20 → 48 (append-only throughout); the panel reflowed
to two zone rows to stay inside `--rack-slot-width`. Verified live:
isolation (routed kick 0.000 on main, full on its strip), strip + pan +
toggle surviving reload, second-instance eject with zero leftover
channels, independent hat combs, tom pitch ratios, layered flashes.

### 10. [x] Chord sequencer — done 2026-11-05
Two QA'd build batches + an integration pass that needed zero fixes.
DISCHORD (`src/instruments/dischord`) is the second sequencer — sequels'
full contract surface (midi-source + CLICK-bus click, TransportChild,
PatternAddressable speaking A0–D9, HasPresets, slot-scoped
self-persistence) gone harmonic: device-level KEY × nine heptatonic
SCALEs, steps hold DEGREEs (1–7, octave −2..+2, velocity) stacked in
diatonic thirds (VOICES 3/4/5 = triad/7th/9th) with a per-step QUALITY
override (MAJ…SUS4) escaping the scale, painted on a degree-numeral grid
by a TIE/DEG/OCT/QUAL/VEL brush. Chord expansion runs **in the processor
at schedule time** on the dual-clock scheduler, and the chord-safe ring
discipline landed with it: reserve the whole burst before writing any of
it, all ons before any off, offs in on-order, stamps non-decreasing in
write order (strummed ons ascend; a tie transition's held offs stamp at
the last strummed on — at STRUM 0 byte-identical to the 303 slide). **TIE
generalizes the slide to N notes with common-tone sustain** (repeating a
chord under TIE is zero events; tying into a new chord is a legato change
— measured: SMOOTH voiced Fmaj7 one semitone off Am7, moving one voice).
SMOOTH picks the minimal-motion inversion greedily; LEAD/BASS flips
emission order so a mono target (last-note priority) tracks the top line
or the roots; STRUM (0–60 ms per-note rake) rides future frame stamps
through the lookahead. Learnable (DIS_BPM gated under SYNC, SWING, GATE,
STRUM) — resolving item 7's note: the ParamDirectory stays Learnable-only
and SONG addresses DISCHORD through it. Verified live: downbeat
sample-exact on the master anchor, bar-exact SONG scenes + volatile mute
(eject lifts), MOTION sweeping STRUM, hidden-tab timing (180/180 events
delivered early, none late), two-instance isolation, global stop
releasing exactly the sounding notes. **Chord capture/recognition
deferred** (receive() is a stub that keeps KB arming alive) —
dispositions in [docs/scalability-audit.md](docs/scalability-audit.md).

### 11. [x] LFO clock sync — done 2026-11-06
Three QA'd build batches. Every instrument LFO — the template's new
vibrato reference, monolog's, poly-ticks' two — gets a per-LFO **SYNC**
toggle and a **DIV** LCD stepper over a shared, append-only
`core/divisions.ts` (4B…1/32 plus dotted 3/4, 3/8, 3/16 and triplet 1/6,
1/12, 1/24, walked by `stepDivision()` in beats order so steppers stay
musical while stored indices stay stable; MOTION reads the same list,
mirrored in `dsp/lfo.h` `kDivBeats` and the template processor). The
clock reaches the engines through a new passive **ClockObserver**
contract: TransportController notifies observers on start, stop and
every tempo re-anchor (wired at mount, independent of the slot SYNC
opt-in), controllers post a `__clock` snapshot, and processors read the
phase **absolutely** each block — `frac(beats / divBeats)` off
`currentFrame` — never accumulating it. So a tempo change is
phase-continuous, master start snaps to the shared downbeat, and a
stopped transport keeps cycling at the tempo rate (live playing still
wobbles). The wasm engines take `*_set_clock(beats, bpm)` per block and
run `LFOKernel::nextSampleAt`; poly-ticks computes one phase per block
for all voices, so chords wobble in unison. RATE ghosts under SYNC and
is gated in its setter (MIDI-learn/automation inert too), monolog's old
key-sync toggle renamed **KEY** and ghosts under SYNC. Poly-ticks swapped
to the shared LFOKernel along the way (NOISE now S&H's once per cycle —
the dsp-audit deferral closes). The conventions guard learned `*-node.ts`
and explicit C++ `PARAM_COUNT` values, so both wasm synths get a real
three-layer check. Verified live: measured rates exact (1/4 → 2 Hz,
1B → 0.5 Hz, 3/8 → 1.33 Hz at 120), gates inert on every input path, old
sessions load with SYNC off, free mode unchanged.

## Phase 4 — Workspace

The instrument rack is complete; the workspace around it grows next —
starting with moving between whole setups instead of living in one.

### 12. [x] App-level presets — done 2026-11-07
Three QA'd batches. Whole-workspace snapshots (`core/preset-storage.ts`,
`rack.presets.v1`) — rack layout, every device's state including the
self-persisting sequencers, mixer strips/EQ/sends/aux strips, master and
click, BPM — saved under a name and stepped from **`preset-bar`**, an LCD
stepper docked right in the top transport strip (its new `menu` slot)
with SAVE / SAVE AS / hold-to-delete and double-click rename, names
edited inline on the LCD (keys never reach armed devices). A virtual
**INIT** opens an empty rack and is never written: saving on it is
save-as. The autosaved session remains the **working copy** and records
which preset it descends from plus a dirty flag (`NAME*`), computed
against a canonical baseline taken once the rack has rendered; the
first step away from unsaved work reads `UNSAVED` and only a second
press discards. A switch is deliberate: queued (tap-through lands once),
transport stopped, the board blacked out behind a new post-meter stage
(`setBlackout`), the rack torn down through `unmountSlot` (modules
first, so SONG lifts its mutes while targets live) and the snapshot
remounted. Slot ids are kept verbatim per preset so MOTION targets and
SONG cells stay valid, which makes ids collide across presets — handled
by `SlotAware.forgetPersisted()`: slot-scoped keys are cleared after
dispose on eject/switch and before init on every fresh mount (sequels'
legacy unscoped-key fallback retired). Empty racks persist; the default
rack is first-launch only. Verified live: an eight-device preset
(sequels + DISCHORD patterns, EQ + echo send, drumlin kick on its own
strip, MOTION on monolog CUTOFF, a SONG scene/chain at 133 BPM)
round-trips byte-exact through INIT, another preset reusing `slot-1` for
a different device, and a reload; leak counts (plugins, channels,
transport children/observers) match each preset; legacy sessions open
as `INIT*`; a refused write reads `FULL`.

### 13. [~] Drum sequencer
SEQUELS speaks one note per step and DISCHORD speaks chords from scale
degrees — neither can put a snare and a clap on the same step. RUDIMENT
(`src/instruments/rudiment`) is a lanes × steps drum sequencer: 11 lanes
(KICK SNARE CLAP RIM CH OH LT MT HT RIDE CRASH) defaulting to DRUMLIN's
receive notes, editable per lane for other kits; any set of lanes fires on
one step under the chord-safe ring rules; a 3-level velocity brush
(SOFT/MID/ACC), swing, per-lane mute and per-lane length (polymeter). Full
sequencer contract surface (CLICK bus, SYNC, PatternAddressable A0–D9 for
SONG, presets, MIDI-learn, slot-scoped persistence with `forgetPersisted`).
