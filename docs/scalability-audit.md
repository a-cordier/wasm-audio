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
- **AudioContext unlock UX**: resume is opportunistic; a first-gesture unlock
  belongs in the workspace chrome (layout roadmap item).
- **`unsafeStatic(elementTag)` template cache** grows per distinct tag —
  bounded by device-type count.

## For item 5 — mixer rework
- `CHANNEL_COUNT = 16` channel strips (4 nodes each) are eagerly allocated at
  boot; no add/remove path, `MixerEngine.dispose()` has no caller.
- `ChannelState.slotId` is declared and never used — the slot↔channel
  association lives only in the routing-table keys; labels are hardcoded in
  root-element. Channel assignment should follow mount/unmount.
- Two slots routing the **same AudioNode** to overlapping channels confuses
  the routing diff (duplicate connections; one disconnect clears both). Cannot
  happen with per-slot instances today, but the effect-loop fan-out must not
  reintroduce it.
- `device-slot.wireAudio()`'s mixNode/parentOutput branch-summing path is dead
  code whenever a MixerEngine exists (always, today). Decide: delete or make
  branch submixes real.

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
