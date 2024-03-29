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
import { SelectOptions } from "./select-option";

export enum MidiControlID {
  NONE = -1, // NONE should be used to indicate that no control is learning from MIDI

  OSC1_SEMI,
  OSC1_CENT,
  OSC1_CYCLE,
  OSC_MIX,
  NOISE,
  OSC2_SEMI,
  OSC2_CENT,
  OSC2_CYCLE,
  CUTOFF,
  RESONANCE,
  DRIVE,
  ATTACK,
  DECAY,
  SUSTAIN,
  RELEASE,
  LFO1_FREQ,
  LFO1_MOD,
  LFO2_FREQ,
  LFO2_MOD,
  CUT_MOD,
  CUT_VEL,
  CUT_ATTACK,
  CUT_DECAY,
}

function toSelectOption(option: MidiControlID) {
  return {
    name: MidiControlID[option].replace(/_/g, " "),
    value: option,
  };
}

export const MidiLearnOptions = new SelectOptions([
  toSelectOption(MidiControlID.OSC1_SEMI),
  toSelectOption(MidiControlID.OSC1_CENT),
  toSelectOption(MidiControlID.OSC1_CYCLE),
  toSelectOption(MidiControlID.OSC_MIX),
  toSelectOption(MidiControlID.NOISE),
  toSelectOption(MidiControlID.OSC2_SEMI),
  toSelectOption(MidiControlID.OSC2_CENT),
  toSelectOption(MidiControlID.OSC2_CYCLE),
  toSelectOption(MidiControlID.ATTACK),
  toSelectOption(MidiControlID.DECAY),
  toSelectOption(MidiControlID.SUSTAIN),
  toSelectOption(MidiControlID.RELEASE),
  toSelectOption(MidiControlID.CUTOFF),
  toSelectOption(MidiControlID.RESONANCE),
  toSelectOption(MidiControlID.DRIVE),
  toSelectOption(MidiControlID.CUT_MOD),
  toSelectOption(MidiControlID.CUT_VEL),
  toSelectOption(MidiControlID.CUT_ATTACK),
  toSelectOption(MidiControlID.CUT_DECAY),
  toSelectOption(MidiControlID.LFO1_FREQ),
  toSelectOption(MidiControlID.LFO1_MOD),
  toSelectOption(MidiControlID.LFO2_FREQ),
  toSelectOption(MidiControlID.LFO2_MOD),
]);
