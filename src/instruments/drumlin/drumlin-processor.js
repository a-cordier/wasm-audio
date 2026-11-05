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

    // SNARE / CLAP — land in batch 2; HATS / TOM — batch 3.

    // Smoothed per-voice levels (kick, snare, clap, ch, oh, tom).
    this._lvlKick = 0;

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
        // SNARE — batch 2
        break;
      case 39:
        // CLAP — batch 2
        break;
      case 42:
      case 44:
        // CLOSED HAT (+ chokes OH) — batch 3
        break;
      case 46:
        // OPEN HAT — batch 3
        break;
      case 41:
      case 43:
      case 45:
      case 47:
      case 48:
      case 50:
        // TOM (−5/0/+5 st by note pair) — batch 3
        break;
      default:
        break; // unmapped notes are silent by design
    }
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

    if (pn === 0 && !this._kActive) {
      // Nothing ringing, nothing due: output buffers are already zero.
      this._lvlKick = tKick; // keep smoothers current for the next hit
      return true;
    }

    let pi = 0;
    for (let i = 0; i < blockLen; i++) {
      while (pi < pn && this._pOff[pi] <= i) {
        this._trigger(this._pNote[pi], this._pVel[pi]);
        pi++;
      }

      this._lvlKick += LVL_ALPHA * (tKick - this._lvlKick);

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
