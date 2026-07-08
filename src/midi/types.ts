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

export const enum Status {
  NOTE_OFF = 0x08,
  NOTE_ON = 0x09,
  POLY_AFTERTOUCH = 0x0a,
  CONTROL_CHANGE = 0x0b,
  PROGRAM_CHANGE = 0x0c,
  CHANNEL_AFTERTOUCH = 0x0d,
  PITCH_BEND = 0x0e,
}

export const enum SystemStatus {
  SYSEX_START = 0xf0,
  MTC = 0xf1,
  SONG_POSITION = 0xf2,
  SONG_SELECT = 0xf3,
  TUNE_REQUEST = 0xf6,
  SYSEX_END = 0xf7,
  TIMING_CLOCK = 0xf8,
  START = 0xfa,
  CONTINUE = 0xfb,
  STOP = 0xfc,
  ACTIVE_SENSING = 0xfe,
  SYSTEM_RESET = 0xff,
}

export type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const OMNI_CHANNEL = 16 as const;
export type OmniChannel = typeof OMNI_CHANNEL;

export interface MidiEvent {
  status: Status;
  channel: Channel;
  data1: number;
  data2: number;
  timestamp: number;
}

export interface NoteData {
  note: number;
  velocity: number;
  frequency: number;
  name: string;
  channel: Channel;
}

export interface ControlChangeData {
  control: number;
  value: number;
  channel: Channel;
}

export interface PitchBendData {
  value: number;
  channel: Channel;
}

export interface ProgramChangeData {
  program: number;
  channel: Channel;
}

export interface AftertouchData {
  value: number;
  note?: number;
  channel: Channel;
}

export type MidiHandler = (event: MidiEvent) => void;

export interface RouteFilter {
  channel?: Channel | Channel[];
  status?: Status | Status[];
}

export interface Disposable {
  dispose(): void;
}

export interface MidiSource {
  connect(target: MidiTarget, filter?: RouteFilter): Disposable;
}

export interface MidiTarget {
  receive(event: MidiEvent): void;
}
