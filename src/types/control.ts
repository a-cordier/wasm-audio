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
