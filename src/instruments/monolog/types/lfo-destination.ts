import { SelectOptions } from "../../../types/select-option";

export enum MonologLfoDestination {
  PITCH = 0,
  CUTOFF = 1,
  PULSE_WIDTH = 2,
}

export const MonologLfoDestinationOptions = new SelectOptions([
  { name: "PITCH", value: MonologLfoDestination.PITCH },
  { name: "CUTOFF", value: MonologLfoDestination.CUTOFF },
  { name: "PW", value: MonologLfoDestination.PULSE_WIDTH },
]);
