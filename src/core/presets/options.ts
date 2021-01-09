import { SelectOptions } from "../../types/select-option";

export const PresetOptions = new SelectOptions([
  {
    name: "SOFOSC",
    value: {
      osc1: {
        mode: { value: 0 },
        semiShift: { controller: -1, id: 0, value: 63.5 },
        centShift: { controller: -1, id: 1, value: 63.5 },
        cycle: { controller: -1, id: 2, value: 63.5 },
      },
      osc2: {
        mode: { value: 0 },
        semiShift: { controller: -1, id: 5, value: 95.25 },
        centShift: { controller: -1, id: 6, value: 63.5 },
        cycle: { controller: -1, id: 7, value: 63.5 },
      },
      osc2Amplitude: { controller: -1, id: 3, value: 39 },
      noiseLevel: { controller: -1, id: 4, value: 0 },
      envelope: {
        attack: { controller: -1, id: 11, value: 2.1166666666666734 },
        decay: { controller: -1, id: 12, value: 127 },
        sustain: { controller: -1, id: 13, value: 127 },
        release: { controller: -1, id: 14, value: 64.55833333333332 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { controller: -1, id: 8, value: 127 },
        resonance: { controller: -1, id: 9, value: 0 },
        drive: { controller: -1, id: 10, value: 0 },
      },
      cutoffMod: {
        attack: { controller: -1, id: 21, value: 15.875 },
        decay: { controller: -1, id: 22, value: 42.333333333333336 },
        amount: { controller: -1, id: 19, value: 0 },
        velocity: { controller: -1, id: 20, value: 0 },
      },
      lfo1: {
        mode: { value: 0 },
        destination: { value: 1 },
        frequency: { controller: -1, id: 15, value: 15.875 },
        modAmount: { controller: -1, id: 16, value: 32 },
      },
      lfo2: {
        mode: { value: 2 },
        destination: { value: 2 },
        frequency: { controller: -1, id: 17, value: 31.75 },
        modAmount: { controller: -1, id: 18, value: 0 },
      },
    },
  },
  {
    name: "SAWSEESS",
    value: {
      osc1: {
        mode: { value: 1 },
        semiShift: { controller: -1, id: 0, value: 31.75 },
        centShift: { controller: -1, id: 1, value: 63.5 },
        cycle: { controller: -1, id: 2, value: 63.5 },
      },
      osc2: {
        mode: { value: 1 },
        semiShift: { controller: -1, id: 5, value: 63.5 },
        centShift: { controller: -1, id: 6, value: 84.66666666666666 },
        cycle: { controller: -1, id: 7, value: 63.5 },
      },
      osc2Amplitude: { controller: -1, id: 3, value: 0 },
      noiseLevel: { controller: -1, id: 4, value: 0 },
      envelope: {
        attack: { controller: -1, id: 11, value: 0 },
        decay: { controller: -1, id: 12, value: 34.925000000000004 },
        sustain: { controller: -1, id: 13, value: 0 },
        release: { controller: -1, id: 14, value: 0 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { controller: -1, id: 8, value: 3.25 },
        resonance: { controller: -1, id: 9, value: 127 },
        drive: { controller: -1, id: 10, value: 25 },
      },
      cutoffMod: {
        attack: { controller: -1, id: 21, value: 0 },
        decay: { controller: -1, id: 22, value: 27.51666666666667 },
        amount: { controller: -1, id: 19, value: 22 },
        velocity: { controller: -1, id: 20, value: 0 },
      },
      lfo1: {
        mode: { value: 2 },
        destination: { value: 0 },
        frequency: { controller: -1, id: 15, value: 15.875 },
        modAmount: { controller: -1, id: 16, value: 0 },
      },
      lfo2: {
        mode: { value: 2 },
        destination: { value: 2 },
        frequency: { controller: -1, id: 17, value: 31.75 },
        modAmount: { controller: -1, id: 18, value: 0 },
      },
    },
  },
  {
    name: "GLAZZQON",
    value: {
      osc1: {
        mode: { value: 2 },
        semiShift: { controller: -1, id: 0, value: 63.5 },
        centShift: { controller: -1, id: 1, value: 63.5 },
        cycle: { controller: -1, id: 2, value: 50.8 },
      },
      osc2: {
        mode: { value: 0 },
        semiShift: { controller: -1, id: 5, value: 127 },
        centShift: { controller: -1, id: 6, value: 63.5 },
        cycle: { controller: -1, id: 7, value: 84.66666666666667 },
      },
      osc2Amplitude: { controller: -1, id: 3, value: 0 },
      noiseLevel: { controller: -1, id: 4, value: 0 },
      envelope: {
        attack: { controller: -1, id: 11, value: 0 },
        decay: { controller: -1, id: 12, value: 2.1166666666666734 },
        sustain: { controller: -1, id: 13, value: 6.350000000000006 },
        release: { controller: -1, id: 14, value: 83.60833333333333 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { controller: -1, id: 8, value: 127 },
        resonance: { controller: -1, id: 9, value: 0 },
        drive: { controller: -1, id: 10, value: 0 },
      },
      cutoffMod: {
        attack: { controller: -1, id: 21, value: 0 },
        decay: { controller: -1, id: 22, value: 15.875 },
        amount: { controller: -1, id: 19, value: 0 },
        velocity: { controller: -1, id: 20, value: 0 },
      },
      lfo1: {
        mode: { value: 0 },
        destination: { value: 4 },
        frequency: { controller: -1, id: 15, value: 44.875 },
        modAmount: { controller: -1, id: 16, value: 0 },
      },
      lfo2: {
        mode: { value: 0 },
        destination: { value: 5 },
        frequency: { controller: -1, id: 17, value: 56.75 },
        modAmount: { controller: -1, id: 18, value: 12 },
      },
    },
  },
]);
