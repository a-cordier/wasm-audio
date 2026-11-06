import { createWasmProcessor } from "./wasm-worklet-processor.js";
import { createMidiDrain } from "./worklet-drain.js";
import createModule from "./monolog-kernel.wasmmodule.js";

const PARAM_COUNT = 31;

const wasm = await createModule();

createWasmProcessor(wasm, {
  name: "monolog",
  createExport: "_monolog_create",
  destroyExport: "_monolog_destroy",
  processExport: "_monolog_process",
  channelCount: 2,

  onMessage(wasm, engine, msg, state) {
    if (msg.type === "__init_sab") {
      state.params = new Float32Array(msg.paramBuffer);
      state.midi = createMidiDrain(msg.midiBuffer);
      // NaN sentinels: NaN !== NaN, so the first block pushes every param.
      state.last = new Float32Array(PARAM_COUNT).fill(NaN);
      return;
    }
    if (msg.type === "__clock") {
      // Master-clock snapshot (anchor frame UNWRAPPED — doubles, not the
      // Float32 ring's mod-2^24 frames). Sent on start/stop/tempo only;
      // beats are derived locally from currentFrame every block.
      state.clock = { anchorFrame: msg.anchorFrame, bpm: msg.bpm };
      return;
    }
  },

  onProcess(wasm, engine, state) {
    if (!state.params) return;

    // Feed the engine this block's clock position for the tempo-synced LFO:
    // phase becomes an absolute readout of the master clock in applyParams.
    if (state.clock) {
      const beats = ((currentFrame - state.clock.anchorFrame) / sampleRate) * (state.clock.bpm / 60);
      wasm._monolog_set_clock(engine, beats, state.clock.bpm);
    }

    // Only events due within THIS block are taken; frame-stamped events
    // from the sequencer's lookahead stay in the ring until their block.
    const midi = state.midi;
    const blockEnd = currentFrame + 128;
    while (midi.dequeueBefore(blockEnd)) {
      if (midi.status === midi.NOTE_ON && midi.data2 > 0) {
        wasm._monolog_note_on(engine, midi.data1, midi.frequency, midi.data2);
      } else if (midi.status === midi.NOTE_OFF || (midi.status === midi.NOTE_ON && midi.data2 === 0)) {
        wasm._monolog_note_off(engine, midi.data1);
      }
    }

    const { params, last } = state;
    for (let i = 0; i < PARAM_COUNT; i++) {
      const v = params[i];
      if (v !== last[i]) {
        last[i] = v;
        wasm._monolog_set_param(engine, i, v);
      }
    }
  },
});
