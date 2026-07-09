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

import { Disposable } from "../midi/types";
import { SelectOptions } from "../types/select-option";

export enum ControlID {
  NONE = -1,

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

export interface ControlSignal {
  sourceId: string;
  value: number;
  protocol: string;
  raw?: unknown;
}

export interface ControlBinding {
  controlId: ControlID;
  sourceId: string;
}

export interface ControlSourceAdapter {
  readonly protocol: string;
  connect(): void;
  disconnect(): void;
  onSignal(handler: (signal: ControlSignal) => void): Disposable;
}

function toSelectOption(option: ControlID) {
  return {
    name: ControlID[option].replace(/_/g, " "),
    value: option,
  };
}

export const LearnOptions = new SelectOptions([
  toSelectOption(ControlID.OSC1_SEMI),
  toSelectOption(ControlID.OSC1_CENT),
  toSelectOption(ControlID.OSC1_CYCLE),
  toSelectOption(ControlID.OSC_MIX),
  toSelectOption(ControlID.NOISE),
  toSelectOption(ControlID.OSC2_SEMI),
  toSelectOption(ControlID.OSC2_CENT),
  toSelectOption(ControlID.OSC2_CYCLE),
  toSelectOption(ControlID.ATTACK),
  toSelectOption(ControlID.DECAY),
  toSelectOption(ControlID.SUSTAIN),
  toSelectOption(ControlID.RELEASE),
  toSelectOption(ControlID.CUTOFF),
  toSelectOption(ControlID.RESONANCE),
  toSelectOption(ControlID.DRIVE),
  toSelectOption(ControlID.CUT_MOD),
  toSelectOption(ControlID.CUT_VEL),
  toSelectOption(ControlID.CUT_ATTACK),
  toSelectOption(ControlID.CUT_DECAY),
  toSelectOption(ControlID.LFO1_FREQ),
  toSelectOption(ControlID.LFO1_MOD),
  toSelectOption(ControlID.LFO2_FREQ),
  toSelectOption(ControlID.LFO2_MOD),
]);
