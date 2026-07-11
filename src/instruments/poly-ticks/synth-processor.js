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

const PARAM_COUNT = 33;

let paramView = null;
let midi = null;

const wasm = await createModule();

createWasmProcessor(wasm, {
  name: "synth",
  createExport: "_synth_engine_create",
  destroyExport: "_synth_engine_destroy",
  processExport: "_synth_engine_process",
  channelCount: 2,

  onMessage(wasm, engine, msg) {
    if (msg.type === "__init_sab") {
      paramView = new Float32Array(msg.paramBuffer);
      midi = createMidiDrain(msg.midiBuffer);
      return;
    }
  },

  onProcess(wasm, engine) {
    if (!paramView) return;

    while (midi.dequeue()) {
      if (midi.status === midi.NOTE_ON && midi.data2 > 0) {
        wasm._synth_engine_note_on(engine, midi.data1, midi.frequency, midi.data2);
      } else if (midi.status === midi.NOTE_OFF || (midi.status === midi.NOTE_ON && midi.data2 === 0)) {
        wasm._synth_engine_note_off(engine, midi.data1);
      }
    }

    for (let i = 0; i < PARAM_COUNT; i++) {
      wasm._synth_engine_set_param(engine, i, paramView[i]);
    }
  },
});
