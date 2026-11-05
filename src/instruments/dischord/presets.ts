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
import {
  DEFAULT_CONFIG,
  DischordState,
  EmitOrder,
  Quality,
  SerializedChordPattern,
  SerializedChordStep,
  STATE_VERSION,
  Voicing,
} from "./types";

/**
 * Authoring helper: one entry per step — a degree (1-7), or 0 for a rest,
 * or a full step object for octave/tie/quality. The pattern length is taken
 * from the array, so a 4-chord array is a 4-step pattern.
 */
type StepSpec = number | Partial<SerializedChordStep> & { degree: number };

function chords(index: number, specs: StepSpec[]): SerializedChordPattern {
  const steps: SerializedChordStep[] = [];
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    if (typeof spec === "number") {
      if (spec > 0) steps.push({ index: i, degree: spec, velocity: 100 });
    } else if (spec.degree > 0) {
      steps.push({ velocity: 100, ...spec, index: i });
    }
  }
  return { index, length: specs.length, steps };
}

function state(patterns: SerializedChordPattern[], overrides: Partial<typeof DEFAULT_CONFIG> = {}): DischordState {
  return {
    version: STATE_VERSION,
    config: { ...DEFAULT_CONFIG, ...overrides },
    patterns,
    activePattern: 0,
    bank: 0,
  };
}

const _ = 0; // rest

export const DischordPresets: PresetEntry[] = [
  {
    name: "INIT",
    state: state([]),
  },
  {
    // The axis progression (I–V–vi–IV) in C major: one triad per half note,
    // two bars round. Instant gratification and the first-listen QA preset.
    name: "AXIS",
    state: state(
      [chords(0, [1, 5, 6, 4])],
      { subdivision: 0.5, gate: 85 }
    ),
  },
  {
    // A-minor 7ths with a borrowed V7: ties sustain each chord across two
    // steps (the even step holds open, the odd one releases at gate end),
    // SMOOTH voice-leads between them, and STRUM rakes each change. The
    // DOM7 override on degree 5 is the escape hatch out of natural minor.
    name: "SMOKE",
    state: state(
      [
        chords(0, [
          { degree: 1, tie: true }, 1,
          { degree: 6, tie: true }, 6,
          { degree: 3, tie: true }, 3,
          { degree: 5, quality: Quality.DOM7, tie: true }, { degree: 5, quality: Quality.DOM7 },
        ]),
        // A sparser variation on the same changes, roots only on the grid —
        // flip ORDER to BASS and point a mono synth at it.
        chords(1, [1, _, 6, _, 3, _, { degree: 5, quality: Quality.DOM7 }, _]),
      ],
      {
        bpm: 100,
        subdivision: 0.5,
        gate: 90,
        key: 9, // A
        scale: 1, // MIN
        voices: 4,
        voicing: Voicing.SMOOTH,
        order: EmitOrder.LEAD,
        strum: 25,
      }
    ),
  },
];
