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
 * Steps per beat. Chord progressions move slower than basslines, so the
 * table extends below the beat (1/1 = one step per bar at 4/4) instead of
 * above 1/16. All values are Float32-exact, so the config buffer round-trips
 * them without comparison drift.
 */
export const SUBDIVISIONS = [0.25, 0.5, 1, 2, 4] as const;
export const SUBDIVISION_NAMES = ["1/1", "1/2", "1/4", "1/8", "1/16"] as const;
export type Subdivision = (typeof SUBDIVISIONS)[number];

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

/**
 * Per-step chord quality. DIATONIC stacks thirds from the device scale
 * (VOICES deep); every other value is an explicit interval shape rooted on
 * the step's scale degree — the escape hatch out of the key.
 */
export const enum Quality {
  DIATONIC = 0,
  MAJ = 1,
  MIN = 2,
  DOM7 = 3,
  MAJ7 = 4,
  MIN7 = 5,
  DIM = 6,
  AUG = 7,
  SUS2 = 8,
  SUS4 = 9,
}

/** How chords are voiced: literal stacked position, or the inversion that
 * moves least from the previous chord (greedy voice-leading). */
export const enum Voicing {
  ROOT = 0,
  SMOOTH = 1,
}

/**
 * Note-emission order inside a chord. A monophonic target plays the LAST
 * note it receives, so LEAD (root first, top last) makes it track the top
 * voice and BASS (top first, root last) makes it track the root. Polyphonic
 * targets are unaffected.
 */
export const enum EmitOrder {
  LEAD = 0,
  BASS = 1,
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
  METRONOME = 9,
  KEY = 10,
  SCALE = 11,
  VOICES = 12,
  VOICING = 13,
  ORDER = 14,
  STRUM = 15,
}

export const CONFIG_PARAM_COUNT = 16;

/** STRUM knob ceiling: the gap between consecutive raked notes, in
 * milliseconds (a guitar-style constant per-note gap, so bigger chords rake
 * longer; the processor clamps the whole rake inside the step). */
export const MAX_STRUM_MS = 60;

export interface DischordConfig {
  bpm: number;
  subdivision: Subdivision;
  swing: number;
  gate: number;
  direction: Direction;
  loop: boolean;
  outputChannel: Channel;
  switchMode: SwitchMode;
  metronome: boolean;
  /** Key root, 0 = C .. 11 = B. */
  key: number;
  /** Index into SCALE_INTERVALS (chords.ts). */
  scale: number;
  /** Diatonic stack height: 3 = triad, 4 = 7th, 5 = 9th. */
  voices: number;
  voicing: Voicing;
  order: EmitOrder;
  /** Strum gap between raked notes, ms (0 = all notes on the step frame). */
  strum: number;
}

export const MAX_STEPS = 64;
// Four bytes per step:
//   byte 0  bits 0-2 scale degree (0 = step off, 1-7)
//           bits 3-5 octave offset, biased (stored 0-4 = -2..+2)
//   byte 1  bits 0-6 velocity; bit 7 carries the per-step TIE flag — the
//           sequels slide idiom (flag in the velocity byte's free high bit),
//           generalized from one gliding note to a held chord.
//   byte 2  quality (0 = diatonic .. 9 = SUS4)
//   byte 3  reserved (always 0)
export const STEP_SLOT_SIZE = 4;
export const TIE_BIT = 0x80;
export const DEGREE_MASK = 0x07;
export const OCT_SHIFT = 3;
export const OCT_MASK = 0x07;
export const OCT_BIAS = 2;
export const MAX_OCT_OFFSET = 2;

export const BANK_COUNT = 4;
export const BANK_SIZE = 10; // one per digit key
export const PATTERN_COUNT = BANK_COUNT * BANK_SIZE; // 40
/** The pattern address vocabulary ("B1" = bank B, pad 1) — shared by the
 * selector's bank buttons, its address LCD, and patternLabel (song mode). */
export const BANK_NAMES = ["A", "B", "C", "D"] as const;

/** Pattern buffer layout: [ 40 patterns x 256 bytes ][ 40 length bytes ] */
export const PATTERN_BYTES = MAX_STEPS * STEP_SLOT_SIZE; // 256
export const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 10240
export const PATTERN_BUFFER_BYTES = LENGTHS_OFFSET + PATTERN_COUNT; // 10280

export const DEFAULT_PATTERN_STEPS = 16;

/** Beats in a bar — the metronome accent period. */
export const BEATS_PER_BAR = 4;

export const DEFAULT_CONFIG: DischordConfig = {
  bpm: 120,
  subdivision: 2,
  swing: 0,
  gate: 80,
  direction: Direction.FORWARD,
  loop: true,
  outputChannel: 0 as Channel,
  switchMode: SwitchMode.IMMEDIATE,
  metronome: false,
  key: 0,
  scale: 0,
  voices: 3,
  voicing: Voicing.ROOT,
  order: EmitOrder.LEAD,
  strum: 0,
};

// --- Serialization ---

export const STATE_VERSION = 1;

export interface SerializedChordStep {
  index: number;
  degree: number;
  velocity: number;
  /** Octave offset in octaves (-2..+2); omitted when 0. */
  octave?: number;
  /** Held open into the next step (chord tie); omitted when false. */
  tie?: boolean;
  /** Quality override; omitted when diatonic. */
  quality?: number;
}

export interface SerializedChordPattern {
  index: number;
  length: number;
  steps: SerializedChordStep[];
}

/**
 * Round-trippable device state, shared by localStorage persistence and
 * factory presets. Patterns are stored sparsely — only active steps are
 * listed, with default fields omitted — which keeps 40 patterns small and
 * readable enough to author presets by hand.
 */
export interface DischordState {
  version: number;
  config: DischordConfig;
  patterns: SerializedChordPattern[];
  activePattern: number;
  bank: number;
}
