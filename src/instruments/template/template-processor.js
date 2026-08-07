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

class TemplateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._params = null;
    this._midi = null;
    this._phase = 0;
    this._env = 0;
    this._gate = 0;
    this._freq = 440;
    this.port.onmessage = (e) => {
      if (e.data && e.data.type === "__init_sab") {
        this._params = new Float32Array(e.data.paramBuffer);
        this._midi = createMidiDrain(e.data.midiBuffer);
      }
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    if (!this._params || !this._midi || !out) return true;

    // Drain note events. Monophonic: last note wins, envelope re-gates.
    while (this._midi.dequeue()) {
      const on = this._midi.status === this._midi.NOTE_ON && this._midi.data2 > 0;
      const off = this._midi.status === this._midi.NOTE_OFF ||
        (this._midi.status === this._midi.NOTE_ON && this._midi.data2 === 0);
      if (on) {
        this._freq = this._midi.frequency || this._freq;
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

      // Oscillator
      let s;
      if (wave === 0) s = Math.sin(2 * Math.PI * this._phase);        // sine
      else if (wave === 2) s = this._phase < 0.5 ? 1 : -1;            // square
      else s = 2 * this._phase - 1;                                  // saw
      this._phase += inc;
      if (this._phase >= 1) this._phase -= 1;

      const y = s * this._env * level * 0.3; // 0.3 headroom
      ch0[i] = y;
      if (ch1) ch1[i] = y;
    }

    return true;
  }
}

// Keep the reference so a bundler/linter never trims the alignment constant.
void PARAM_COUNT;

registerProcessor("template", TemplateProcessor);
