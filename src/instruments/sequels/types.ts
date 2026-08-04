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

export const enum Subdivision {
  QUARTER = 1,
  EIGHTH = 2,
  SIXTEENTH = 4,
  THIRTY_SECOND = 8,
}

export const enum Direction {
  FORWARD = 0,
  REVERSE = 1,
  PING_PONG = 2,
  RANDOM = 3,
}

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

export const enum ConfigParam {
  BPM = 0,
  SUBDIVISION = 1,
  SWING = 2,
  GATE = 3,
  DIRECTION = 4,
  LOOP = 5,
  OUTPUT_CHANNEL = 6,
  ACTIVE_PATTERN = 7,
  SWITCH_MODE = 8,
  TRANSPOSE = 9,
  METRONOME = 10,
}

export const CONFIG_PARAM_COUNT = 11;

/** Playback transpose range, in semitones either side of the stored note. */
export const MAX_TRANSPOSE = 24;

export interface SequencerConfig {
  bpm: number;
  subdivision: Subdivision;
  swing: number;
  gate: number;
  direction: Direction;
  loop: boolean;
  outputChannel: Channel;
  switchMode: SwitchMode;
  /** Applied at playback only — patterns are stored untransposed. */
  transpose: number;
  metronome: boolean;
}

export const MAX_STEPS = 64;
export const STEP_SLOT_SIZE = 2; // note + velocity

export const BANK_COUNT = 4;
export const BANK_SIZE = 10; // one per digit key
export const PATTERN_COUNT = BANK_COUNT * BANK_SIZE; // 40

/** Pattern buffer layout: [ 40 patterns x 128 bytes ][ 40 length bytes ] */
export const PATTERN_BYTES = MAX_STEPS * STEP_SLOT_SIZE; // 128
export const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 5120
export const PATTERN_BUFFER_BYTES = LENGTHS_OFFSET + PATTERN_COUNT; // 5160

export const DEFAULT_PATTERN_STEPS = 16;

/** Beats in a bar — the count-in length and the metronome accent period. */
export const BEATS_PER_BAR = 4;

export const DEFAULT_CONFIG: SequencerConfig = {
  bpm: 120,
  subdivision: Subdivision.SIXTEENTH,
  swing: 0,
  gate: 75,
  direction: Direction.FORWARD,
  loop: true,
  outputChannel: 0 as Channel,
  switchMode: SwitchMode.IMMEDIATE,
  transpose: 0,
  metronome: false,
};

// --- Serialization ---

export const STATE_VERSION = 1;

export interface SerializedStep {
  index: number;
  note: number;
  velocity: number;
}

export interface SerializedPattern {
  index: number;
  length: number;
  steps: SerializedStep[];
}

/**
 * Round-trippable sequencer state, shared by localStorage persistence
 * and factory presets. Patterns are stored sparsely — only active steps
 * are listed — which keeps 40 patterns small and readable enough to
 * author presets by hand.
 */
export interface SequencerState {
  version: number;
  config: SequencerConfig;
  patterns: SerializedPattern[];
  activePattern: number;
  bank: number;
  /** Generator settings — optional so older saves and presets still load. */
  scale?: number;
  contour?: number;
}
