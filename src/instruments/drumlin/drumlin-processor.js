/*
 * Copyright (C) 2020 Antoine CORDIER
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createMidiDrain } from "./worklet-drain.js";

// DRUMLIN — 6 one-shot analog-modeled drum voices, pure-JS engine.
// Triggers land SAMPLE-ACCURATELY inside the block: frame-stamped events keep
// their in-block offset (live events play at sample 0). Other instruments
// apply events at block start (constant ≤2.9 ms quantum, see docs/dsp-audit.md)
// — drums are the case where that quantum is worth retiring, and a greenfield
// per-sample render loop gets it for free.

// Param indices — MUST match types/drumlin-params.ts. PARAM_COUNT is the
// untyped twin tsc can't see; the check:conventions script guards it.
const KICK_TUNE = 0;
const KICK_PUNCH = 1;
const KICK_DECAY = 2;
const KICK_LEVEL = 3;
const SNARE_TUNE = 4;
const SNARE_SNAP = 5;
const SNARE_DECAY = 6;
const SNARE_LEVEL = 7;
const CLAP_TONE = 8;
const CLAP_DECAY = 9;
const CLAP_LEVEL = 10;
const CH_TONE = 11; // born HAT_TONE — index baked into saved presets
const CH_DECAY = 12;
const CH_LEVEL = 13;
const OH_DECAY = 14;
const OH_LEVEL = 15;
const TOM_TUNE = 16;
const TOM_DECAY = 17;
const TOM_LEVEL = 18;
const ACCENT = 19;
const RIM_TUNE = 20;
const RIM_DECAY = 21;
const RIM_LEVEL = 22;
const RIDE_TONE = 23;
const RIDE_DECAY = 24;
const RIDE_LEVEL = 25;
const CRASH_TONE = 26;
const CRASH_DECAY = 27;
const CRASH_LEVEL = 28;
// Per-voice receive notes (raw value = the MIDI note; tom answers base ±2).
const KICK_NOTE = 29;
const SNARE_NOTE = 30;
const CLAP_NOTE = 31;
const CH_NOTE = 32;
const OH_NOTE = 33;
const TOM_NOTE = 34;
const RIM_NOTE = 35;
const RIDE_NOTE = 36;
const CRASH_NOTE = 37;
const OH_TONE = 38; // CH kept index 11 when the hats' shared TONE split
const PARAM_COUNT = 39;

const TWO_PI = 2 * Math.PI;

// Frame stamps wrap mod 2^24 (src/midi/types.ts FRAME_WRAP).
const FRAME_WRAP = 1 << 24;
const HALF_WRAP = 1 << 23;

// Raw 0..127 → [lo, hi], exponential (the engine owns the unit mapping; the
// controller always sends raw values).
const expMap = (raw, lo, hi) => lo * Math.pow(hi / lo, raw / 127);

// T60 seconds → per-sample decay multiplier (reaches −60 dB after t60).
const LN_1000 = Math.log(1000);
const decayK = (t60) => Math.exp(-LN_1000 / (t60 * sampleRate));

// xorshift32 — mirrors dsp/oscillator.h NoiseKernel (same shift triplet).
const makeNoise = (seed) => {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s / 4294967295) * 2 - 1;
  };
};

// Trigger-time params SNAP (fresh-voice rule: attacks stay percussive); only
// the six LEVELs smooth per sample (~10 ms one-pole against knob zipper).
const LVL_ALPHA = 1 - Math.exp(-1 / (0.01 * sampleRate));

// Kick: pitch envelope ~60 ms T60 (the sweep lives in the first ~20 ms),
// click burst ~8 ms. Fixed by design — PUNCH scales their depth/mix.
const KICK_PITCH_K = decayK(0.06);
const KICK_CLICK_K = decayK(0.008);

// Snare: the tonal pair rings ~110 ms regardless of DECAY (DECAY shapes the
// noise tail, like the 808's SNAPPY); noise is bandpassed wide around 2 kHz.
const SNARE_TONE_K = decayK(0.11);
const SN_BP = (() => {
  const w0 = (TWO_PI * 2000) / sampleRate;
  const alpha = Math.sin(w0) / (2 * 0.8);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, a1: (-2 * Math.cos(w0)) / a0, a2: (1 - alpha) / a0 };
})();

// Clap: three re-strikes 11 ms apart (fast chop ~45 ms T60), then the tail.
const CLAP_SPACING = Math.round(0.011 * sampleRate);
const CLAP_STRIKE_K = decayK(0.045);

// PolyBLEP residual — the house band-limiting idiom (template-processor.js /
// dsp/oscillator.h). The hats' six squares alias audibly without it.
const polyBlep = (t, dt) => {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
};

// Hats: six squares at the 808-ish inharmonic set through 10 kHz/7 kHz
// sizzle stages. CH and OH each own a MetalBank since their TONEs split —
// retuning one never bends the other's ringing tail; a CH hit still chokes
// the OH tail through a ~3 ms fade (dsp-audit's two-stage-fade idiom).
const HAT_FREQS = [205.3, 304.4, 369.99, 522.7, 540, 800];
const HAT_CHOKE_K = decayK(0.003);
const HAT_MAKEUP = 3.0; // the 10 kHz band keeps little of a square's energy

// Rim: two parallel resonant bandpasses (f0 + 3.4·f0, Q 8) rung by a ~4 ms
// noise burst — the 808 rimshot's clicky pitched knock.
const RIM_BURST = Math.round(0.004 * sampleRate);
const RIM_MAKEUP = 10.0; // Q8 bands pass little of the burst; tanh soft-caps the onset

// Cymbals: each voice OWNS a metallic bank (retuning one never bends another
// voice's ringing tail) with a fast transient env over the main tail.
const RIDE_PING_K = decayK(0.08);
const CRASH_BLOOM_K = decayK(0.15);
const CYM_MAKEUP = 2.5;

// Tom: mild fixed pitch envelope (~4 st over ~80 ms) + a lowpassed noise skin
// transient (~50 ms) over the tunable sine body.
const TOM_PITCH_K = decayK(0.08);
const TOM_NOISE_K = decayK(0.05);
const TOM_NOISE_ALPHA = 1 - Math.exp((-TWO_PI * 2000) / sampleRate);

// Feedback-state denormal flush (the VERB idiom — JS has no FTZ either).
const flush = (v) => (v > -1e-15 && v < 1e-15 ? 0 : v);

// Dead-voice floor: −80 dB. Exponential tails then deactivate instead of
// rendering forever in subnormal territory (JS has no FTZ either).
const ENV_FLOOR = 1e-4;

// One metallic bank: six free-running polyBLEP squares through fixed
// bandpass + highpass stages. Instantiated per VOICE (constructor only —
// process() stays allocation-free). Hats migrate onto this in a later batch.
class MetalBank {
  constructor(bpF, bpQ, hpF) {
    this._phases = new Float64Array(6);
    this._inc = new Float64Array(6);
    for (let k = 0; k < 6; k++) this._inc[k] = HAT_FREQS[k] / sampleRate;
    const w0 = (TWO_PI * bpF) / sampleRate;
    const alpha = Math.sin(w0) / (2 * bpQ);
    const a0 = 1 + alpha;
    this._bpB0 = alpha / a0;
    this._bpA1 = (-2 * Math.cos(w0)) / a0;
    this._bpA2 = (1 - alpha) / a0;
    const w1 = (TWO_PI * hpF) / sampleRate;
    const cw = Math.cos(w1);
    const al = Math.sin(w1) / (2 * Math.SQRT1_2);
    const h0 = 1 + al;
    this._hpB0 = (1 + cw) / 2 / h0; // b2 === b0 for an RBJ highpass
    this._hpB1 = -(1 + cw) / h0;
    this._hpA1 = (-2 * cw) / h0;
    this._hpA2 = (1 - al) / h0;
    this._bpZ1 = 0;
    this._bpZ2 = 0;
    this._hpZ1 = 0;
    this._hpZ2 = 0;
  }

  setScale(scale) {
    for (let k = 0; k < 6; k++) this._inc[k] = (HAT_FREQS[k] * scale) / sampleRate;
  }

  render() {
    let metal = 0;
    for (let k = 0; k < 6; k++) {
      const inc = this._inc[k];
      let t = this._phases[k];
      let s = t < 0.5 ? 1 : -1;
      s += polyBlep(t, inc); // rising edge at 0
      let t2 = t - 0.5;
      if (t2 < 0) t2 += 1;
      s -= polyBlep(t2, inc); // falling edge at 0.5
      metal += s;
      t += inc;
      if (t >= 1) t -= 1;
      this._phases[k] = t;
    }
    metal /= 6;
    const yb = this._bpB0 * metal + this._bpZ1;
    this._bpZ1 = flush(-this._bpA1 * yb + this._bpZ2);
    this._bpZ2 = flush(-this._bpB0 * metal - this._bpA2 * yb);
    const yh = this._hpB0 * yb + this._hpZ1;
    this._hpZ1 = flush(this._hpB1 * yb - this._hpA1 * yh + this._hpZ2);
    this._hpZ2 = flush(this._hpB0 * yb - this._hpA2 * yh);
    return yh;
  }
}

const MAX_PENDING = 64;
const OUT_GAIN = 0.35; // fixed headroom — the mixer strip owns the rest

class DrumlinProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._params = null;
    this._midi = null;
    this._alive = true;

    // Pending triggers for the current block (offset-sorted, preallocated).
    this._pOff = new Int32Array(MAX_PENDING);
    this._pNote = new Int32Array(MAX_PENDING);
    this._pVel = new Int32Array(MAX_PENDING);

    // KICK
    this._kActive = false;
    this._kEnv = 0;
    this._kPEnv = 0;
    this._kClick = 0;
    this._kPhase = 0;
    this._kF0 = 50;
    this._kPSemis = 0;
    this._kAmpK = 0;
    this._kGain = 0;
    this._kNoise = makeNoise(0xd1ce5eed);

    // SNARE — two detuned sines + bandpassed noise, SNAP balances them.
    this._sActive = false;
    this._sTEnv = 0;
    this._sNEnv = 0;
    this._sP1 = 0;
    this._sP2 = 0;
    this._sF1 = 180;
    this._sF2 = 330;
    this._sSnap = 0.5;
    this._sAmpK = 0;
    this._sGain = 0;
    this._sZ1 = 0;
    this._sZ2 = 0;
    this._sNoise = makeNoise(0x5ead00d5);

    // CLAP — noise → resonant bandpass, 3 re-strikes then an exp tail.
    this._cActive = false;
    this._cEnv = 0;
    this._cK = 0;
    this._cTailK = 0;
    this._cStrike = 0;
    this._cT = 0;
    this._cGain = 0;
    this._cB0 = 0;
    this._cA1 = 0;
    this._cA2 = 0;
    this._cZ1 = 0;
    this._cZ2 = 0;
    this._cNoise = makeNoise(0xc1a9c1a9);

    // Biquad coefficient scratch (bandpass; preallocated, written at trigger).
    this._bq = new Float32Array(3);

    // HATS — a MetalBank per hat (free-running phases: per-hit variation).
    this._chBank = new MetalBank(10000, 1.1, 7000);
    this._ohBank = new MetalBank(10000, 1.1, 7000);
    this._chActive = false;
    this._chEnv = 0;
    this._chK = 0;
    this._chGain = 0;
    this._ohActive = false;
    this._ohEnv = 0;
    this._ohK = 0;
    this._ohGain = 0;

    // TOM — one mono voice, three pitches by note (a retrigger takes it over).
    this._tActive = false;
    this._tEnv = 0;
    this._tPEnv = 0;
    this._tNEnv = 0;
    this._tPhase = 0;
    this._tF0 = 120;
    this._tAmpK = 0;
    this._tGain = 0;
    this._tNz = 0;
    this._tNoise = makeNoise(0x70a070a1);

    // RIM — two parallel resonant bandpasses rung by a short noise burst.
    this._rimActive = false;
    this._rimEnv = 0;
    this._rimK = 0;
    this._rimGain = 0;
    this._rimBurst = 0;
    this._rimB0a = 0;
    this._rimA1a = 0;
    this._rimA2a = 0;
    this._rimZ1a = 0;
    this._rimZ2a = 0;
    this._rimB0b = 0;
    this._rimA1b = 0;
    this._rimA2b = 0;
    this._rimZ1b = 0;
    this._rimZ2b = 0;
    this._rimNoise = makeNoise(0x21b50ff5);

    // RIDE / CRASH — each owns a metallic bank.
    this._rideBank = new MetalBank(6500, 1.0, 4000);
    this._rdActive = false;
    this._rdEnv = 0;
    this._rdK = 0;
    this._rdPing = 0;
    this._rdGain = 0;
    this._crashBank = new MetalBank(4500, 0.7, 3000);
    this._crActive = false;
    this._crEnv = 0;
    this._crK = 0;
    this._crBloom = 0;
    this._crGain = 0;

    // Smoothed per-voice levels.
    this._lvlKick = 0;
    this._lvlSnare = 0;
    this._lvlClap = 0;
    this._lvlCh = 0;
    this._lvlOh = 0;
    this._lvlTom = 0;
    this._lvlRim = 0;
    this._lvlRide = 0;
    this._lvlCrash = 0;

    this.port.onmessage = (e) => {
      if (e.data && e.data.type === "__init_sab") {
        this._params = new Float32Array(e.data.paramBuffer);
        this._midi = createMidiDrain(e.data.midiBuffer);
      } else if (e.data && e.data.type === "__dispose") {
        // Returning false from process() lets the node be garbage collected.
        this._alive = false;
      }
    };
  }

  // Drain note-ons due within this block into the pending list, keeping each
  // event's in-block sample offset (stamp 0 = live = play at sample 0).
  // Insertion-sorted by offset: events from mixed sources aren't ordered.
  _drain(blockLen) {
    const m = this._midi;
    const base = currentFrame % FRAME_WRAP;
    let n = 0;
    while (m.dequeueBefore(currentFrame + blockLen)) {
      const on = m.status === m.NOTE_ON && m.data2 > 0;
      if (!on) continue; // one-shot voices: note-offs carry no meaning
      let off = 0;
      const stamp = m.frame;
      if (stamp !== 0) {
        let d = stamp - base;
        if (d > HALF_WRAP) d -= FRAME_WRAP;
        else if (d < -HALF_WRAP) d += FRAME_WRAP;
        if (d > 0) off = d >= blockLen ? blockLen - 1 : d;
      }
      if (n >= MAX_PENDING) continue; // burst beyond 64 note-ons: drop extras
      const note = m.data1;
      const vel = m.data2;
      let j = n;
      while (j > 0 && this._pOff[j - 1] > off) {
        this._pOff[j] = this._pOff[j - 1];
        this._pNote[j] = this._pNote[j - 1];
        this._pVel[j] = this._pVel[j - 1];
        j--;
      }
      this._pOff[j] = off;
      this._pNote[j] = note;
      this._pVel[j] = vel;
      n++;
    }
    return n;
  }

  // Per-voice receive notes (params 29–37, edited by the panel steppers).
  // Every matching voice fires — two voices on one note layer deliberately;
  // unmapped notes are silent by design. Tom answers base ±2 at ∓/±5 st.
  _trigger(note, vel) {
    const p = this._params;
    // Velocity response: perceptual curve, depth set by ACCENT
    // (a=0: every hit equal; a=1: full pow-0.6 dynamics).
    const a = p[ACCENT] / 127;
    const gain = 1 - a + a * Math.pow(vel / 127, 0.6);
    if (note === (p[KICK_NOTE] | 0)) this._triggerKick(p, gain);
    if (note === (p[SNARE_NOTE] | 0)) this._triggerSnare(p, gain);
    if (note === (p[CLAP_NOTE] | 0)) this._triggerClap(p, gain);
    if (note === (p[CH_NOTE] | 0)) this._triggerHat(p, gain, true);
    if (note === (p[OH_NOTE] | 0)) this._triggerHat(p, gain, false);
    const tomBase = p[TOM_NOTE] | 0;
    if (note === tomBase - 2) this._triggerTom(p, gain, -5);
    else if (note === tomBase) this._triggerTom(p, gain, 0);
    else if (note === tomBase + 2) this._triggerTom(p, gain, 5);
    if (note === (p[RIM_NOTE] | 0)) this._triggerRim(p, gain);
    if (note === (p[RIDE_NOTE] | 0)) this._triggerRide(p, gain);
    if (note === (p[CRASH_NOTE] | 0)) this._triggerCrash(p, gain);
  }

  // RBJ bandpass (constant 0 dB peak gain): b0 = alpha, b1 = 0, b2 = -b0.
  _bandpass(f, q) {
    const w0 = (TWO_PI * f) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    this._bq[0] = alpha / a0;
    this._bq[1] = (-2 * Math.cos(w0)) / a0;
    this._bq[2] = (1 - alpha) / a0;
  }

  _triggerSnare(p, gain) {
    const f1 = expMap(p[SNARE_TUNE], 160, 260);
    this._sF1 = f1;
    this._sF2 = f1 * 1.83; // inharmonic 808-ish partner mode
    this._sSnap = p[SNARE_SNAP] / 127;
    this._sAmpK = decayK(expMap(p[SNARE_DECAY], 0.06, 0.5));
    this._sP1 = 0;
    this._sP2 = 0;
    this._sTEnv = 1;
    this._sNEnv = 1;
    this._sGain = gain;
    this._sActive = true;
  }

  _triggerClap(p, gain) {
    this._bandpass(expMap(p[CLAP_TONE], 600, 2000), 2.0);
    this._cB0 = this._bq[0];
    this._cA1 = this._bq[1];
    this._cA2 = this._bq[2];
    this._cTailK = decayK(expMap(p[CLAP_DECAY], 0.05, 0.6));
    this._cK = CLAP_STRIKE_K;
    this._cStrike = 0;
    this._cT = 0;
    this._cEnv = 1;
    this._cGain = gain;
    this._cActive = true;
  }

  _triggerRim(p, gain) {
    const f0 = expMap(p[RIM_TUNE], 300, 900);
    this._bandpass(f0, 8);
    this._rimB0a = this._bq[0];
    this._rimA1a = this._bq[1];
    this._rimA2a = this._bq[2];
    this._bandpass(f0 * 3.4, 8); // ≤ 3.06 kHz — far from Nyquist
    this._rimB0b = this._bq[0];
    this._rimA1b = this._bq[1];
    this._rimA2b = this._bq[2];
    this._rimK = decayK(expMap(p[RIM_DECAY], 0.025, 0.12));
    this._rimEnv = 1;
    this._rimBurst = RIM_BURST;
    this._rimGain = gain;
    this._rimActive = true;
  }

  _triggerRide(p, gain) {
    this._rideBank.setScale(expMap(p[RIDE_TONE], 0.6, 2.0));
    this._rdK = decayK(expMap(p[RIDE_DECAY], 0.4, 3.0));
    this._rdEnv = 1;
    this._rdPing = 1;
    this._rdGain = gain;
    this._rdActive = true;
  }

  _triggerCrash(p, gain) {
    // ×1.13 seats the crash bank apart from a same-TONE ride.
    this._crashBank.setScale(expMap(p[CRASH_TONE], 0.6, 2.0) * 1.13);
    this._crK = decayK(expMap(p[CRASH_DECAY], 0.8, 4.0));
    this._crEnv = 1;
    this._crBloom = 1;
    this._crGain = gain;
    this._crActive = true;
  }

  _triggerHat(p, gain, closed) {
    // Each hat scales ITS bank from its own TONE (×0.5 .. ×2, unity center).
    if (closed) {
      this._chBank.setScale(expMap(p[CH_TONE], 0.5, 2.0));
      this._chK = decayK(expMap(p[CH_DECAY], 0.025, 0.2));
      this._chEnv = 1;
      this._chGain = gain;
      this._chActive = true;
      // Choke: a ~3 ms fade, never a hard cut (the two-stage-fade idiom).
      if (this._ohActive) this._ohK = HAT_CHOKE_K;
    } else {
      this._ohBank.setScale(expMap(p[OH_TONE], 0.5, 2.0));
      this._ohK = decayK(expMap(p[OH_DECAY], 0.15, 1.2));
      this._ohEnv = 1;
      this._ohGain = gain;
      this._ohActive = true;
    }
  }

  _triggerTom(p, gain, semis) {
    this._tF0 = expMap(p[TOM_TUNE], 70, 240) * Math.pow(2, semis / 12);
    this._tAmpK = decayK(expMap(p[TOM_DECAY], 0.08, 0.9));
    this._tPhase = 0; // sine restarts at a zero crossing
    this._tEnv = 1;
    this._tPEnv = 1;
    this._tNEnv = 1;
    this._tGain = gain;
    this._tActive = true;
  }

  _triggerKick(p, gain) {
    this._kF0 = expMap(p[KICK_TUNE], 35, 90);
    const punch = p[KICK_PUNCH] / 127;
    this._kPSemis = punch * 48; // exponential pitch env, in semitones
    this._kAmpK = decayK(expMap(p[KICK_DECAY], 0.05, 1.5));
    this._kPhase = 0; // sine restarts at a zero crossing
    this._kEnv = 1;
    this._kPEnv = 1;
    this._kClick = punch; // PUNCH also mixes the click transient
    this._kGain = gain;
    this._kActive = true;
  }

  process(_inputs, outputs) {
    if (!this._alive) return false;

    const out = outputs[0];
    if (!this._params || !this._midi || !out) return true;

    const ch0 = out[0];
    const ch1 = out[1];
    const blockLen = ch0.length;
    const p = this._params;

    const pn = this._drain(blockLen);

    // Level targets, read once per block (smoothed per sample below).
    const tKick = p[KICK_LEVEL] / 127;
    const tSnare = p[SNARE_LEVEL] / 127;
    const tClap = p[CLAP_LEVEL] / 127;
    const tCh = p[CH_LEVEL] / 127;
    const tOh = p[OH_LEVEL] / 127;
    const tTom = p[TOM_LEVEL] / 127;
    const tRim = p[RIM_LEVEL] / 127;
    const tRide = p[RIDE_LEVEL] / 127;
    const tCrash = p[CRASH_LEVEL] / 127;

    if (
      pn === 0 &&
      !this._kActive &&
      !this._sActive &&
      !this._cActive &&
      !this._chActive &&
      !this._ohActive &&
      !this._tActive &&
      !this._rimActive &&
      !this._rdActive &&
      !this._crActive
    ) {
      // Nothing ringing, nothing due: output buffers are already zero.
      this._lvlKick = tKick; // keep smoothers current for the next hit
      this._lvlSnare = tSnare;
      this._lvlClap = tClap;
      this._lvlCh = tCh;
      this._lvlOh = tOh;
      this._lvlTom = tTom;
      this._lvlRim = tRim;
      this._lvlRide = tRide;
      this._lvlCrash = tCrash;
      return true;
    }

    let pi = 0;
    for (let i = 0; i < blockLen; i++) {
      while (pi < pn && this._pOff[pi] <= i) {
        this._trigger(this._pNote[pi], this._pVel[pi]);
        pi++;
      }

      this._lvlKick += LVL_ALPHA * (tKick - this._lvlKick);
      this._lvlSnare += LVL_ALPHA * (tSnare - this._lvlSnare);
      this._lvlClap += LVL_ALPHA * (tClap - this._lvlClap);
      this._lvlCh += LVL_ALPHA * (tCh - this._lvlCh);
      this._lvlOh += LVL_ALPHA * (tOh - this._lvlOh);
      this._lvlTom += LVL_ALPHA * (tTom - this._lvlTom);
      this._lvlRim += LVL_ALPHA * (tRim - this._lvlRim);
      this._lvlRide += LVL_ALPHA * (tRide - this._lvlRide);
      this._lvlCrash += LVL_ALPHA * (tCrash - this._lvlCrash);

      let sum = 0;

      if (this._kActive) {
        this._kPEnv *= KICK_PITCH_K;
        this._kClick *= KICK_CLICK_K;
        this._kEnv *= this._kAmpK;
        // Exponential pitch modulation (semitones). Gentle tanh thickens the
        // body; at ≤ ~90 Hz its low harmonics sit far from Nyquist, so the
        // usual waveshaper oversampling buys nothing here.
        const f = this._kF0 * Math.pow(2, (this._kPSemis * this._kPEnv) / 12);
        this._kPhase += f / sampleRate;
        if (this._kPhase >= 1) this._kPhase -= 1;
        const body = Math.tanh(1.8 * Math.sin(TWO_PI * this._kPhase));
        sum += (body + this._kClick * this._kNoise()) * this._kEnv * this._kGain * this._lvlKick;
        if (this._kEnv < ENV_FLOOR) this._kActive = false;
      }

      if (this._sActive) {
        this._sTEnv *= SNARE_TONE_K;
        this._sNEnv *= this._sAmpK;
        this._sP1 += this._sF1 / sampleRate;
        if (this._sP1 >= 1) this._sP1 -= 1;
        this._sP2 += this._sF2 / sampleRate;
        if (this._sP2 >= 1) this._sP2 -= 1;
        const tone = (Math.sin(TWO_PI * this._sP1) + 0.8 * Math.sin(TWO_PI * this._sP2)) * 0.55;
        const x = this._sNoise();
        const y = SN_BP.b0 * x + this._sZ1;
        this._sZ1 = flush(-SN_BP.a1 * y + this._sZ2);
        this._sZ2 = flush(-SN_BP.b0 * x - SN_BP.a2 * y);
        const snr = tone * (1 - this._sSnap) * this._sTEnv + 1.6 * y * this._sSnap * this._sNEnv;
        sum += snr * this._sGain * this._lvlSnare;
        if (this._sTEnv < ENV_FLOOR && this._sNEnv < ENV_FLOOR) this._sActive = false;
      }

      if (this._cActive) {
        this._cEnv *= this._cK;
        this._cT++;
        if (this._cStrike < 2 && this._cT >= CLAP_SPACING) {
          this._cStrike++;
          this._cT = 0;
          this._cEnv = 1; // re-strike — the 808 clap's pre-echoes
          if (this._cStrike === 2) this._cK = this._cTailK;
        }
        const x = this._cNoise();
        const y = this._cB0 * x + this._cZ1;
        this._cZ1 = flush(-this._cA1 * y + this._cZ2);
        this._cZ2 = flush(-this._cB0 * x - this._cA2 * y);
        sum += 1.8 * y * this._cEnv * this._cGain * this._lvlClap;
        if (this._cStrike === 2 && this._cEnv < ENV_FLOOR) this._cActive = false;
      }

      if (this._chActive) {
        this._chEnv *= this._chK;
        sum += HAT_MAKEUP * this._chBank.render() * this._chEnv * this._chGain * this._lvlCh;
        if (this._chEnv < ENV_FLOOR) this._chActive = false;
      }

      if (this._ohActive) {
        this._ohEnv *= this._ohK;
        sum += HAT_MAKEUP * this._ohBank.render() * this._ohEnv * this._ohGain * this._lvlOh;
        if (this._ohEnv < ENV_FLOOR) this._ohActive = false;
      }

      if (this._tActive) {
        this._tPEnv *= TOM_PITCH_K;
        this._tNEnv *= TOM_NOISE_K;
        this._tEnv *= this._tAmpK;
        // Mild exponential pitch envelope (4 st). Same tanh-body reasoning as
        // the kick: at ≤ ~320 Hz the shaped harmonics die out far below
        // Nyquist, so the waveshaper needs no oversampling here either.
        const f = this._tF0 * Math.pow(2, (4 * this._tPEnv) / 12);
        this._tPhase += f / sampleRate;
        if (this._tPhase >= 1) this._tPhase -= 1;
        const body = Math.tanh(1.2 * Math.sin(TWO_PI * this._tPhase));
        this._tNz += TOM_NOISE_ALPHA * (this._tNoise() - this._tNz); // skin noise, lowpassed
        sum += (body + 0.5 * this._tNz * this._tNEnv) * this._tEnv * this._tGain * this._lvlTom;
        if (this._tEnv < ENV_FLOOR) this._tActive = false;
      }

      if (this._rimActive) {
        this._rimEnv *= this._rimK;
        let x = 0;
        if (this._rimBurst > 0) {
          x = this._rimNoise();
          this._rimBurst--;
        }
        const y1 = this._rimB0a * x + this._rimZ1a;
        this._rimZ1a = flush(-this._rimA1a * y1 + this._rimZ2a);
        this._rimZ2a = flush(-this._rimB0a * x - this._rimA2a * y1);
        const y2 = this._rimB0b * x + this._rimZ1b;
        this._rimZ1b = flush(-this._rimA1b * y2 + this._rimZ2b);
        this._rimZ2b = flush(-this._rimB0b * x - this._rimA2b * y2);
        const knock = Math.tanh(RIM_MAKEUP * (y1 + 0.7 * y2));
        sum += knock * this._rimEnv * this._rimGain * this._lvlRim;
        if (this._rimEnv < ENV_FLOOR) this._rimActive = false;
      }

      if (this._rdActive) {
        this._rdEnv *= this._rdK;
        this._rdPing *= RIDE_PING_K;
        const m = this._rideBank.render();
        sum += CYM_MAKEUP * m * (this._rdEnv + 0.5 * this._rdPing) * this._rdGain * this._lvlRide;
        if (this._rdEnv < ENV_FLOOR) this._rdActive = false;
      }

      if (this._crActive) {
        this._crEnv *= this._crK;
        this._crBloom *= CRASH_BLOOM_K;
        const m = this._crashBank.render();
        sum += CYM_MAKEUP * m * (this._crEnv + 0.6 * this._crBloom) * this._crGain * this._lvlCrash;
        if (this._crEnv < ENV_FLOOR) this._crActive = false;
      }

      const y = sum * OUT_GAIN;
      ch0[i] = y;
      if (ch1) ch1[i] = y;
    }

    return true;
  }
}

// Keep the reference so a bundler/linter never trims the alignment constant.
void PARAM_COUNT;

registerProcessor("drumlin", DrumlinProcessor);
