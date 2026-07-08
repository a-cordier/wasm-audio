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

const RENDER_QUANTUM_FRAMES = 128;
const BYTES_PER_SAMPLE = Float32Array.BYTES_PER_ELEMENT;

/**
 * Register a WASM-backed AudioWorkletProcessor.
 *
 * @param {object} wasm          – initialised Emscripten module
 * @param {object} config
 * @param {string} config.name            – processor name for registerProcessor()
 * @param {string} config.createExport    – C export that returns an engine pointer
 * @param {string} config.destroyExport   – C export that frees the engine
 * @param {string} config.processExport   – C export: (engine, outputPtr, channelCount)
 * @param {number} config.channelCount    – max output channels (default 2)
 * @param {(wasm: object, engine: number, msg: any) => void} config.onMessage
 * @param {(wasm: object, engine: number) => void} [config.onProcess] – called each quantum before processExport
 */
export function createWasmProcessor(wasm, config) {
  const {
    name,
    createExport,
    destroyExport,
    processExport,
    channelCount = 2,
    onMessage,
    onProcess,
  } = config;

  class WasmProcessor extends AudioWorkletProcessor {
    constructor() {
      super();

      this._wasm = wasm;
      this._engine = wasm[createExport](sampleRate, RENDER_QUANTUM_FRAMES);

      const bufferSize = channelCount * RENDER_QUANTUM_FRAMES * BYTES_PER_SAMPLE;
      this._outputPtr = wasm._malloc(bufferSize);
      this._alive = true;

      this.port.onmessage = (e) => {
        if (e.data?.type === "__dispose") {
          this._destroy();
          return;
        }
        onMessage(wasm, this._engine, e.data);
      };
    }

    process(_inputs, outputs) {
      if (!this._alive) return false;

      if (onProcess) onProcess(wasm, this._engine);

      const output = outputs[0];
      const outChannels = output.length;

      wasm[processExport](this._engine, this._outputPtr, outChannels);

      for (let ch = 0; ch < outChannels; ++ch) {
        const startOffset = (this._outputPtr >> 2) + ch * RENDER_QUANTUM_FRAMES;
        output[ch].set(
          wasm.HEAPF32.subarray(startOffset, startOffset + RENDER_QUANTUM_FRAMES)
        );
      }

      return true;
    }

    _destroy() {
      if (!this._alive) return;
      this._alive = false;
      wasm[destroyExport](this._engine);
      wasm._free(this._outputPtr);
    }
  }

  registerProcessor(name, WasmProcessor);
}
