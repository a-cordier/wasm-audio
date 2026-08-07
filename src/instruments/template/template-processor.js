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
const PARAM_COUNT = 5;

// Raw 0..127 → real units. The engine owns the mapping (controller sends raw).
const attackSeconds = (raw) => 0.002 + (raw / 127) * 1.5;
const releaseSeconds = (raw) => 0.01 + (raw / 127) * 2.0;

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
    this._alive = true;
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

  process(_inputs, outputs) {
    if (!this._alive) return false;

    const out = outputs[0];
    if (!this._params || !this._midi || !out) return true;

    // Drain note events. Monophonic: last note wins, envelope re-gates.
    while (this._midi.dequeue()) {
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
    const inc = freq / sampleRate;
    const aRate = 1 / Math.max(1, attackSeconds(p[ATTACK]) * sampleRate);
    const rRate = 1 / Math.max(1, releaseSeconds(p[RELEASE]) * sampleRate);

    const ch0 = out[0];
    const ch1 = out[1];
    for (let i = 0; i < ch0.length; i++) {
      // AR amp envelope
      this._env = this._gate
        ? Math.min(1, this._env + aRate)
        : Math.max(0, this._env - rRate);

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

    return true;
  }
}

// Keep the reference so a bundler/linter never trims the alignment constant.
void PARAM_COUNT;

registerProcessor("template", TemplateProcessor);
