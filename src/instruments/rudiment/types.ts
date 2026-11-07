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

import { Channel } from "../../midi/types";

/**
 * Steps per beat. Drums live at and above the 1/8: straight and triplet
 * eighths, sixteenths, and thirty-seconds for rolls. All Float32-exact.
 */
export const SUBDIVISIONS = [2, 3, 4, 6, 8] as const;
export const SUBDIVISION_NAMES = ["1/8", "1/8T", "1/16", "1/16T", "1/32"] as const;
export type Subdivision = (typeof SUBDIVISIONS)[number];

export const enum TransportState {
  STOPPED = 0,
  PLAYING = 1,
  PAUSED = 2,
}

/**
 * When a pattern change takes effect.
 *   IMMEDIATE: at the next step boundary, holding the current position.
 *   CYCLE:     when the running pattern completes its cycle, from step 0.
 */
export const enum SwitchMode {
  IMMEDIATE = 0,
  CYCLE = 1,
}

/** Lanes in use. The buffers stride by LANE_CAPACITY, so lanes can be
 * appended later without re-laying saved patterns. */
export const LANE_COUNT = 11;
export const LANE_CAPACITY = 16;

export interface LaneSpec {
  name: string;
  note: number;
}

/** DRUMLIN's receive notes (its tom answers base ±2 at ∓/±5 st, hence three
 * tom lanes), so a fresh RUDIMENT drives a fresh DRUMLIN with no setup. */
export const DEFAULT_LANES: readonly LaneSpec[] = [
  { name: "KICK", note: 36 },
  { name: "SNARE", note: 38 },
  { name: "CLAP", note: 39 },
  { name: "RIM", note: 37 },
  { name: "CH", note: 42 },
  { name: "OH", note: 46 },
  { name: "LT", note: 43 },
  { name: "MT", note: 45 },
  { name: "HT", note: 47 },
  { name: "RIDE", note: 51 },
  { name: "CRASH", note: 49 },
];

/** The three brush levels (velocity). Accent is simply the loudest hit. */
export const VELOCITY_LEVELS = [60, 100, 127] as const;
export const VELOCITY_LEVEL_NAMES = ["SOFT", "MID", "ACC"] as const;

export const enum ConfigParam {
  BPM = 0,
  SUBDIVISION = 1,
  SWING = 2,
  GATE = 3,
  OUTPUT_CHANNEL = 4,
  ACTIVE_PATTERN = 5,
  SWITCH_MODE = 6,
  METRONOME = 7,
  /** LANE_CAPACITY slots: the MIDI note each lane sends. */
  LANE_NOTE_BASE = 8,
  /** LANE_CAPACITY slots: 1 = lane muted. */
  LANE_MUTE_BASE = 8 + 16,
}

export const CONFIG_PARAM_COUNT = 8 + 2 * LANE_CAPACITY; // 40

export interface RudimentConfig {
  bpm: number;
  subdivision: Subdivision;
  swing: number;
  gate: number;
  outputChannel: Channel;
  switchMode: SwitchMode;
  metronome: boolean;
  /** LANE_COUNT entries. */
  laneNotes: number[];
  /** LANE_COUNT entries. */
  laneMutes: boolean[];
}

export const MAX_STEPS = 64;
export const BANK_COUNT = 4;
export const BANK_SIZE = 10; // one per digit key
export const PATTERN_COUNT = BANK_COUNT * BANK_SIZE; // 40
/** The pattern address vocabulary ("B1" = bank B, pad 1). */
export const BANK_NAMES = ["A", "B", "C", "D"] as const;

/**
 * Pattern buffer layout. One velocity byte per lane per step (0 = off):
 *   [ 40 patterns × 16 lanes × 64 steps ]      hits
 *   [ 40 pattern lengths ]                      1..64
 *   [ 40 patterns × 16 lane lengths ]           0 = follow the pattern
 */
export const LANE_BYTES = MAX_STEPS; // 64
export const PATTERN_BYTES = LANE_CAPACITY * LANE_BYTES; // 1024
export const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 40960
export const LANE_LENGTHS_OFFSET = LENGTHS_OFFSET + PATTERN_COUNT; // 41000
export const PATTERN_BUFFER_BYTES = LANE_LENGTHS_OFFSET + PATTERN_COUNT * LANE_CAPACITY; // 41640

export const DEFAULT_PATTERN_STEPS = 16;

export const DEFAULT_CONFIG: RudimentConfig = {
  bpm: 120,
  subdivision: 4,
  swing: 0,
  gate: 50,
  outputChannel: 0 as Channel,
  switchMode: SwitchMode.IMMEDIATE,
  metronome: false,
  laneNotes: DEFAULT_LANES.map((l) => l.note),
  laneMutes: DEFAULT_LANES.map(() => false),
};

// --- Serialization ---

export const STATE_VERSION = 1;

export interface SerializedHit {
  lane: number;
  index: number;
  velocity: number;
}

export interface SerializedDrumPattern {
  index: number;
  length: number;
  /** Per-lane lengths; omitted when every lane follows the pattern. Sparse:
   * `{ lane: length }`. */
  laneLengths?: Record<number, number>;
  hits: SerializedHit[];
}

/**
 * Round-trippable device state, shared by localStorage persistence, the
 * session snapshot and factory presets. Patterns are sparse — only hits are
 * listed — so 40 patterns stay small and hand-authorable.
 */
export interface RudimentState {
  version: number;
  config: RudimentConfig;
  patterns: SerializedDrumPattern[];
  activePattern: number;
  bank: number;
}

/** C4 = 60 naming (the sequels / DRUMLIN convention: GM kick 36 = "C2"). */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function noteName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}
