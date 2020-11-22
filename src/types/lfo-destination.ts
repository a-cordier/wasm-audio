import { SelectOptions } from "./select-option";

export enum LfoDestination {
  FREQUENCY = 0,
  OSCILLATOR_MIX = 1,
  CUTOFF = 2,
  RESONANCE = 3,
}

export const lfoDestinations = new SelectOptions([
  { value: LfoDestination.OSCILLATOR_MIX, name: "OSC MIX" },
  { value: LfoDestination.FREQUENCY, name: "FREQUENCY" },
  { value: LfoDestination.CUTOFF, name: "CUTOFF" },
  { value: LfoDestination.RESONANCE, name: "RESONANCE" },
]);
