import { SelectOptions } from "./select-option";

export enum LfoDestination {
  FREQUENCY = "FREQUENCY",
  OSCILLATOR_MIX = "OSCILLATOR_MIX",
  CUTOFF = "CUTOFF",
  RESONANCE = "RESONANCE",
}

export const lfoDestinations = new SelectOptions([
  { value: LfoDestination.OSCILLATOR_MIX, name: "OSC MIX" },
  { value: LfoDestination.FREQUENCY, name: "FREQ" },
  { value: LfoDestination.CUTOFF, name: "CUTOFF" },
  { value: LfoDestination.RESONANCE, name: "RES" },
]);
