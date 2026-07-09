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
import { Control } from "./control";
import { FilterState } from "./filter-state";

export interface OscillatorState {
  mode: Control;
  semiShift: Control;
  centShift: Control;
  cycle: Control;
}

export interface EnvelopeState {
  attack: Control;
  decay: Control;
  sustain: Control;
  release: Control;
}

export interface CutoffModState {
  attack: Control;
  decay: Control;
  amount: Control;
  velocity: Control;
}

export interface LFOState {
  mode: Control;
  frequency: Control;
  modAmount: Control;
  destination: Control;
}

export interface VoiceState {
  osc1: OscillatorState;
  osc2: OscillatorState;
  osc2Amplitude: Control;
  noiseLevel: Control;
  envelope: EnvelopeState;
  filter: FilterState;
  cutoffMod: CutoffModState;
  lfo1: LFOState;
  lfo2: LFOState;
}

function cloneControl(c: Control): Control {
  return { value: c.value };
}

function cloneOscillator(s: OscillatorState): OscillatorState {
  return {
    mode: cloneControl(s.mode),
    semiShift: cloneControl(s.semiShift),
    centShift: cloneControl(s.centShift),
    cycle: cloneControl(s.cycle),
  };
}

export function createVoiceState(src: Partial<VoiceState>): VoiceState {
  return {
    osc1: cloneOscillator(src.osc1),
    osc2: cloneOscillator(src.osc2),
    osc2Amplitude: cloneControl(src.osc2Amplitude),
    noiseLevel: cloneControl(src.noiseLevel),
    envelope: {
      attack: cloneControl(src.envelope.attack),
      decay: cloneControl(src.envelope.decay),
      sustain: cloneControl(src.envelope.sustain),
      release: cloneControl(src.envelope.release),
    },
    filter: {
      mode: cloneControl(src.filter.mode),
      cutoff: cloneControl(src.filter.cutoff),
      resonance: cloneControl(src.filter.resonance),
      drive: cloneControl(src.filter.drive),
    },
    cutoffMod: {
      attack: cloneControl(src.cutoffMod.attack),
      decay: cloneControl(src.cutoffMod.decay),
      amount: cloneControl(src.cutoffMod.amount),
      velocity: cloneControl(src.cutoffMod.velocity),
    },
    lfo1: {
      mode: cloneControl(src.lfo1.mode),
      destination: cloneControl(src.lfo1.destination),
      frequency: cloneControl(src.lfo1.frequency),
      modAmount: cloneControl(src.lfo1.modAmount),
    },
    lfo2: {
      mode: cloneControl(src.lfo2.mode),
      destination: cloneControl(src.lfo2.destination),
      frequency: cloneControl(src.lfo2.frequency),
      modAmount: cloneControl(src.lfo2.modAmount),
    },
  };
}
