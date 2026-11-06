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

// This is a pure-JS engine: the DSP lives here, not in a wasm kernel. For a
// C++ synth this file instead forwards into the wasm module (see
// monolog-processor.js). Either way it drains the MIDI ring and reads the
// param buffer each block.

// Param indices — MUST match template-params.ts. PARAM_COUNT is the untyped
// twin tsc can't see; the check:conventions script guards it.
const WAVE = 0;
const OCTAVE = 1;
const ATTACK = 2;
const RELEASE = 3;
const LEVEL = 4;
const LFO_RATE = 5;
const LFO_AMOUNT = 6;
const LFO_SYNC = 7;
const LFO_DIV = 8;
const PARAM_COUNT = 9;

// Raw 0..127 → real units. The engine owns the mapping (controller sends raw).
const attackSeconds = (raw) => 0.002 + (raw / 127) * 1.5;
const releaseSeconds = (raw) => 0.01 + (raw / 127) * 2.0;
const lfoHz = (raw) => (raw / 127) * 25; // mirrors dsp/range.h lfoFrequencyRange

// Beats per synced LFO cycle, by DIV index — mirrors core/divisions.ts
// ("4B".."1/32") by hand, the dischord table idiom.
const DIV_BEATS = [16, 8, 4, 2, 1, 0.5, 0.25, 0.125];

// PolyBLEP residual for a unit-period phase t with per-sample increment dt —
// the house band-limiting idiom (mirrors dsp/oscillator.h). Sign convention:
// for the RISING saw (2t-1, a -2 step at wrap) the residual is SUBTRACTED;
// a falling saw would ADD it. Naive saws/squares alias audibly, and this file
// is the template new synths copy.
const polyBlep = (t, dt) => {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
};

// ~10 ms one-pole for the level knob: raw 0-127 steps land at block
// boundaries and zipper without it.
const LEVEL_SMOOTH_ALPHA = 1 - Math.exp(-1 / (0.010 * sampleRate));

class TemplateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._params = null;
    this._midi = null;
    this._phase = 0;
    this._env = 0;
    this._gate = 0;
    this._freq = 440;
    this._velocity = 1;
    this._levelSm = 0;
    // Vibrato LFO: free-run phase accumulator, plus the master-clock snapshot
    // the __clock message keeps current (start/stop/tempo only — beats are
    // derived locally from `currentFrame` every block, never streamed).
    this._lfoPhase = 0;
    this._clock = { anchorFrame: 0, bpm: 120, playing: false };
    this._alive = true;
    this.port.onmessage = (e) => {
      if (e.data && e.data.type === "__init_sab") {
        this._params = new Float32Array(e.data.paramBuffer);
        this._midi = createMidiDrain(e.data.midiBuffer);
      } else if (e.data && e.data.type === "__clock") {
        this._clock = { anchorFrame: e.data.anchorFrame, bpm: e.data.bpm, playing: e.data.playing };
      } else if (e.data && e.data.type === "__dispose") {
        // Returning false from process() lets the node be garbage collected.
        this._alive = false;
      }
    };
  }

  process(_inputs, outputs) {
    if (!this._alive) return false;

    const out = outputs[0];
    if (!this._params || !this._midi || !out) return true;

    // Drain note events due within THIS block (frame-stamped events from
    // the sequencer's lookahead wait in the ring until their block).
    // Monophonic: last note wins, envelope re-gates.
    const blockEnd = currentFrame + 128;
    while (this._midi.dequeueBefore(blockEnd)) {
      const on = this._midi.status === this._midi.NOTE_ON && this._midi.data2 > 0;
      const off = this._midi.status === this._midi.NOTE_OFF ||
        (this._midi.status === this._midi.NOTE_ON && this._midi.data2 === 0);
      if (on) {
        this._freq = this._midi.frequency || this._freq;
        // Perceptual velocity curve (house convention): linear velocity-to-
        // gain leaves soft playing nearly inaudible.
        this._velocity = Math.pow(this._midi.data2 / 127, 0.6);
        this._gate = 1;
      } else if (off) {
        this._gate = 0;
      }
    }

    const p = this._params;
    const wave = p[WAVE] | 0;
    const octaveShift = (p[OCTAVE] | 0) - 2;
    const level = p[LEVEL] / 127;
    const freq = this._freq * Math.pow(2, octaveShift);
    const baseInc = freq / sampleRate;
    const aRate = 1 / Math.max(1, attackSeconds(p[ATTACK]) * sampleRate);
    const rRate = 1 / Math.max(1, releaseSeconds(p[RELEASE]) * sampleRate);

    // Vibrato LFO. Synced, the phase is an ABSOLUTE readout of the master
    // clock, not an accumulator: beats since the shared anchor (both sides of
    // the subtraction are doubles on the same AudioContext timeline) divided
    // by the cycle length, fractional part. A tempo change re-anchors on the
    // main thread so beats stay continuous; a master start moves the anchor,
    // snapping the phase to the shared downbeat; while stopped the stale
    // anchor keeps counting, so the LFO free-wheels at the tempo rate.
    const lfoAmtSt = p[LFO_AMOUNT] / 127; // 0..±1 semitone at full depth
    const lfoSynced = p[LFO_SYNC] >= 0.5;
    let lfoPhase;
    let lfoInc;
    if (lfoSynced) {
      const divBeats = DIV_BEATS[p[LFO_DIV] | 0] || 1;
      const beats = ((currentFrame - this._clock.anchorFrame) / sampleRate) * (this._clock.bpm / 60);
      const cycles = beats / divBeats;
      lfoPhase = cycles - Math.floor(cycles); // floor-frac: beats are negative pre-anchor
      lfoInc = this._clock.bpm / 60 / divBeats / sampleRate;
    } else {
      lfoPhase = this._lfoPhase;
      lfoInc = lfoHz(p[LFO_RATE]) / sampleRate;
    }

    const ch0 = out[0];
    const ch1 = out[1];
    for (let i = 0; i < ch0.length; i++) {
      // AR amp envelope
      this._env = this._gate
        ? Math.min(1, this._env + aRate)
        : Math.max(0, this._env - rRate);

      // Pitch modulation is exponential (house rule): semitones, not Hz.
      let inc = baseInc;
      if (lfoAmtSt > 0) {
        const vib = Math.sin(2 * Math.PI * lfoPhase);
        inc = baseInc * Math.pow(2, (vib * lfoAmtSt) / 12);
      }
      lfoPhase += lfoInc;
      if (lfoPhase >= 1) lfoPhase -= 1;

      // Oscillator — band-limited (see polyBlep above).
      let s;
      if (wave === 0) {
        s = Math.sin(2 * Math.PI * this._phase);                      // sine (alias-free)
      } else if (wave === 2) {
        s = this._phase < 0.5 ? 1 : -1;                               // square
        s += polyBlep(this._phase, inc);                              // rising edge at 0
        let t = this._phase - 0.5;
        if (t < 0) t += 1;
        s -= polyBlep(t, inc);                                        // falling edge at 0.5
      } else {
        s = 2 * this._phase - 1;                                      // rising saw
        s -= polyBlep(this._phase, inc);
      }
      this._phase += inc;
      if (this._phase >= 1) this._phase -= 1;

      this._levelSm += LEVEL_SMOOTH_ALPHA * (level - this._levelSm);
      const y = s * this._env * this._levelSm * this._velocity * 0.3; // 0.3 headroom
      ch0[i] = y;
      if (ch1) ch1[i] = y;
    }
    // Only the free-run phase persists; the synced one is re-derived next block.
    if (!lfoSynced) this._lfoPhase = lfoPhase;

    return true;
  }
}

// Keep the reference so a bundler/linter never trims the alignment constant.
void PARAM_COUNT;

registerProcessor("template", TemplateProcessor);
