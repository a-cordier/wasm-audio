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
import { MidiEvent, MidiSource, MidiTarget, RouteFilter, Status, Channel, Disposable } from "./types";

export interface KbTarget {
  channel: Channel;
  octaveShift: number;
}

const DEFAULT_VELOCITY = 60;
const DEFAULT_CHANNEL: Channel = 0;

/* prettier-ignore */
const KEY_TO_MIDI = new Map<string, number>([
  ["w", 48],  // C3
  ["x", 50],  // D3
  ["c", 52],  // E3
  ["v", 53],  // F3
  ["b", 55],  // G3
  ["n", 57],  // A3
  ["q", 59],  // B3
  ["s", 60],  // C4
  ["d", 62],  // D4
  ["f", 64],  // E4
  ["g", 65],  // F4
  ["h", 67],  // G4
  ["j", 69],  // A4
  ["k", 71],  // B4
  ["l", 72],  // C5
  ["m", 74],  // D5
  ["a", 49],  // C#3
  ["z", 51],  // D#3
  ["e", 54],  // F#3
  ["r", 56],  // G#3
  ["t", 58],  // A#3
  ["y", 61],  // C#4
  ["u", 63],  // D#4
  ["i", 66],  // F#4
  ["o", 68],  // G#4
  ["p", 70],  // A#4
]);

/**
 * Maps QWERTY keyboard keys to MIDI note events and
 * sends them to connected targets via the MidiSource interface.
 */
export class KeyboardController implements MidiSource {
  private pressedKeys = new Set<string>();
  private connections: { target: MidiTarget; filter?: RouteFilter }[] = [];
  private targets: KbTarget[] = [];
  private event: MidiEvent = {
    status: Status.NOTE_ON,
    channel: DEFAULT_CHANNEL,
    data1: 0,
    data2: DEFAULT_VELOCITY,
    timestamp: 0,
  };

  constructor() {
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }

  setTargets(targets: KbTarget[]): void {
    this.targets = targets;
  }

  connect(target: MidiTarget, filter?: RouteFilter): Disposable {
    const entry = { target, filter };
    this.connections.push(entry);
    return {
      dispose: () => {
        const idx = this.connections.indexOf(entry);
        if (idx !== -1) {
          this.connections[idx] = this.connections[this.connections.length - 1];
          this.connections.pop();
        }
      },
    };
  }

  destroy(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    this.connections.length = 0;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.targets.length === 0) return;

    const baseMidi = KEY_TO_MIDI.get(e.key);
    if (baseMidi === undefined || this.pressedKeys.has(e.key)) return;

    this.pressedKeys.add(e.key);
    this.event.status = Status.NOTE_ON;
    this.event.data2 = DEFAULT_VELOCITY;
    this.event.timestamp = performance.now();

    for (const t of this.targets) {
      this.event.channel = t.channel;
      this.event.data1 = Math.max(0, Math.min(127, baseMidi + t.octaveShift));
      this.emit();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (!this.pressedKeys.delete(e.key)) return;

    const baseMidi = KEY_TO_MIDI.get(e.key);
    if (baseMidi === undefined) return;

    this.event.status = Status.NOTE_OFF;
    this.event.data2 = 0;
    this.event.timestamp = performance.now();

    for (const t of this.targets) {
      this.event.channel = t.channel;
      this.event.data1 = Math.max(0, Math.min(127, baseMidi + t.octaveShift));
      this.emit();
    }
  };

  private emit(): void {
    for (let i = 0, len = this.connections.length; i < len; i++) {
      this.connections[i].target.receive(this.event);
    }
  }
}
