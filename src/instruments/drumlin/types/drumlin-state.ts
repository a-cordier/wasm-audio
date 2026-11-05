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
// Record the merge helper can walk. State is sectioned by panel zone (= voice).
export interface Field {
  value: number;
}

export interface DrumlinState {
  kick: { tune: Field; punch: Field; decay: Field; level: Field };
  snare: { tune: Field; snap: Field; decay: Field; level: Field };
  clap: { tone: Field; decay: Field; level: Field };
  hats: { tone: Field; chDecay: Field; chLevel: Field; ohDecay: Field; ohLevel: Field };
  tom: { tune: Field; decay: Field; level: Field };
  rim: { tune: Field; decay: Field; level: Field };
  ride: { tone: Field; decay: Field; level: Field };
  crash: { tone: Field; decay: Field; level: Field };
  out: { accent: Field };
}

const DEFAULTS: DrumlinState = {
  kick: { tune: { value: 40 }, punch: { value: 70 }, decay: { value: 65 }, level: { value: 100 } },
  snare: { tune: { value: 50 }, snap: { value: 70 }, decay: { value: 55 }, level: { value: 100 } },
  clap: { tone: { value: 60 }, decay: { value: 50 }, level: { value: 100 } },
  hats: {
    tone: { value: 64 },
    chDecay: { value: 40 },
    chLevel: { value: 90 },
    ohDecay: { value: 60 },
    ohLevel: { value: 90 },
  },
  tom: { tune: { value: 60 }, decay: { value: 60 }, level: { value: 95 } },
  rim: { tune: { value: 50 }, decay: { value: 40 }, level: { value: 95 } },
  ride: { tone: { value: 64 }, decay: { value: 55 }, level: { value: 85 } },
  crash: { tone: { value: 64 }, decay: { value: 60 }, level: { value: 90 } },
  out: { accent: { value: 100 } },
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

export function createDrumlinState(partial: Partial<DrumlinState> = {}): DrumlinState {
  return {
    kick: mergeSection(DEFAULTS.kick, partial.kick),
    snare: mergeSection(DEFAULTS.snare, partial.snare),
    clap: mergeSection(DEFAULTS.clap, partial.clap),
    hats: mergeSection(DEFAULTS.hats, partial.hats),
    tom: mergeSection(DEFAULTS.tom, partial.tom),
    rim: mergeSection(DEFAULTS.rim, partial.rim),
    ride: mergeSection(DEFAULTS.ride, partial.ride),
    crash: mergeSection(DEFAULTS.crash, partial.crash),
    out: mergeSection(DEFAULTS.out, partial.out),
  };
}
