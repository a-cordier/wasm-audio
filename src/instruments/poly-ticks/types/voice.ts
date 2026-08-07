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
import { Control } from "./control";
import { FilterState } from "./filter-state";

export interface OscillatorState {
  mode: Control;
  semiShift: Control;
  centShift: Control;
  cycle: Control;
}

export interface EnvelopeState {
  attack: Control;
  decay: Control;
  sustain: Control;
  release: Control;
}

export interface CutoffModState {
  attack: Control;
  decay: Control;
  amount: Control;
  velocity: Control;
}

export interface LFOState {
  mode: Control;
  frequency: Control;
  modAmount: Control;
  destination: Control;
}

export interface VoiceConfigState {
  voiceMode: Control;
  glideTime: Control;
  retrigger: Control;
}

export interface RoutingState {
  routing: Control;
  fmIndex: Control;
  subLevel: Control;
}

export interface SpaceState {
  spread: Control;
  width: Control;
  drift: Control;
}

export interface VoiceState {
  osc1: OscillatorState;
  osc2: OscillatorState;
  osc2Amplitude: Control;
  noiseLevel: Control;
  envelope: EnvelopeState;
  filter: FilterState;
  cutoffMod: CutoffModState;
  lfo1: LFOState;
  lfo2: LFOState;
  voiceConfig: VoiceConfigState;
  routing: RoutingState;
  space: SpaceState;
}

// Full defaults double as the back-compat source: any field an old preset or
// saved state omits falls back to its INIT value instead of throwing. The
// routing defaults reproduce the behaviour that predated those controls: plain
// osc1/osc2 crossfade, no stereo placement, phase-locked note starts, and a
// sub level of 31.75/127, which is exactly the 0.25 once hardcoded in the voice.
const DEFAULTS: VoiceState = {
  osc1: { mode: { value: 1 }, semiShift: { value: 63.5 }, centShift: { value: 63.5 }, cycle: { value: 63.5 } },
  osc2: { mode: { value: 1 }, semiShift: { value: 63.5 }, centShift: { value: 63.5 }, cycle: { value: 63.5 } },
  osc2Amplitude: { value: 0 },
  noiseLevel: { value: 0 },
  envelope: { attack: { value: 0 }, decay: { value: 63 }, sustain: { value: 80 }, release: { value: 20 } },
  filter: { mode: { value: 0 }, cutoff: { value: 127 }, resonance: { value: 0 }, drive: { value: 0 } },
  cutoffMod: { attack: { value: 0 }, decay: { value: 0 }, amount: { value: 0 }, velocity: { value: 0 } },
  lfo1: { mode: { value: 0 }, frequency: { value: 0 }, modAmount: { value: 0 }, destination: { value: 0 } },
  lfo2: { mode: { value: 0 }, frequency: { value: 0 }, modAmount: { value: 0 }, destination: { value: 0 } },
  voiceConfig: { voiceMode: { value: 0 }, glideTime: { value: 0 }, retrigger: { value: 1 } },
  routing: { routing: { value: 0 }, fmIndex: { value: 0 }, subLevel: { value: 31.75 } },
  space: { spread: { value: 0 }, width: { value: 0 }, drift: { value: 0 } },
};

function mergeControl(defaultControl: Control, saved?: Control): Control {
  return { value: typeof saved?.value === "number" ? saved.value : defaultControl.value };
}

function mergeSection<T extends { [K in keyof T]: Control }>(
  defaults: T,
  partial?: Partial<T>
): T {
  const out = {} as T;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    out[key] = mergeControl(defaults[key], partial?.[key]) as T[keyof T];
  }
  return out;
}

export function createVoiceState(src: Partial<VoiceState> = {}): VoiceState {
  return {
    osc1: mergeSection(DEFAULTS.osc1, src.osc1),
    osc2: mergeSection(DEFAULTS.osc2, src.osc2),
    osc2Amplitude: mergeControl(DEFAULTS.osc2Amplitude, src.osc2Amplitude),
    noiseLevel: mergeControl(DEFAULTS.noiseLevel, src.noiseLevel),
    envelope: mergeSection(DEFAULTS.envelope, src.envelope),
    filter: mergeSection(DEFAULTS.filter, src.filter),
    cutoffMod: mergeSection(DEFAULTS.cutoffMod, src.cutoffMod),
    lfo1: mergeSection(DEFAULTS.lfo1, src.lfo1),
    lfo2: mergeSection(DEFAULTS.lfo2, src.lfo2),
    voiceConfig: mergeSection(DEFAULTS.voiceConfig, src.voiceConfig),
    routing: mergeSection(DEFAULTS.routing, src.routing),
    space: mergeSection(DEFAULTS.space, src.space),
  };
}
