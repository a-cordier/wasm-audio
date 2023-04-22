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
import { createMidiOctaves } from "./midi/midi-note";
import { Dispatcher } from "./dispatcher";
import { KeyboardMessage } from "../types/keyboard-messsage";
import { MidiOmniChannel } from "./midi/midi-channels";

const midiOctaves = createMidiOctaves(440);

type PitchClass = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

/* prettier-ignore */
const keyMapping = new Map([
  ["w", midiOctaves[3][0]],     // C3
  ["x", midiOctaves[3][2]],     // D3
  ["c", midiOctaves[3][4]],     // E3
  ["v", midiOctaves[3][5]],     // F3
  ["b", midiOctaves[3][7]],     // G3
  ["n", midiOctaves[3][9]],     // A3
  ["q", midiOctaves[3][11]],    // B3
  ["s", midiOctaves[4][0]],     // C4
  ["d", midiOctaves[4][2]],     // D4
  ["f", midiOctaves[4][4]],     // E4
  ["g", midiOctaves[4][5]],     // F4
  ["h", midiOctaves[4][7]],     // G4
  ["j", midiOctaves[4][9]],     // A4
  ["k", midiOctaves[4][11]],    // B4
  ["l", midiOctaves[5][0]],     // C5
  ["m", midiOctaves[5][2]],     // D5
  ["a", midiOctaves[3][1]],     // C3#
  ["z", midiOctaves[3][3]],     // D3#
  ["e", midiOctaves[3][6]],     // F3#
  ["r", midiOctaves[3][8]],     // G3#
  ["t", midiOctaves[3][10]],     // G3#
  ["y", midiOctaves[4][1]],    // A3#
  ["u", midiOctaves[4][3]],     // C4#
  ["i", midiOctaves[4][6]],     // D4#
  ["o", midiOctaves[4][8]],     // F4#
  ["p", midiOctaves[4][10]],     // G4#
]);

export class KeyBoardController extends Dispatcher {
  private pressedKeys = new Set();

  constructor() {
    super();
    this.registerKeyDownHandler();
    this.registerKeyUpHandler();
  }

  registerKeyDownHandler() {
    document.addEventListener("keydown", ({ key }) => {
      if (keyMapping.has(key) && !this.pressedKeys.has(key)) {
        this.pressedKeys.add(key);
        this.dispatch(KeyboardMessage.NOTE_ON, {
          data: {
            value: keyMapping.get(key).midiValue,
            velocity: 60,
            channel: MidiOmniChannel,
          },
        });
      }
    });
  }

  registerKeyUpHandler() {
    document.addEventListener("keyup", ({ key }) => {
      if (this.pressedKeys.delete(key)) {
        this.dispatch(KeyboardMessage.NOTE_OFF, {
          data: {
            value: keyMapping.get(key).midiValue,
            channel: MidiOmniChannel,
          },
        });
      }
    });
  }
}
