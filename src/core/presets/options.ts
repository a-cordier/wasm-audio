import { SelectOptions } from "../../types/select-option";

export const PresetOptions = new SelectOptions([
  {
    name: "SAWSEESS",
    value: {
      osc1: {
        mode: { value: 1 },
        semiShift: { id: 0, value: 31.75, controller: -1 },
        centShift: { id: 1, value: 63.5, controller: -1 },
        cycle: { id: 2, value: 63.5, controller: -1 },
      },
      osc2: {
        mode: { value: 1 },
        semiShift: { id: 5, value: 63.5, controller: -1 },
        centShift: { id: 6, value: 84.66666666666666, controller: -1 },
        cycle: { id: 7, value: 63.5, controller: -1 },
      },
      osc2Amplitude: { id: 3, value: 24, controller: 21 },
      noiseLevel: { id: 4, value: 0, controller: -1 },
      envelope: {
        attack: { id: 11, value: 0, controller: -1 },
        decay: { id: 12, value: 34.925000000000004, controller: -1 },
        sustain: { id: 13, value: 0, controller: -1 },
        release: { id: 14, value: 0, controller: -1 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { id: 8, value: 0, controller: 14 },
        resonance: { id: 9, value: 127, controller: 15 },
        drive: { id: 10, value: 34, controller: 16 },
      },
      cutoffMod: {
        attack: { id: 21, value: 0, controller: 19 },
        decay: { id: 22, value: 9, controller: 20 },
        amount: { id: 19, value: 21, controller: 17 },
        velocity: { id: 20, value: 21, controller: 18 },
      },
      lfo1: {
        mode: { value: 2 },
        destination: { value: 0 },
        frequency: { id: 15, value: 15.875, controller: -1 },
        modAmount: { id: 16, value: 0, controller: -1 },
      },
      lfo2: {
        mode: { value: 2 },
        destination: { value: 2 },
        frequency: { id: 17, value: 31.75, controller: -1 },
        modAmount: { id: 18, value: 0, controller: -1 },
      },
    },
  },
  {
    name: "GLAZZQON",
    value: {
      osc1: {
        mode: { value: 2 },
        semiShift: { id: 0, value: 63.5, controller: -1 },
        centShift: { id: 1, value: 63.5, controller: -1 },
        cycle: { id: 2, value: 50.8, controller: -1 },
      },
      osc2: {
        mode: { value: 2 },
        semiShift: { id: 5, value: 127, controller: -1 },
        centShift: { id: 6, value: 76.5, controller: -1 },
        cycle: { id: 7, value: 73.66666666666667, controller: -1 },
      },
      osc2Amplitude: { id: 3, value: 0, controller: 21 },
      noiseLevel: { id: 4, value: 0, controller: -1 },
      envelope: {
        attack: { id: 11, value: 0, controller: 19 },
        decay: { id: 12, value: 2.1166666666666734, controller: -1 },
        sustain: { id: 13, value: 40, controller: 19 },
        release: { id: 14, value: 105, controller: 20 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { id: 8, value: 127, controller: 14 },
        resonance: { id: 9, value: 0, controller: 15 },
        drive: { id: 10, value: 0, controller: 16 },
      },
      cutoffMod: {
        attack: { id: 21, value: 0, controller: -1 },
        decay: { id: 22, value: 35, controller: 18 },
        amount: { id: 19, value: 0, controller: 17 },
        velocity: { id: 20, value: 0, controller: 18 },
      },
      lfo1: {
        mode: { value: 0 },
        destination: { value: 4 },
        frequency: { id: 15, value: 44.875, controller: -1 },
        modAmount: { id: 16, value: 0, controller: -1 },
      },
      lfo2: {
        mode: { value: 0 },
        destination: { value: 5 },
        frequency: { id: 17, value: 56.75, controller: -1 },
        modAmount: { id: 18, value: 12, controller: -1 },
      },
    },
  },
]);
