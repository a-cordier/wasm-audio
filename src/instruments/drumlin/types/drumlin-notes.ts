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

// GM-style note → voice map. The processor keeps its own untyped copy of this
// switch (worklets can't import TS) — change BOTH or pads and audio disagree.
// Toms span three note pairs at −5/0/+5 semitones; unmapped notes are ignored.

export type DrumVoice = "kick" | "snare" | "clap" | "ch" | "oh" | "tom" | "rim" | "ride" | "crash";

/** Canonical note per pad (the one the panel triggers). */
export const PAD_NOTES: Record<DrumVoice, number> = {
  kick: 36,
  snare: 38,
  clap: 39,
  ch: 42,
  oh: 46,
  tom: 45,
  rim: 37,
  ride: 51,
  crash: 49,
};

export function voiceForNote(note: number): DrumVoice | null {
  switch (note) {
    case 35:
    case 36:
      return "kick";
    case 38:
    case 40:
      return "snare";
    case 39:
      return "clap";
    case 42:
    case 44: // pedal hat plays closed — and chokes the open hat, like 42
      return "ch";
    case 46:
      return "oh";
    case 41:
    case 43:
    case 45:
    case 47:
    case 48:
    case 50:
      return "tom";
    case 37:
      return "rim";
    case 49:
    case 57:
      return "crash";
    case 51:
    case 53:
      return "ride";
    default:
      return null;
  }
}
