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

import { WasmProcessorNode } from "../../runtime/wasm-processor-node";
import { SharedParamBuffer } from "../../runtime/shared-param-buffer";
import { MidiRingBuffer } from "../../midi/transport/ring-buffer";
import { MidiEvent, MidiTarget, Status, Channel } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";

// Must match wasm_audio::ParamId in synth-engine.h
export const ParamId = Object.freeze({
  OSC1_MODE: 0,
  OSC2_MODE: 1,
  FILTER_MODE: 2,
  LFO1_MODE: 3,
  LFO1_DESTINATION: 4,
  LFO2_MODE: 5,
  LFO2_DESTINATION: 6,
  AMPLITUDE_ATTACK: 7,
  AMPLITUDE_DECAY: 8,
  AMPLITUDE_SUSTAIN: 9,
  AMPLITUDE_RELEASE: 10,
  OSC1_SEMI_SHIFT: 11,
  OSC1_CENT_SHIFT: 12,
  OSC1_CYCLE: 13,
  OSC2_SEMI_SHIFT: 14,
  OSC2_CENT_SHIFT: 15,
  OSC2_CYCLE: 16,
  OSC2_AMPLITUDE: 17,
  NOISE_LEVEL: 18,
  CUTOFF: 19,
  RESONANCE: 20,
  DRIVE: 21,
  CUTOFF_ENV_AMOUNT: 22,
  CUTOFF_ENV_VELOCITY: 23,
  CUTOFF_ENV_ATTACK: 24,
  CUTOFF_ENV_DECAY: 25,
  LFO1_FREQUENCY: 26,
  LFO1_MOD_AMOUNT: 27,
  LFO2_FREQUENCY: 28,
  LFO2_MOD_AMOUNT: 29,
  VOICE_MODE: 30,
  GLIDE_TIME: 31,
  RETRIGGER: 32,
});

const PARAM_COUNT = 33;
const MIDI_QUEUE_CAPACITY = 64;

// C++ Oscillator::Mode values (oscillator.h)
// TS OscillatorMode: SINE=0, SAWTOOTH=1, SQUARE=2, TRIANGLE=3
// C++ Oscillator::Mode: SAW=0, SINE=1, SQUARE=2, TRIANGLE=3
export const OscModeToCpp = Object.freeze([1, 0, 2, 3]);

// C++ Filter::Mode values (filter.h)
// TS FilterMode: LOWPASS=0, LOWPASS_PLUS=1, BANDPASS=2, HIGHPASS=3
// C++ Filter::Mode: LOWPASS=0, LOWPASS_PLUS=1, HIGHPASS=2, BANDPASS=3
export const FilterModeToCpp = Object.freeze([0, 1, 3, 2]);

// C++ Voice::LfoDestination values match TS LfoDestination (both 0-5, same order)

export class SynthNode extends WasmProcessorNode implements MidiTarget {
  private params: SharedParamBuffer;
  private midiRing: MidiRingBuffer;

  /** Expose the ring buffer's SAB so a MidiBus can subscribe directly. */
  get midiBuffer(): SharedArrayBuffer {
    return this.midiRing.buffer;
  }

  constructor(audioContext: AudioContext) {
    super(audioContext, "synth", { outputChannelCount: [2] });

    this.params = new SharedParamBuffer(PARAM_COUNT);
    this.midiRing = new MidiRingBuffer(MIDI_QUEUE_CAPACITY);

    this.send({
      type: "__init_sab",
      paramBuffer: this.params.buffer,
      midiBuffer: this.midiRing.buffer,
    });
  }

  /**
   * Implements MidiTarget — receives events from the bus system.
   */
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
