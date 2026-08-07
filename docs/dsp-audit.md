# DSP audit — findings ledger (2026-08)

ROADMAP item 2. Three parallel audits (poly-ticks engine, monolog engine,
shared dsp/ + JS worklets + audio-path plumbing); the critical findings were
re-verified by hand and each fix was measured live and QA'd by ear, batch by
batch. This ledger records what was fixed (with the commit theme) and what was
**deliberately deferred** with its owner. Pointers, not specs — re-verify
before acting on old line numbers.

## Fixed

| Finding | Fix (commit theme) |
|---|---|
| Shared envelope: `setSustainLevel` re-anchored a running release every block — click on every release, sustain-0 tails cut in one sample; retrigger paths zeroed the level the attack was about to read | anti-click envelope/retrigger (`4b85a9a`) |
| Saw polyBLEP sign inverted (falling saw, residual subtracted → +4 wrap step, worse than naive) — both engines, subs, saw LFOs | saw sign fix (`7eb9fa8`) |
| Monolog SCREAM integrator latched to DC below ~1.4 kHz (saturated output written into state — bistable); KORG topology couldn't resonate at all (lowpassed feedback to input, −1.9 dB measured) and DC-latched; MOOG limit-cycled ~8 kHz at max cutoff; model switch used stale kernel state; dirt wavefolder aliased at 1× | filter model repairs (`de58aee`): SCREAM linear integrators + hotter stages, KORG rebuilt as true Korg35 (HPF-in-loop, clipped ring boosted pre-saturator; +42.5 dB resonance gain), MOOG cutoff cap 0.25·SR, model-switch reset, dirt through Oversampler2x |
| No param smoothing anywhere (~semitone cutoff steps per knob detent); mixer gain/pan/mute stepped with `setValueAtTime` | zipper (`38043cd`): poly ramped param buffers + smoothed stereo field, monolog 10 ms one-poles (+velocity), mixer `setTargetAtTime` |
| Poly 16-voice sum clipped (measured 1.71 on a 20-note chord) | voiceGain 0.5 (`222939b`) |
| Pitch LFOs linear in Hz (−12/+7 st asymmetry, 0 Hz reachable); poly LFOs at half amplitude; LFO→MIX pumped instead of crossfading; CUT VEL was a constant offset; key-sync inert in legato; NOISE LFO was per-sample white noise; duty 0/1 silenced the square via MIDI-learn; GLIDE learn stored raw CCs (hours of glide); linear velocity everywhere; accent unreachable (thresh 0.8 vs max input 0.79) | modulation semantics (`8bdff01`) |
| No denormal guards (wasm has no FTZ; DC-blocker tail reaches subnormals in ~2.8 s); sustain-0 held voices rendered forever; `pow` per sample in every cutoff map; monolog rendered a bit-identical osc2 at detune 0; glide paid 2 logs + a division per sample | perf/denormals (`fc1d713`) |
| Sequencer step index teleported on tempo changes (position re-derived from the whole sample history); swung high-gate offs choked repeated pitches; click truncated on stop; per-step object allocation on the render thread | sequencer clock (`2eed3f2`) |
| Template (the living reference) taught naive aliasing waveforms, ignored velocity, stepped its level | template DSP (this commit) |

## Deferred — owned by a roadmap item

- **Item 4 (transport/clock)** — *the dominant remaining timing artifact*:
  sequencer events reach instruments via a 10 ms main-thread `setInterval`
  drain, re-emitted on the MidiBus, then block-quantised in the receiving
  worklet (timestamps are carried in the ring but never used to schedule).
  ~0–13 ms of jitter; will matter much more once drums land. Fix shape:
  sample-offset scheduling inside the receiving worklet, or sequencer clocks
  inside instrument worklets.
- **Item 5 (mixer)**: fader is a linear-amplitude taper with a dB readout
  (top half of the fader spans 6 dB); per-filter-model level trim
  (MOOG/ACID/SCREAM/KORG differ audibly at high res); a master limiter.
- **Item 3 (shell)**: ramp controller `output` gains to zero before
  `disconnectAudio()` on unmount/swap (instant graph teardown cuts
  mid-waveform; the GainNode exists on all controllers and its gain is never
  touched).

## Deferred — no owner yet (pick up opportunistically)

- `tan()` per sample in every filter coefficient (the remaining transcendental
  hot spot). A rational prewarp approximation or block-rate coefficients with
  per-sample interpolation would cut real CPU; not attempted because it
  changes filter tuning near Nyquist — do it with an A/B harness.
- SampleParameters/`assignParameters` hoisting: ~20 per-sample setters and 8
  constant `Range::map`s per sample per voice could move to block rate.
- `HalfBandDecimator::push` is a 7-element shift per sample (ring-buffer it);
  hard sync has no BLEP at the sync instant; FM at high index outruns 2×
  oversampling (worth 4× when an FM-heavy patch shows it).
- Poly LFO NOISE mode is still per-sample white noise (monolog's LFOKernel
  got S&H; poly uses raw kernels as LFOs — align when poly grows an LFO
  refactor).
- Voice stealing is retrigger-based (continuous but instant); a 2–5 ms
  two-stage fade would be strictly cleaner.
- Sub-oscillator crossfade conventions differ between engines (poly `SubOsc`
  helper vs monolog inline); the drum synth should pick one and promote it to
  `dsp/`.
- Dead code sweep of `dsp/`: `Filter::SVFKernel`, `NaiveResonantKernel`,
  `Waveshaper::tanhDrive` (≡ `fastTanh` unbounded), `resetWithDrift`,
  envelope RampType setters, unused ranges/constants. Note `Oversampler2x`
  is now LIVE (monolog dirt) — do not remove.
- Mono note stacks (duplicated line-for-line in both engines) don't dedupe a
  repeated note-on and drop silently when full; the glide helpers are also
  duplicated — promote both to `dsp/` when a third mono synth appears.
- `KeyboardController`/`MidiInputPort` reuse one mutable `MidiEvent` — any
  consumer that stores or defers an event must copy fields
  (sequencer-controller does, with a comment).

## House DSP standards established by this audit

Band-limit every discontinuous waveform (polyBLEP/BLAMP — sign convention
documented at `dsp/oscillator.h` `computeSaw`); smooth every param that
touches the audio path (ramped block buffers or ~10 ms one-poles; snap on
fresh voices); flush denormals at feedback-state writes (`flushDenormal`,
`dsp/constants.h`); envelopes retrigger from their current level, `reset()`
is only for silent voices; velocity is perceptual (`pow 0.6`); pitch
modulation is exponential (semitones); oversample waveshapers, not tanh
output stages; `exp2(c·log2 base)` over `pow(base, c)` in per-sample maps.
The template instrument demonstrates all of the above that apply to a JS
worklet synth.
