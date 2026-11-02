# Scalability audit — deferred findings (2026-08)

ROADMAP item 1 fixed the multi-instance/lifecycle/leak layer (per-instance
worklet state, per-slot instantiation, full disposal chain, single MIDI-learn
adapter, slot-scoped sequels storage, poly-ticks mergeSection, metering and
metronome routing, wasm heap growth, workletFiles conventions guard). The
findings below were **deliberately deferred** to the roadmap item that owns
them. Pointers, not specs — re-verify line numbers before acting.

## Item 3 (DAW shell) — RESOLVED 2026-08, except:
Done by the shell work: dynamic mount/unmount with shell-owned lifecycle
(unmount-vs-move settled — DOM disconnect is wiring-only, keyed `repeat`),
`descriptor.tag` removed (kind/accent added), KeyboardController flushes by
(channel, octaveShift) pair, session persistence. Still open, no owner:
- **Lazy loading & code-splitting**: all instruments statically imported
  (~260 KB chunk + all worklets at boot). The browser needs descriptors
  eagerly, so true laziness means a manifest/registration split plus a
  generated `workletFiles` map. Revisit when the bundle grows.
- **Worklet URLs are document-relative bare filenames** — any nested route
  breaks every load. Resolve against `import.meta.env.BASE_URL`.
- **Element ↔ plugin rebinding**: elements read state/subscribe in
  `connectedCallback` only; a same-tag `.plugin` swap on a connected element
  keeps the old controller. Matters if slots ever swap devices in place.
- ~~AudioContext unlock UX~~ — RESOLVED with item 4: a power-on overlay
  covers the app while the context is suspended (click = the autoplay-policy
  gesture → resume → reveal), backed by a first-gesture resume anywhere
  (pointerdown/keydown), so the hardware spin-up (seconds on Bluetooth)
  never lands on a downbeat, and the transport anchors only after resume
  completes.
- **`unsafeStatic(elementTag)` template cache** grows per distinct tag —
  bounded by device-type count.
- **KeyboardController has no `isEditable` guard** (keyboard.ts keydown →
  MIDI notes): typing in any future text input would play notes on armed
  devices. sequels' TransportKeys already guards via `isEditable`; port that
  check when the first text input lands in the UI.

## Item 5 (mixer rework) — RESOLVED 2026-11-02
All four findings closed by the rework: channels are dynamic (one per
mounted device, slot-keyed, created/removed with the mount; the 16 is a soft
cap), the slot id IS the channel identity (labels follow slot names), every
send/return edge is its own dedicated GainNode so no two slots ever connect
the same node pair (and returns never send at all — the cross-return cycle
was measured running away ×10^8 before the guard), and the dead
`wireAudio()` branch-summing path was deleted. `MixerEngine.dispose()`
still has no caller (engine lives for the page) — fine.

## For item 6 — automation module
- `getLearnableParams()` exists on all controllers and has **zero callers**;
  entries are `{id, name}` only — no setter, no range, no current value, no
  continuous/discrete flag, no section. Automation needs a real param
  metadata surface (and the `reg(...)` closure is where ControlID ↔ ParamId
  join — currently not introspectable).
- Learnable coverage is a subset of actual params (modes/destinations mostly
  missing; sequels exposes only BPM/SWING/GATE).
- `getState()` returns shallow copies — nested section objects are aliased to
  live controller state. Any consumer that snapshots must deep-clone
  (device-slot's USER snapshot already does).
- Value domain is raw 0–127 end to end; real units live only in the engines'
  `Range`. An automation UI showing real values needs declared ranges.

## MIDI-learn (later item)
- No persistence is wired (`exportBindings`/`importBindings` have no callers),
  and `importBindings` drops `slotBindings` — restored bindings would resolve
  slot-less and be filtered out by every slot. Fix the round-trip when
  persistence lands.
- One CC → one (control, slot): no multi-binding, and learning a CC on slot B
  silently steals it from slot A.
- Moving a device between slots orphans its bindings (keyed by slot id).

## Cosmetic / known-acceptable
- poly-ticks/monolog panel preset **menus** still share the module-level
  cursor (`SelectOptions.currentOption`) across instances; controllers boot
  from `at(0)` so this is display-only.
- Two sequels slots mounted before either saves both boot from the legacy
  shared storage key (reads fall back; writes are slot-scoped).
- `KeyboardController`/`MidiInputPort` reuse one mutable `MidiEvent`; any
  consumer that stores or defers an event must copy fields
  (sequencer-controller.ts does, with a comment).
- Emscripten Docker image tag is unpinned (`emscripten/emsdk` latest) locally;
  CI pins emsdk 6.0.2 via setup-emsdk. Same flags either way (`make build`).
