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

// Each control's value is wrapped in `{ value }` so a section is a uniform
// Record the merge helper can walk. Values are raw 0..127 (house rule: the
// mapping to real units lives at the engine boundary — for VERB that is the
// processor, which receives these same raw values over the port).
interface Field {
  value: number;
}

export interface VerbState {
  tank: { size: Field; decay: Field; damp: Field };
}

const DEFAULTS: VerbState = {
  tank: { size: { value: 60 }, decay: { value: 55 }, damp: { value: 45 } },
};

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

export function createVerbState(partial: Partial<VerbState> = {}): VerbState {
  return {
    tank: mergeSection(DEFAULTS.tank, partial.tank),
  };
}
