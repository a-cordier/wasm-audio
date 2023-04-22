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
import { OscillatorMode } from "./oscillator-mode";
import { FilterMode } from "./filter-mode";
import { LfoDestination } from "./lfo-destination";
import { MidiControlID } from "./midi-learn-options";

export type ControlValue = number | OscillatorMode | FilterMode | LfoDestination;

export interface Control {
  value: ControlValue;
  controller?: number;
  clone?(): Control;
}

export class SelectControl implements Control {
  value: ControlValue;

  constructor(value: ControlValue) {
    this.value = value as OscillatorMode | FilterMode | LfoDestination;
    this.clone = this.clone.bind(this);
  }

  clone(): Control {
    return { ...this };
  }
}

export class MidiControl implements Control {
  id: MidiControlID;
  value: number;
  controller: number;

  private mapper: (input: ControlValue) => ControlValue;

  constructor(id: MidiControlID, value: ControlValue, controller = -1) {
    this.id = id;
    this.value = value as number;
    this.controller = controller;
    this.clone = this.clone.bind(this);
  }

  clone(): Control {
    return { ...this };
  }
}
