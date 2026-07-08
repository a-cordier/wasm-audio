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

const PARAM_COUNT = 30;
const EVENT_SIZE = 4;
const HEADER_INTS = 2;
const HEADER_BYTES = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT;
const NOTE_ON = 1;
const NOTE_OFF = 2;

let paramView = null;
let eventHeads = null;
let eventData = null;
let eventCapacity = 0;
const eventBuf = new Float32Array(EVENT_SIZE);

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
      eventHeads = new Int32Array(msg.eventBuffer, 0, HEADER_INTS);
      eventData = new Float32Array(msg.eventBuffer, HEADER_BYTES);
      eventCapacity =
        (msg.eventBuffer.byteLength - HEADER_BYTES) /
        (EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
      return;
    }
  },

  onProcess(wasm, engine) {
    if (!paramView) return;

    while (dequeueEvent()) {
      const type = eventBuf[0];
      if (type === NOTE_ON) {
        wasm._synth_engine_note_on(engine, eventBuf[1], eventBuf[2], eventBuf[3]);
      } else if (type === NOTE_OFF) {
        wasm._synth_engine_note_off(engine, eventBuf[1]);
      }
    }

    for (let i = 0; i < PARAM_COUNT; i++) {
      wasm._synth_engine_set_param(engine, i, paramView[i]);
    }
  },
});

function dequeueEvent() {
  const read = Atomics.load(eventHeads, 0);
  const write = Atomics.load(eventHeads, 1);
  if (read === write) return false;

  const offset = read * EVENT_SIZE;
  for (let i = 0; i < EVENT_SIZE; i++) {
    eventBuf[i] = eventData[offset + i];
  }

  Atomics.store(eventHeads, 0, (read + 1) % eventCapacity);
  return true;
}
