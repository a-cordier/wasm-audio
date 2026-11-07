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
  DEFAULT_LANES,
  RudimentConfig,
  RudimentState,
  SerializedDrumPattern,
  SerializedHit,
  STATE_VERSION,
  VELOCITY_LEVELS,
} from "./types";

const [SOFT, MID, ACC] = VELOCITY_LEVELS;
const GLYPHS: Record<string, number> = { o: SOFT, x: MID, X: ACC };

type LaneName = (typeof DEFAULT_LANES)[number]["name"];

/**
 * A pattern from drum-tab strings — one per lane, a glyph per step:
 * `.` rest, `o` SOFT, `x` MID, `X` ACC. A lane string shorter than the
 * pattern becomes that lane's own length (polymeter).
 */
function pattern(index: number, length: number, lanes: Partial<Record<LaneName, string>>): SerializedDrumPattern {
  const hits: SerializedHit[] = [];
  const laneLengths: Record<number, number> = {};
  DEFAULT_LANES.forEach(({ name }, lane) => {
    const tab = lanes[name as LaneName];
    if (!tab) return;
    if (tab.length !== length) laneLengths[lane] = tab.length;
    [...tab].forEach((glyph, i) => {
      const velocity = GLYPHS[glyph];
      if (velocity) hits.push({ lane, index: i, velocity });
    });
  });
  const out: SerializedDrumPattern = { index, length, hits };
  if (Object.keys(laneLengths).length > 0) out.laneLengths = laneLengths;
  return out;
}

function state(patterns: SerializedDrumPattern[], overrides: Partial<RudimentConfig> = {}): RudimentState {
  return {
    version: STATE_VERSION,
    config: {
      ...DEFAULT_CONFIG,
      laneNotes: [...DEFAULT_CONFIG.laneNotes],
      laneMutes: [...DEFAULT_CONFIG.laneMutes],
      ...overrides,
    },
    patterns,
    activePattern: 0,
    bank: 0,
  };
}

export const RudimentPresets: PresetEntry[] = [
  {
    name: "INIT",
    state: state([]),
  },
  {
    // The first-listen preset: snare AND clap stacked on 2 and 4 — the one
    // thing no other sequencer here could say. A0 the groove, A1 a fill.
    name: "BACKBEAT",
    state: state([
      pattern(0, 16, {
        KICK:  "X.......X.x.....",
        SNARE: "....X.......X...",
        CLAP:  "....x.......x...",
        CH:    "X.x.X.x.X.x.X...",
        OH:    "..............x.",
      }),
      pattern(1, 16, {
        KICK:  "X.......X.......",
        SNARE: "....X.......X.oX",
        CLAP:  "....x.......x...",
        CH:    "X.x.X.x.X.x.....",
        HT:    "........x.x.....",
        MT:    "..........x.x...",
        LT:    "............x.x.",
        CRASH: "X...............",
      }),
    ]),
  },
  {
    // Ghost notes live at SOFT under the ACC backbeat; light swing.
    name: "BREAK",
    state: state(
      [
        pattern(0, 16, {
          KICK:  "X.x.......X..x..",
          SNARE: "....X..o.o..X..o",
          CH:    "x.x.x.x.x.x.x.x.",
          OH:    "......x.........",
          RIM:   "...o.......o....",
        }),
      ],
      { bpm: 92, swing: 30 }
    ),
  },
  {
    // Polymeter: a 16-step kick under a 3-step rim and a 5-step hat lane —
    // they realign every 240 steps.
    name: "POLY",
    state: state(
      [
        pattern(0, 16, {
          KICK:  "X...x...X...x...",
          CLAP:  "....x.......x...",
          RIM:   "x.o",
          CH:    "X.xx.",
        }),
      ],
      { bpm: 118 }
    ),
  },
];
