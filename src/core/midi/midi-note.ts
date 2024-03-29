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
type PitchClass =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export interface Note {
  pitchClass: PitchClass;
  octave: number;
  frequency: number;
  midiValue: number;
  velocity: number;
}

/**
 * pitchClasses provides the chromatic scale symbols exported as a list:
 * 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
 * @type {Array}
 */
export const pitchClasses = Object.freeze([
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]) as PitchClass[];

/**
 * Computes the frequency value of the given midi note
 * with custom tuning
 * @param {number} midiValue - Midi value (0 to 127) of the note
 * @param {number} tuning - The frequency associated to midi value 69 (A4)
 * @returns {number|function} The computed frequency or a computing function
 */
export function midiToFrequency(midiValue: number, tuning = 440): number {
  if (midiValue >= 0 && midiValue <= 127) {
    return tuning * 2 ** ((midiValue - 69) / 12);
  }
  return null;
}

/**
 * Computes the midiValue value of the given note in the given octave
 * @param {string} pitchClass - Note in scale (english notation)
 * @param {number} octave - Octave value for note
 */
export function noteToMidi(pitchClass: PitchClass, octave: number): number {
  return (octave + 1) * 12 + pitchClasses.indexOf(pitchClass);
}

/**
 * Computes the pitch class as a string representation and octave for the given midi value
 * @param {number} midiValue - midi value for note
 * @returns {Note}
 */
export function midiToNote({ value, velocity = 100 }): Note {
  const pitchClassIndex = (value - 12 * 2) % 12;
  const octave = (value - pitchClassIndex - 12) / 12;
  return {
    pitchClass: pitchClasses[pitchClassIndex],
    octave,
    frequency: midiToFrequency(value),
    midiValue: value,
    velocity,
  };
}

/**
 * Computes the pitch class as a number from 0 to 11
 * @param midiValue - midi value for note
 * @returns {number}
 */
export function computePitchClassIndex(midiValue: number): number {
  return (midiValue - 12 * 2) % 12;
}

/**
 *
 * @param midiValue - midi value for note
 * @returns {number} the octave in which the pitchClass for this midi value lies
 */
export function computeOctave(midiValue: number): number {
  return (midiValue - computePitchClassIndex(midiValue) - 12) / 12;
}

/**
 * Computes the frequency value of the given midi note
 * with custom, optional tuning (default value for tuning is 440 for A4)
 * @param {number} frequency - The frequency of the note
 * @param {number} tuning - The frequency associated to midi value 69 (A4)
 * @returns {number} The computed frequency
 */
export function frequencyToMidi(
  frequency: number,
  tuning = 440
): number | null {
  if (frequency >= 8 && frequency < 3952) {
    return 69 + 12 * Math.log2(frequency / tuning);
  }
  return null;
}

/**
 * Computes the frequency value of the given note in the given octave
 * @param {string} pitchClass - Note in scale (english notation)
 * @param {number} octave - Octave value for note
 * @param {number} tuning - The frequency associated to midi value 69 (A4)
 */
export function symbolToFrequency(
  pitchClass: PitchClass,
  octave: number,
  tuning = 440
): number {
  return midiToFrequency(noteToMidi(pitchClass, octave), tuning);
}

/**
 * Pre-computes all the notes within a given octave
 * @param {number} octave - Octave value for note
 * @param {number} tuning - The frequency associated to midi value 69 (A4)
 */
export function createNotes(octave, tuning = 440): Note[] {
  return pitchClasses
    .map((pitchClass) => {
      return {
        pitchClass,
        octave,
        frequency: symbolToFrequency(pitchClass, octave, tuning),
        midiValue: noteToMidi(pitchClass, octave),
        velocity: 127, 
      };
    })
    .filter((note) => note.frequency !== null);
}

/**
 * Pre-computes all the octaves within the midi notes range [16:127]
 * @param {number} tuning - The frequency associated to midi value 69 (A4)
 */
export function createMidiOctaves(tuning = 440): Note[][] {
  const octaves = [];
  for (let i = 0; i < 10; ++i) {
    octaves.push(createNotes(i, tuning));
  }
  return octaves;
}
