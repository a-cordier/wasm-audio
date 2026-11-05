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
  kick: { tune: Field; punch: Field; decay: Field; level: Field; note: Field; route: Field };
  snare: { tune: Field; snap: Field; decay: Field; level: Field; note: Field; route: Field };
  clap: { tone: Field; decay: Field; level: Field; note: Field; route: Field };
  hats: {
    tone: Field; // the CH tone — born as the shared bank tone, key kept for old sessions
    chDecay: Field;
    chLevel: Field;
    ohDecay: Field;
    ohLevel: Field;
    chNote: Field;
    ohNote: Field;
    ohTone: Field;
    chRoute: Field;
    ohRoute: Field;
  };
  tom: { tune: Field; decay: Field; level: Field; note: Field; route: Field };
  rim: { tune: Field; decay: Field; level: Field; note: Field; route: Field };
  ride: { tone: Field; decay: Field; level: Field; note: Field; route: Field };
  crash: { tone: Field; decay: Field; level: Field; note: Field; route: Field };
  out: { accent: Field };
}

const DEFAULTS: DrumlinState = {
  // Note defaults are the GM drum map (tom answers its base ±2 → 43/45/47).
  kick: { tune: { value: 40 }, punch: { value: 70 }, decay: { value: 65 }, level: { value: 100 }, note: { value: 36 }, route: { value: 0 } },
  snare: { tune: { value: 50 }, snap: { value: 70 }, decay: { value: 55 }, level: { value: 100 }, note: { value: 38 }, route: { value: 0 } },
  clap: { tone: { value: 60 }, decay: { value: 50 }, level: { value: 100 }, note: { value: 39 }, route: { value: 0 } },
  hats: {
    tone: { value: 64 },
    chDecay: { value: 40 },
    chLevel: { value: 90 },
    ohDecay: { value: 60 },
    ohLevel: { value: 90 },
    chNote: { value: 42 },
    ohNote: { value: 46 },
    ohTone: { value: 64 },
    chRoute: { value: 0 },
    ohRoute: { value: 0 },
  },
  tom: { tune: { value: 60 }, decay: { value: 60 }, level: { value: 95 }, note: { value: 45 }, route: { value: 0 } },
  rim: { tune: { value: 50 }, decay: { value: 40 }, level: { value: 95 }, note: { value: 37 }, route: { value: 0 } },
  ride: { tone: { value: 64 }, decay: { value: 55 }, level: { value: 85 }, note: { value: 51 }, route: { value: 0 } },
  crash: { tone: { value: 64 }, decay: { value: 60 }, level: { value: 90 }, note: { value: 49 }, route: { value: 0 } },
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

/** Deep-partial input: sections AND fields may be missing (old presets are). */
export type DrumlinStatePartial = { [K in keyof DrumlinState]?: Partial<DrumlinState[K]> };

export function createDrumlinState(partial: DrumlinStatePartial = {}): DrumlinState {
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
