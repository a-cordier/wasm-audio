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

import { TemplateWave } from "./template-params";

// Each control's value is wrapped in `{ value }` so a section is a uniform
// Record the merge helper can walk. State is sectioned by panel zone.
interface Field {
  value: number;
}

export interface TemplateState {
  osc: { wave: Field; octave: Field };
  amp: { attack: Field; release: Field; level: Field };
}

const DEFAULTS: TemplateState = {
  osc: { wave: { value: TemplateWave.SAW }, octave: { value: 2 } }, // octave 2 == 0 shift
  amp: { attack: { value: 6 }, release: { value: 40 }, level: { value: 100 } },
};

/**
 * Merge a saved/partial section over the defaults, field by field. This is what
 * keeps old presets loading when new params are appended: a field the preset
 * never knew about simply falls back to its default.
 */
function mergeSection<T extends Record<string, Field>>(
  defaults: T,
  partial?: Partial<Record<keyof T, Field>>
): T {
  const out = {} as T;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const saved = partial?.[key];
    out[key] = {
      value: typeof saved?.value === "number" ? saved.value : defaults[key].value,
    } as T[keyof T];
  }
  return out;
}

export function createTemplateState(partial: Partial<TemplateState> = {}): TemplateState {
  return {
    osc: mergeSection(DEFAULTS.osc, partial.osc),
    amp: mergeSection(DEFAULTS.amp, partial.amp),
  };
}
