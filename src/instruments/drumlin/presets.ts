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

import { PresetEntry } from "../../core/types";
import { createDrumlinState } from "./types/drumlin-state";

// Factory kits. Values run through createDrumlinState, so each kit may stay
// partial — fields it leaves out ride the defaults (and future params keep
// these kits loading, per the append-only rule).
export const DrumlinFactoryPresets: PresetEntry[] = [
  { name: "INIT", state: createDrumlinState() },
  {
    // Boomy and loose — low subby kick with a long tail, tony snare, roomy
    // clap, sloshy open hat, softened dynamics.
    name: "EIGHT",
    state: createDrumlinState({
      kick: { tune: { value: 25 }, punch: { value: 45 }, decay: { value: 95 }, level: { value: 105 } },
      snare: { tune: { value: 40 }, snap: { value: 55 }, decay: { value: 70 }, level: { value: 95 } },
      clap: { tone: { value: 45 }, decay: { value: 80 }, level: { value: 100 } },
      hats: {
        tone: { value: 54 },
        chDecay: { value: 50 },
        chLevel: { value: 85 },
        ohDecay: { value: 75 },
        ohLevel: { value: 85 },
      },
      tom: { tune: { value: 40 }, decay: { value: 80 }, level: { value: 95 } },
      rim: { tune: { value: 40 }, decay: { value: 50 }, level: { value: 90 } },
      ride: { tone: { value: 50 }, decay: { value: 70 }, level: { value: 80 } },
      crash: { tone: { value: 45 }, decay: { value: 75 }, level: { value: 85 } },
      out: { accent: { value: 80 } },
    }),
  },
  {
    // Punchy and bright — clicky kick, noisy tight snare, crisp clap,
    // ticking closed hat, full velocity dynamics.
    name: "NINE",
    state: createDrumlinState({
      kick: { tune: { value: 60 }, punch: { value: 100 }, decay: { value: 50 }, level: { value: 110 } },
      snare: { tune: { value: 70 }, snap: { value: 95 }, decay: { value: 45 }, level: { value: 105 } },
      clap: { tone: { value: 90 }, decay: { value: 40 }, level: { value: 100 } },
      hats: {
        tone: { value: 85 },
        chDecay: { value: 30 },
        chLevel: { value: 95 },
        ohDecay: { value: 50 },
        ohLevel: { value: 90 },
      },
      tom: { tune: { value: 75 }, decay: { value: 50 }, level: { value: 100 } },
      rim: { tune: { value: 70 }, decay: { value: 30 }, level: { value: 95 } },
      ride: { tone: { value: 80 }, decay: { value: 45 }, level: { value: 85 } },
      crash: { tone: { value: 75 }, decay: { value: 50 }, level: { value: 90 } },
      out: { accent: { value: 115 } },
    }),
  },
];
