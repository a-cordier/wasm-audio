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
const HAT_TONE = 11;
const CH_DECAY = 12;
const CH_LEVEL = 13;
const OH_DECAY = 14;
const OH_LEVEL = 15;
const TOM_TUNE = 16;
const TOM_DECAY = 17;
const TOM_LEVEL = 18;
const ACCENT = 19;
const PARAM_COUNT = 20;

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

// Hats: ONE shared metallic bank — six squares at the 808-ish inharmonic set,
// scaled together by TONE — through fixed bandpass (10 kHz) and highpass
// (7 kHz) stages. CH and OH are two VCAs on the same signal; a CH hit chokes
// the OH tail through a ~3 ms fade (dsp-audit's two-stage-fade idiom).
const HAT_FREQS = [205.3, 304.4, 369.99, 522.7, 540, 800];
const HAT_BP = (() => {
  const w0 = (TWO_PI * 10000) / sampleRate;
  const alpha = Math.sin(w0) / (2 * 1.1);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, a1: (-2 * Math.cos(w0)) / a0, a2: (1 - alpha) / a0 };
})();
const HAT_HP = (() => {
  const w0 = (TWO_PI * 7000) / sampleRate;
  const cw = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cw) / 2 / a0, // b2 === b0 for an RBJ highpass
    b1: -(1 + cw) / a0,
    a1: (-2 * cw) / a0,
    a2: (1 - alpha) / a0,
  };
})();
const HAT_CHOKE_K = decayK(0.003);
const HAT_MAKEUP = 3.0; // the 10 kHz band keeps little of a square's energy

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

    // HATS — shared six-square bank (free-running phases: per-hit variation,
    // and no click on the bank while the other VCA is still open) + two VCAs.
    this._hPhases = new Float64Array(6);
    this._hInc = new Float64Array(6);
    for (let k = 0; k < 6; k++) this._hInc[k] = HAT_FREQS[k] / sampleRate;
    this._hBpZ1 = 0;
    this._hBpZ2 = 0;
    this._hHpZ1 = 0;
    this._hHpZ2 = 0;
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

    // Smoothed per-voice levels (kick, snare, clap, ch, oh, tom).
    this._lvlKick = 0;
    this._lvlSnare = 0;
    this._lvlClap = 0;
    this._lvlCh = 0;
    this._lvlOh = 0;
    this._lvlTom = 0;

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

  // GM note map — MUST mirror types/drumlin-notes.ts voiceForNote.
  _trigger(note, vel) {
    const p = this._params;
    // Velocity response: perceptual curve, depth set by ACCENT
    // (a=0: every hit equal; a=1: full pow-0.6 dynamics).
    const a = p[ACCENT] / 127;
    const gain = 1 - a + a * Math.pow(vel / 127, 0.6);
    switch (note) {
      case 35:
      case 36:
        this._triggerKick(p, gain);
        break;
      case 38:
      case 40:
        this._triggerSnare(p, gain);
        break;
      case 39:
        this._triggerClap(p, gain);
        break;
      case 42:
      case 44:
        this._triggerHat(p, gain, true);
        break;
      case 46:
        this._triggerHat(p, gain, false);
        break;
      case 41:
      case 43:
        this._triggerTom(p, gain, -5);
        break;
      case 45:
      case 47:
        this._triggerTom(p, gain, 0);
        break;
      case 48:
      case 50:
        this._triggerTom(p, gain, 5);
        break;
      default:
        break; // unmapped notes are silent by design
    }
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

  _triggerHat(p, gain, closed) {
    // TONE scales the whole bank together (×0.5 .. ×2, unity at center).
    const scale = expMap(p[HAT_TONE], 0.5, 2.0);
    for (let k = 0; k < 6; k++) this._hInc[k] = (HAT_FREQS[k] * scale) / sampleRate;
    if (closed) {
      this._chK = decayK(expMap(p[CH_DECAY], 0.025, 0.2));
      this._chEnv = 1;
      this._chGain = gain;
      this._chActive = true;
      // Choke: a ~3 ms fade, never a hard cut (the two-stage-fade idiom).
      if (this._ohActive) this._ohK = HAT_CHOKE_K;
    } else {
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

    if (
      pn === 0 &&
      !this._kActive &&
      !this._sActive &&
      !this._cActive &&
      !this._chActive &&
      !this._ohActive &&
      !this._tActive
    ) {
      // Nothing ringing, nothing due: output buffers are already zero.
      this._lvlKick = tKick; // keep smoothers current for the next hit
      this._lvlSnare = tSnare;
      this._lvlClap = tClap;
      this._lvlCh = tCh;
      this._lvlOh = tOh;
      this._lvlTom = tTom;
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

      if (this._chActive || this._ohActive) {
        // One shared bank render feeds both VCAs.
        let metal = 0;
        for (let k = 0; k < 6; k++) {
          const inc = this._hInc[k];
          let t = this._hPhases[k];
          let s = t < 0.5 ? 1 : -1;
          s += polyBlep(t, inc); // rising edge at 0
          let t2 = t - 0.5;
          if (t2 < 0) t2 += 1;
          s -= polyBlep(t2, inc); // falling edge at 0.5
          metal += s;
          t += inc;
          if (t >= 1) t -= 1;
          this._hPhases[k] = t;
        }
        metal /= 6;
        const yb = HAT_BP.b0 * metal + this._hBpZ1;
        this._hBpZ1 = flush(-HAT_BP.a1 * yb + this._hBpZ2);
        this._hBpZ2 = flush(-HAT_BP.b0 * metal - HAT_BP.a2 * yb);
        const yh = HAT_HP.b0 * yb + this._hHpZ1;
        this._hHpZ1 = flush(HAT_HP.b1 * yb - HAT_HP.a1 * yh + this._hHpZ2);
        this._hHpZ2 = flush(HAT_HP.b0 * yb - HAT_HP.a2 * yh); // b2 === b0
        const sizzle = HAT_MAKEUP * yh;
        if (this._chActive) {
          this._chEnv *= this._chK;
          sum += sizzle * this._chEnv * this._chGain * this._lvlCh;
          if (this._chEnv < ENV_FLOOR) this._chActive = false;
        }
        if (this._ohActive) {
          this._ohEnv *= this._ohK;
          sum += sizzle * this._ohEnv * this._ohGain * this._lvlOh;
          if (this._ohEnv < ENV_FLOOR) this._ohActive = false;
        }
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
