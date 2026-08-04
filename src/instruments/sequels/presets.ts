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
  Direction,
  SequencerState,
  SerializedPattern,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
} from "./types";

/**
 * Authoring helper: one entry per step, 0 meaning a rest.
 * The pattern length is taken from the array, so a 7-note array is a
 * 7-step pattern.
 */
function seq(index: number, notes: number[], velocities?: number[]): SerializedPattern {
  const steps = [];
  for (let i = 0; i < notes.length; i++) {
    if (notes[i] > 0) {
      steps.push({ index: i, note: notes[i], velocity: velocities?.[i] ?? 100 });
    }
  }
  return { index, length: notes.length, steps };
}

function state(patterns: SerializedPattern[], overrides: Partial<typeof DEFAULT_CONFIG> = {}): SequencerState {
  return {
    version: STATE_VERSION,
    config: { ...DEFAULT_CONFIG, ...overrides },
    patterns,
    activePattern: 0,
    bank: 0,
  };
}

const _ = 0; // rest

export const SequelsPresets: PresetEntry[] = [
  {
    name: "INIT",
    state: state([]),
  },
  {
    // Four 16-step variations on an A minor bassline. Switch between them
    // with the digit keys while it runs.
    name: "ACID LINES",
    state: state(
      [
        seq(0, [45, _, 45, 57, _, 45, _, 48, 45, _, 52, _, 45, _, 50, _]),
        seq(1, [45, 45, _, 57, 45, _, 48, _, 45, _, 45, 52, _, 50, _, 48]),
        seq(2, [33, _, _, 45, _, 33, _, _, 40, _, 33, _, 45, _, 43, _]),
        seq(3, [45, 57, 45, 57, 48, 60, 48, 60, 45, 57, 45, 57, 43, 55, 43, 55]),
      ],
      { bpm: 128, gate: 55 }
    ),
  },
  {
    // Patterns of 16, 12, 7 and 5 steps: switching between them mid-flight
    // is where the per-pattern length and the wrap-to-zero rule show up.
    name: "POLYMETER",
    state: state(
      [
        seq(0, [36, _, _, _, 36, _, _, _, 36, _, _, _, 36, _, _, _]),
        seq(1, [48, _, 51, _, 48, _, 55, _, 51, _, 48, _]),
        seq(2, [60, 63, _, 65, _, 63, 60]),
        seq(3, [72, _, 70, _, 67]),
      ],
      { bpm: 110, subdivision: Subdivision.EIGHTH, swing: 18, switchMode: SwitchMode.CYCLE }
    ),
  },
  {
    name: "PING PONG",
    state: state(
      [seq(0, [40, 45, 47, 52, 54, 59, 61, 66])],
      { bpm: 96, direction: Direction.PING_PONG, gate: 90 }
    ),
  },
];
