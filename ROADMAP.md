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

### 5. [ ] Mixer: dynamic routing, EQ, effect loops, audio input
- Channel assignment follows mount/unmount (routing is already slot-keyed
  in [mixer-engine.ts](src/mixer/mixer-engine.ts); it must become dynamic).
  (A routed-only strip view was tried in 4b and rolled back — the user
  prefers the full-width board; revisit presentation here.)
- **Per-track EQ**: 3-band (low shelf / mid peak / high shelf) as chained
  BiquadFilterNodes between channel input and fader — the first resident of
  the per-channel insert chain, native nodes, smoothly ramped AudioParams.
- Effect sends/returns (loops) and insert chains per channel.
- **Audio input as a DEVICE**: an "AUDIO IN" browser entry (descriptor kind
  "input") wrapping getUserMedia → MediaStreamAudioSourceNode behind the
  standard getOutputNode() — mounts/routes/folds/persists like any device.
  Handle: permission flow, input selection (enumerateDevices), mono→stereo,
  and feedback protection (per-channel monitor mute). Opens recording later.
- Prove the plumbing with one minimal effect device (e.g. a delay) — the
  full effects suite is item 8.

## Phase 2 — DAW modules

### 6. [ ] Automation routing module
- Design an automation (curve/steps/shape) and route it to any control of
  any mounted device; the control moves accordingly.
- Rides the existing param path: controllers already expose learnable
  params (MIDI-learn registry) — automation is another signal source
  targeting the same addresses.
- A module, not an instrument feature: mounted only when wanted.

### 7. [ ] Song mode module
- Arrangement/composition over the master transport (scenes or timeline —
  to decide at plan time).
- A module, not part of the shell: absent in live mode by default.

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
