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
import { SelectOptions } from "../types/select-option";

export const PresetOptions = new SelectOptions([
  {
    name: "SAWSEESS",
    value: {
      osc1: {
        mode: { value: 1 },
        semiShift: { value: 31.75 },
        centShift: { value: 63.5 },
        cycle: { value: 63.5 },
      },
      osc2: {
        mode: { value: 1 },
        semiShift: { value: 63.5 },
        centShift: { value: 84.66666666666666 },
        cycle: { value: 63.5 },
      },
      osc2Amplitude: { value: 24 },
      noiseLevel: { value: 0 },
      envelope: {
        attack: { value: 0 },
        decay: { value: 34.925000000000004 },
        sustain: { value: 0 },
        release: { value: 0 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { value: 0 },
        resonance: { value: 127 },
        drive: { value: 34 },
      },
      cutoffMod: {
        attack: { value: 0 },
        decay: { value: 9 },
        amount: { value: 21 },
        velocity: { value: 21 },
      },
      lfo1: {
        mode: { value: 2 },
        destination: { value: 0 },
        frequency: { value: 15.875 },
        modAmount: { value: 0 },
      },
      lfo2: {
        mode: { value: 2 },
        destination: { value: 2 },
        frequency: { value: 31.75 },
        modAmount: { value: 0 },
      },
    },
  },
  {
    name: "GLAZZQON",
    value: {
      osc1: {
        mode: { value: 2 },
        semiShift: { value: 63.5 },
        centShift: { value: 63.5 },
        cycle: { value: 50.8 },
      },
      osc2: {
        mode: { value: 2 },
        semiShift: { value: 127 },
        centShift: { value: 76.5 },
        cycle: { value: 73.66666666666667 },
      },
      osc2Amplitude: { value: 0 },
      noiseLevel: { value: 0 },
      envelope: {
        attack: { value: 0 },
        decay: { value: 2.1166666666666734 },
        sustain: { value: 40 },
        release: { value: 105 },
      },
      filter: {
        mode: { value: 0 },
        cutoff: { value: 127 },
        resonance: { value: 0 },
        drive: { value: 0 },
      },
      cutoffMod: {
        attack: { value: 0 },
        decay: { value: 35 },
        amount: { value: 0 },
        velocity: { value: 0 },
      },
      lfo1: {
        mode: { value: 0 },
        destination: { value: 4 },
        frequency: { value: 44.875 },
        modAmount: { value: 0 },
      },
      lfo2: {
        mode: { value: 0 },
        destination: { value: 5 },
        frequency: { value: 56.75 },
        modAmount: { value: 12 },
      },
    },
  },
]);
