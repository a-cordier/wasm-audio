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

export interface Scale {
  name: string;
  /** Semitone offsets from the root, within one octave. */
  intervals: number[];
}

export const SCALES: Scale[] = [
  { name: "MIN", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: "MAJ", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: "DOR", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: "PHR", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: "MIX", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: "HAR", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: "PEN", intervals: [0, 3, 5, 7, 10] },
  { name: "BLU", intervals: [0, 3, 5, 6, 7, 10] },
  { name: "CHR", intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

/** How pitch moves across the generated hits. */
export const enum Contour {
  FLAT = 0,
  UP = 1,
  DOWN = 2,
  ARCH = 3,
  RANDOM = 4,
}

export const CONTOUR_NAMES = ["FLAT", "UP", "DOWN", "ARCH", "RAND"];

/**
 * Scale degree for hit `index` of `count`. Degrees are unbounded — negative
 * and past-the-octave values are resolved by degreeToNote.
 */
export function contourDegree(contour: Contour, index: number, count: number, scaleSize: number): number {
  switch (contour) {
    case Contour.UP:
      return index;
    case Contour.DOWN:
      return -index;
    case Contour.ARCH: {
      // Climb to the midpoint, then mirror back down.
      const peak = Math.floor((count - 1) / 2);
      return index <= peak ? index : count - 1 - index;
    }
    case Contour.RANDOM:
      // Root up to the octave — wide enough to be interesting, narrow enough
      // to stay singable. Re-pressing GEN rolls a new melody.
      return Math.floor(Math.random() * (scaleSize + 1));
    default:
      return 0;
  }
}

/** Resolves a scale degree to a MIDI note, wrapping octaves in either direction. */
export function degreeToNote(root: number, scale: Scale, degree: number): number {
  const size = scale.intervals.length;
  const octave = Math.floor(degree / size);
  const step = ((degree % size) + size) % size;
  return root + octave * 12 + scale.intervals[step];
}

/** Folds a note back into the playable range by octaves rather than clamping. */
export function foldIntoRange(note: number): number {
  let folded = note;
  while (folded > 127) folded -= 12;
  while (folded < 1) folded += 12;
  return folded;
}
