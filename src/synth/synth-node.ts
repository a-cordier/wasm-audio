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

import { WasmProcessorNode } from "../runtime/wasm-processor-node";
import { SharedParamBuffer } from "../runtime/shared-param-buffer";
import { SharedEventQueue } from "../runtime/shared-event-queue";

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
});

const PARAM_COUNT = 30;
const EVENT_QUEUE_CAPACITY = 64;
const EVENT_SIZE = 4; // [type, midi, frequency, velocity]

const NOTE_ON = 1;
const NOTE_OFF = 2;

// C++ Oscillator::Mode values (oscillator.h)
// TS OscillatorMode: SINE=0, SAWTOOTH=1, SQUARE=2, TRIANGLE=3
// C++ Oscillator::Mode: SAW=0, SINE=1, SQUARE=2, TRIANGLE=3
export const OscModeToCpp = Object.freeze([1, 0, 2, 3]);

// C++ Filter::Mode values (filter.h)
// TS FilterMode: LOWPASS=0, LOWPASS_PLUS=1, BANDPASS=2, HIGHPASS=3
// C++ Filter::Mode: LOWPASS=0, LOWPASS_PLUS=1, HIGHPASS=2, BANDPASS=3
export const FilterModeToCpp = Object.freeze([0, 1, 3, 2]);

// C++ Voice::LfoDestination values match TS LfoDestination (both 0-5, same order)

export class SynthNode extends WasmProcessorNode {
  private params: SharedParamBuffer;
  private events: SharedEventQueue;

  constructor(audioContext: AudioContext) {
    super(audioContext, "synth", { outputChannelCount: [2] });

    this.params = new SharedParamBuffer(PARAM_COUNT);
    this.events = new SharedEventQueue(EVENT_QUEUE_CAPACITY, EVENT_SIZE);

    this.send({
      type: "__init_sab",
      paramBuffer: this.params.buffer,
      eventBuffer: this.events.buffer,
    });
  }

  noteOn(midi: number, frequency: number, velocity: number) {
    this.events.enqueue([NOTE_ON, midi, frequency, velocity]);
  }

  noteOff(midi: number) {
    this.events.enqueue([NOTE_OFF, midi, 0, 0]);
  }

  setParam(id: number, value: number) {
    this.params.set(id, value);
  }
}
