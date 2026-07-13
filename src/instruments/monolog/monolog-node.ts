import { WasmProcessorNode } from "../../runtime/wasm-processor-node";
import { SharedParamBuffer } from "../../runtime/shared-param-buffer";
import { MidiRingBuffer } from "../../midi/transport/ring-buffer";
import { MidiEvent, MidiTarget, Status, Channel } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { MonologParamId } from "./types/monolog-params";

const MIDI_QUEUE_CAPACITY = 64;

// C++ Oscillator::Mode: SAW=0, SINE=1, SQUARE=2, TRIANGLE=3
// TS OscillatorMode:    SINE=0, SAWTOOTH=1, SQUARE=2, TRIANGLE=3
export const OscModeToCpp = Object.freeze([1, 0, 2, 3]);

export class MonologNode extends WasmProcessorNode implements MidiTarget {
  private params: SharedParamBuffer;
  private midiRing: MidiRingBuffer;

  get midiBuffer(): SharedArrayBuffer {
    return this.midiRing.buffer;
  }

  constructor(audioContext: AudioContext) {
    super(audioContext, "monolog", { outputChannelCount: [2] });

    this.params = new SharedParamBuffer(MonologParamId.PARAM_COUNT);
    this.midiRing = new MidiRingBuffer(MIDI_QUEUE_CAPACITY);

    this.send({
      type: "__init_sab",
      paramBuffer: this.params.buffer,
      midiBuffer: this.midiRing.buffer,
    });
  }

  receive(event: MidiEvent): void {
    const freqHint = (event.status === Status.NOTE_ON || event.status === Status.NOTE_OFF)
      ? noteFrequency(event.data1)
      : 0;
    this.midiRing.enqueue(event, freqHint);
  }

  noteOn(midi: number, frequency: number, velocity: number) {
    if (!this.midiRing.enqueueRaw(Status.NOTE_ON, 0 as Channel, midi, velocity, performance.now(), frequency)) {
      console.warn("MIDI ring buffer overflow: noteOn dropped (note=%d)", midi);
    }
  }

  noteOff(midi: number) {
    if (!this.midiRing.enqueueRaw(Status.NOTE_OFF, 0 as Channel, midi, 0, performance.now(), 0)) {
      console.warn("MIDI ring buffer overflow: noteOff dropped (note=%d)", midi);
    }
  }

  setParam(id: number, value: number) {
    this.params.set(id, value);
  }
}
