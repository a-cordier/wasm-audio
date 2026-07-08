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
import createModule from "./voice-kernel.wasmmodule.js";

const wasm = await createModule();

createWasmProcessor(wasm, {
  name: "synth",
  createExport: "_synth_engine_create",
  destroyExport: "_synth_engine_destroy",
  processExport: "_synth_engine_process",
  channelCount: 2,
  onMessage(wasm, engine, msg) {
    switch (msg.type) {
      case "noteOn":
        wasm._synth_engine_note_on(engine, msg.midi, msg.frequency, msg.velocity);
        break;
      case "noteOff":
        wasm._synth_engine_note_off(engine, msg.midi);
        break;
      case "setParam":
        wasm._synth_engine_set_param(engine, msg.id, msg.value);
        break;
    }
  },
});
