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
import createModule from "./voice-kernel.wasmmodule.js";

const RENDER_QUANTUM_FRAMES = 128;
const BYTES_PER_SAMPLE = Float32Array.BYTES_PER_ELEMENT;
const MAX_CHANNEL_COUNT = 2;

const wasm = await createModule();

class SynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.engine = wasm._synth_engine_create(sampleRate, RENDER_QUANTUM_FRAMES);

    const bufferSize = MAX_CHANNEL_COUNT * RENDER_QUANTUM_FRAMES * BYTES_PER_SAMPLE;
    this._outputPtr = wasm._malloc(bufferSize);

    this.port.onmessage = (e) => this._onMessage(e.data);
  }

  _onMessage(msg) {
    switch (msg.type) {
      case "noteOn":
        wasm._synth_engine_note_on(this.engine, msg.midi, msg.frequency, msg.velocity);
        break;
      case "noteOff":
        wasm._synth_engine_note_off(this.engine, msg.midi);
        break;
      case "setParam":
        wasm._synth_engine_set_param(this.engine, msg.id, msg.value);
        break;
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const channelCount = output.length;

    wasm._synth_engine_process(this.engine, this._outputPtr, channelCount);

    for (let ch = 0; ch < channelCount; ++ch) {
      const startOffset = (this._outputPtr >> 2) + ch * RENDER_QUANTUM_FRAMES;
      output[ch].set(wasm.HEAPF32.subarray(startOffset, startOffset + RENDER_QUANTUM_FRAMES));
    }

    return true;
  }
}

registerProcessor("synth", SynthProcessor);
