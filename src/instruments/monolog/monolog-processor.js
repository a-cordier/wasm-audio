import { createWasmProcessor } from "./wasm-worklet-processor.js";
import { createMidiDrain } from "./worklet-drain.js";
import createModule from "./monolog-kernel.wasmmodule.js";

const PARAM_COUNT = 21;

let paramView = null;
let midi = null;

const wasm = await createModule();

createWasmProcessor(wasm, {
  name: "monolog",
  createExport: "_monolog_create",
  destroyExport: "_monolog_destroy",
  processExport: "_monolog_process",
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
        wasm._monolog_note_on(engine, midi.data1, midi.frequency, midi.data2);
      } else if (midi.status === midi.NOTE_OFF || (midi.status === midi.NOTE_ON && midi.data2 === 0)) {
        wasm._monolog_note_off(engine, midi.data1);
      }
    }

    for (let i = 0; i < PARAM_COUNT; i++) {
      wasm._monolog_set_param(engine, i, paramView[i]);
    }
  },
});
