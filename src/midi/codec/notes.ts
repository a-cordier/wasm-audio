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

export type PitchClass = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

const PITCH_CLASSES: PitchClass[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4_MIDI = 69;
const A4_FREQ = 440;

interface NoteInfo {
  readonly name: string;
  readonly frequency: number;
}

const NOTE_TABLE: NoteInfo[] = new Array(128);

for (let i = 0; i < 128; i++) {
  const pitchClassIndex = i % 12;
  const octave = Math.floor(i / 12) - 1;
  const name = octave >= 0 ? `${PITCH_CLASSES[pitchClassIndex]}${octave}` : "";
  const frequency = A4_FREQ * 2 ** ((i - A4_MIDI) / 12);
  NOTE_TABLE[i] = Object.freeze({ name, frequency });
}

Object.freeze(NOTE_TABLE);

export function noteFrequency(midi: number): number {
  return NOTE_TABLE[midi & 0x7f].frequency;
}

export function noteName(midi: number): string {
  return NOTE_TABLE[midi & 0x7f].name;
}

export function noteInfo(midi: number): NoteInfo {
  return NOTE_TABLE[midi & 0x7f];
}

export function midiToFrequency(midi: number, tuning = A4_FREQ): number {
  return tuning * 2 ** ((midi - A4_MIDI) / 12);
}

export function frequencyToMidi(frequency: number, tuning = A4_FREQ): number {
  return A4_MIDI + 12 * Math.log2(frequency / tuning);
}

export function pitchClass(midi: number): PitchClass {
  return PITCH_CLASSES[midi % 12];
}

export function octave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export { PITCH_CLASSES, NOTE_TABLE };
