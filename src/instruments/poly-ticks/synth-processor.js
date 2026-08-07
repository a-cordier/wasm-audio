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
import { createWasmProcessor } from "./wasm-worklet-processor.js";
import { createMidiDrain } from "./worklet-drain.js";
import createModule from "./voice-kernel.wasmmodule.js";

const PARAM_COUNT = 39;

const wasm = await createModule();

createWasmProcessor(wasm, {
  name: "synth",
  createExport: "_synth_engine_create",
  destroyExport: "_synth_engine_destroy",
  processExport: "_synth_engine_process",
  channelCount: 2,

  onMessage(wasm, engine, msg, state) {
    if (msg.type === "__init_sab") {
      state.params = new Float32Array(msg.paramBuffer);
      state.midi = createMidiDrain(msg.midiBuffer);
      // NaN sentinels: NaN !== NaN, so the first block pushes every param.
      state.last = new Float32Array(PARAM_COUNT).fill(NaN);
      return;
    }
  },

  onProcess(wasm, engine, state) {
    if (!state.params) return;

    const midi = state.midi;
    while (midi.dequeue()) {
      if (midi.status === midi.NOTE_ON && midi.data2 > 0) {
        wasm._synth_engine_note_on(engine, midi.data1, midi.frequency, midi.data2);
      } else if (midi.status === midi.NOTE_OFF || (midi.status === midi.NOTE_ON && midi.data2 === 0)) {
        wasm._synth_engine_note_off(engine, midi.data1);
      }
    }

    const { params, last } = state;
    for (let i = 0; i < PARAM_COUNT; i++) {
      const v = params[i];
      if (v !== last[i]) {
        last[i] = v;
        wasm._synth_engine_set_param(engine, i, v);
      }
    }
  },
});
