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
import { FilterMode } from "./filter-mode";
import { OscillatorMode } from "./oscillator-mode";
import { LfoDestination } from "./lfo-destination";
import { MidiControlID } from "./midi-learn-options";
import { Control, SelectControl, MidiControl, ControlValue } from "./control";
import { FilterState } from "./filter-state";

type MidiControlMap = Map<MidiControlID, MidiControl>;

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
  findMidiControlById(id: MidiControlID): MidiControl | undefined;
  getMidiControls(): IterableIterator<MidiControl>;
}

export interface Voice extends AudioNode {
  osc1: AudioParam;
  osc2: AudioParam;
  osc1SemiShift: AudioParam;
  osc2SemiShift: AudioParam;
  osc1CentShift: AudioParam;
  osc2CentShift: AudioParam;
  osc1Cycle: AudioParam;
  osc2Cycle: AudioParam;
  noiseLevel: AudioParam;
  frequency: AudioParam;
  amplitudeAttack: AudioParam;
  amplitudeDecay: AudioParam;
  amplitudeSustain: AudioParam;
  amplitudeRelease: AudioParam;
  filterMode: AudioParam;
  cutoff: AudioParam;
  resonance: AudioParam;
  drive: AudioParam;
  cutoffAttack: AudioParam;
  cutoffDecay: AudioParam;
  cutoffEnvelopeAmount: AudioParam;
  osc2Amplitude: AudioParam;
  lfo1Frequency: AudioParam;
  lfo1ModAmount: AudioParam;
  lfo1Mode: AudioParam;
  lfo1Destination: AudioParam;
  lfo2Frequency: AudioParam;
  lfo2ModAmount: AudioParam;
  lfo2Mode: AudioParam;
  lfo2Destination: AudioParam;
  start(time?: number): void;
  stop(time?: number): void;
}

function findMidiControlEntries(state: VoiceState | any) {
  const midiControls = [];
  for (const value of Object.values(state)) {
    if (value instanceof MidiControl) {
      midiControls.push([value.id, value]);
    } else if (value instanceof Object) {
      midiControls.push(...findMidiControlEntries(value));
    }
  }
  return midiControls;
}

function computeMidiControlMap(state: Partial<VoiceState>) {
  const midiControlEntries = findMidiControlEntries(state);
  return new Map(midiControlEntries) as MidiControlMap;
}

export function mapState(state: Partial<VoiceState>): Partial<VoiceState> {
  return {
    osc1: {
      mode: new SelectControl(state.osc1.mode.value),
      semiShift: new MidiControl(MidiControlID.OSC1_SEMI, state.osc1.semiShift.value, state.osc1.semiShift.controller),
      centShift: new MidiControl(MidiControlID.OSC1_CENT, state.osc1.centShift.value, state.osc1.centShift.controller),
      cycle: new MidiControl(MidiControlID.OSC1_CYCLE, state.osc1.cycle.value, state.osc1.cycle.controller),
    },
    osc2: {
      mode: new SelectControl(state.osc2.mode.value),
      semiShift: new MidiControl(MidiControlID.OSC2_SEMI, state.osc2.semiShift.value, state.osc2.semiShift.controller),
      centShift: new MidiControl(MidiControlID.OSC2_CENT, state.osc2.centShift.value, state.osc2.centShift.controller),
      cycle: new MidiControl(MidiControlID.OSC2_CYCLE, state.osc2.cycle.value, state.osc2.cycle.controller),
    },
    osc2Amplitude: new MidiControl(MidiControlID.OSC_MIX, state.osc2Amplitude.value, state.osc2Amplitude.controller),
    noiseLevel: new MidiControl(MidiControlID.NOISE, state.noiseLevel.value, state.noiseLevel.controller),
    envelope: {
      attack: new MidiControl(MidiControlID.ATTACK, state.envelope.attack.value, state.envelope.attack.controller),
      decay: new MidiControl(MidiControlID.DECAY, state.envelope.decay.value, state.envelope.decay.controller),
      sustain: new MidiControl(MidiControlID.SUSTAIN, state.envelope.sustain.value, state.envelope.sustain.controller),
      release: new MidiControl(MidiControlID.RELEASE, state.envelope.release.value, state.envelope.release.controller),
    },
    filter: {
      mode: new SelectControl(state.filter.mode.value),
      cutoff: new MidiControl(MidiControlID.CUTOFF, state.filter.cutoff.value, state.filter.cutoff.controller),
      resonance: new MidiControl(
        MidiControlID.RESONANCE,
        state.filter.resonance.value,
        state.filter.resonance.controller
      ),
      drive: new MidiControl(MidiControlID.DRIVE, state.filter.drive.value, state.filter.drive.controller),
    },
    cutoffMod: {
      attack: new MidiControl(
        MidiControlID.CUT_ATTACK,
        state.cutoffMod.attack.value,
        state.cutoffMod.attack.controller
      ),
      decay: new MidiControl(MidiControlID.CUT_DECAY, state.cutoffMod.decay.value, state.cutoffMod.decay.controller),
      amount: new MidiControl(MidiControlID.CUT_MOD, state.cutoffMod.amount.value, state.cutoffMod.amount.controller),
      velocity: new MidiControl(
        MidiControlID.CUT_VEL,
        state.cutoffMod.velocity.value,
        state.cutoffMod.velocity.controller
      ),
    },
    lfo1: {
      mode: new SelectControl(state.lfo1.mode.value),
      destination: new SelectControl(state.lfo1.destination.value),
      frequency: new MidiControl(MidiControlID.LFO1_FREQ, state.lfo1.frequency.value, state.lfo1.frequency.controller),
      modAmount: new MidiControl(MidiControlID.LFO1_MOD, state.lfo1.modAmount.value, state.lfo1.modAmount.controller),
    },
    lfo2: {
      mode: new SelectControl(state.lfo2.mode.value),
      destination: new SelectControl(state.lfo2.destination.value),
      frequency: new MidiControl(MidiControlID.LFO2_FREQ, state.lfo2.frequency.value, state.lfo2.frequency.controller),
      modAmount: new MidiControl(MidiControlID.LFO2_MOD, state.lfo2.modAmount.value, state.lfo2.modAmount.controller),
    },
  };
}
export function createVoiceState(state: Partial<VoiceState>): VoiceState {
  const newState = mapState(state);
  const midiControlMap = computeMidiControlMap(newState);

  return Object.assign(newState as VoiceState, {
    findMidiControlById(id: MidiControlID): MidiControl {
      return midiControlMap.get(id);
    },
    getMidiControls(): IterableIterator<MidiControl> {
      return midiControlMap.values();
    },
  });
}
