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

import { Quality } from "./types";

/**
 * Main-thread music tables (the UI and preset side). The processor mirrors
 * these BY HAND — dischord-processor.js cannot import TypeScript — so any
 * change here must land in both files.
 *
 * Deliberately local rather than shared with sequels/scales.ts: sequels'
 * tables are a chromatic-contour vocabulary for its Euclid generator, while
 * these are strictly heptatonic (7 intervals each) because chords are built
 * by stacking thirds DEGREE-wise — idx % 7 walks the scale, idx / 7 carries
 * the octave. A pentatonic or chromatic row would break that arithmetic.
 */

export const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const SCALE_NAMES = ["MAJ", "MIN", "HM", "MM", "DOR", "PHR", "LYD", "MIX", "LOC"] as const;

export const SCALE_INTERVALS: ReadonlyArray<readonly number[]> = [
  [0, 2, 4, 5, 7, 9, 11], // MAJ — ionian
  [0, 2, 3, 5, 7, 8, 10], // MIN — natural minor
  [0, 2, 3, 5, 7, 8, 11], // HM  — harmonic minor
  [0, 2, 3, 5, 7, 9, 11], // MM  — melodic minor (ascending)
  [0, 2, 3, 5, 7, 9, 10], // DOR
  [0, 1, 3, 5, 7, 8, 10], // PHR
  [0, 2, 4, 6, 7, 9, 11], // LYD
  [0, 2, 4, 5, 7, 9, 10], // MIX
  [0, 1, 3, 5, 6, 8, 10], // LOC
];

export const QUALITY_NAMES = [
  "DIA", "MAJ", "MIN", "DOM7", "MAJ7", "MIN7", "DIM", "AUG", "SUS2", "SUS4",
  // The weird pack (appended 2026-11-06 — indices are baked into saved steps).
  "DIM7", "M7B5", "MM7", "6", "MIN6", "6/9", "ADD9", "9", "MAJ9", "MIN9",
  "7B9", "7#9", "13", "5",
] as const;

/** Short tags for step cells (DIA steps show no tag — diatonic is the default). */
export const QUALITY_TAGS = [
  "", "M", "m", "7", "M7", "m7", "o", "+", "s2", "s4",
  "o7", "ø", "mM", "6", "m6", "69", "a9", "9", "M9", "m9",
  "b9", "#9", "13", "5",
] as const;

/** Interval shapes for explicit qualities; index 0 (DIATONIC) stacks scale
 * thirds instead and has no fixed shape. Append-only — the quality byte in
 * saved patterns indexes straight into this table. */
export const QUALITY_INTERVALS: ReadonlyArray<readonly number[] | null> = [
  null, // DIATONIC
  [0, 4, 7], // MAJ
  [0, 3, 7], // MIN
  [0, 4, 7, 10], // DOM7
  [0, 4, 7, 11], // MAJ7
  [0, 3, 7, 10], // MIN7
  [0, 3, 6], // DIM
  [0, 4, 8], // AUG
  [0, 2, 7], // SUS2
  [0, 5, 7], // SUS4
  [0, 3, 6, 9], // DIM7 — fully diminished
  [0, 3, 6, 10], // M7B5 — half-diminished (ø7)
  [0, 3, 7, 11], // MM7 — minor-major 7
  [0, 4, 7, 9], // 6
  [0, 3, 7, 9], // MIN6
  [0, 4, 7, 9, 14], // 6/9
  [0, 4, 7, 14], // ADD9 — the 9th without the 7th
  [0, 4, 7, 10, 14], // 9 — dominant 9th
  [0, 4, 7, 11, 14], // MAJ9
  [0, 3, 7, 10, 14], // MIN9
  [0, 4, 7, 10, 13], // 7B9
  [0, 4, 7, 10, 15], // 7#9 — the Hendrix chord
  [0, 4, 10, 14, 21], // 13 — 3rd, b7, 9th, 13th (5th and 11th omitted)
  [0, 7], // 5 — power chord
];

/** C3 = MIDI 48 anchors degree I at a comfortable pad register. */
export const CHORD_BASE_NOTE = 48;

/** Whole-chord fold bounds (intervals preserved; the processor mirrors them). */
export const CHORD_NOTE_MIN = 24;
export const CHORD_NOTE_MAX = 120;

/**
 * Builds the chord for a step in root position, ascending — the same math
 * the processor runs at schedule time, for tooltips and preset sanity.
 */
export function buildChord(
  degree: number,
  octave: number,
  quality: Quality,
  key: number,
  scaleIndex: number,
  voices: number
): number[] {
  const iv = SCALE_INTERVALS[scaleIndex] ?? SCALE_INTERVALS[0];
  const di = Math.max(0, Math.min(6, degree - 1));
  const base = CHORD_BASE_NOTE + key + 12 * octave;
  const chord: number[] = [];

  const shape = QUALITY_INTERVALS[quality];
  if (!shape) {
    for (let k = 0; k < voices; k++) {
      const idx = di + 2 * k;
      chord.push(base + 12 * Math.floor(idx / 7) + iv[idx % 7]);
    }
  } else {
    const root = base + iv[di];
    for (const interval of shape) chord.push(root + interval);
  }

  while (chord[chord.length - 1] > CHORD_NOTE_MAX) for (let k = 0; k < chord.length; k++) chord[k] -= 12;
  while (chord[0] < CHORD_NOTE_MIN) for (let k = 0; k < chord.length; k++) chord[k] += 12;
  return chord;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI note name under the house convention (C4 = 60). */
export function noteName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

/** Human chord label for tooltips: root name + quality tag ("Am7", "Gsus4"). */
export function chordLabel(
  degree: number,
  octave: number,
  quality: Quality,
  key: number,
  scaleIndex: number,
  voices: number
): string {
  const notes = buildChord(degree, octave, quality, key, scaleIndex, voices);
  const root = NOTE_NAMES[notes[0] % 12];
  if (quality !== Quality.DIATONIC) return `${root}${QUALITY_TAGS[quality]}`;
  // Name the diatonic stack from its lower intervals.
  const third = notes[1] - notes[0];
  const seventh = voices >= 4 ? notes[3] - notes[0] : -1;
  const minor = third === 3;
  if (seventh === 11) return `${root}${minor ? "mM7" : "M7"}`;
  if (seventh === 10) return `${root}${minor ? "m7" : "7"}`;
  return `${root}${minor ? "m" : ""}`;
}
