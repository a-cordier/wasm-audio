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
// controller owns the mapping to real units at the node boundary).
interface Field {
  value: number;
}

export interface EchoState {
  delay: { time: Field; feedback: Field; tone: Field };
}

const DEFAULTS: EchoState = {
  delay: { time: { value: 74 }, feedback: { value: 45 }, tone: { value: 90 } },
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

export function createEchoState(partial: Partial<EchoState> = {}): EchoState {
  return {
    delay: mergeSection(DEFAULTS.delay, partial.delay),
  };
}
