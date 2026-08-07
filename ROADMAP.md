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

### 1. [ ] Scalability audit & improvements
Assess the architecture against the DAW target and fix what blocks it.
- Plugin lifecycle: instances are created once at boot, one per plugin id
  ([root-element.ts](src/components/root-element.ts)). The DAW needs
  per-slot instantiation, disposal, and (question to settle) multiple
  instances of the same device.
- Audio graph hygiene: worklet/node teardown on unmount, AudioContext usage,
  SharedParamBuffer per instance.
- Asset & bundle cost: worklet module loading is serial and up-front; a device
  browser wants lazy loading per mount.
- State/preset model under dynamic slots (state must be keyed by slot, not
  by plugin).
- Output: findings + prioritized fixes; the fixes that gate item 3 land here.

### 2. [ ] DSP audit & improvements
Quality pass over both engine flavours (C++/wasm: monolog, poly-ticks;
JS worklet: sequels).
- Aliasing, denormals, param smoothing (zipper noise), per-block vs per-sample
  work, CPU headroom with many voices/devices.
- Output: findings + fixes where warranted. Informs the drum synth and
  effects DSP later.

## Phase 1 — DAW foundations

### 3. [ ] Dynamic device mounting (the shell)
The core DAW move: the slot tree stops being hardcoded.
- Device browser: menu of registered devices/effects, mount into a slot,
  unmount, swap.
- Registry descriptor grows what the browser needs (name, kind:
  instrument | effect | module, icon/accent).
- Slot-scoped lifecycle: instantiate on mount, dispose on unmount
  (depends on item 1's lifecycle work).
- Settle the **device vs module** distinction here: devices produce/process
  audio and mount into mixer-routed slots; modules (song mode, automation)
  are DAW-level features that operate *on* other devices and get DAW
  services (transport, param registry) instead of audio I/O.

### 4. [ ] Transport & clock sync (live mode)
- DAW master transport: play/stop, tempo, bar/beat position.
- Devices keep their **independent clocks by default** (live mode as it
  works today); per-device opt-in sync to the master clock.
- Builds on the existing sample-accurate MIDI transport
  (src/midi/transport) — likely clock events on the bus.
- Prerequisite for song mode, automation timelines, and LFO sync.

### 5. [ ] Mixer: dynamic routing & effect loops
- Channel assignment follows mount/unmount (routing is already slot-keyed
  in [mixer-engine.ts](src/mixer/mixer-engine.ts); it must become dynamic).
- Effect sends/returns (loops) and insert chains per channel.
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
