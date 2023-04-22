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
import { MidiControlID } from "./midi-learn-options";

interface MidiMessageData {
  channel: number;
  value: number;
  control?: number;
  velocity?: number;
}

export interface MidiMessage {
  status: number;
  data: MidiMessageData;
  isMidiLearning: boolean;
  controlID: MidiControlID | undefined;
}

export enum MidiMessageEvent {
  NOTE_ON = "NOTE_ON",
  NOTE_OFF = "NOTE_OFF",
  NOTE_CHANGE = "NOTE_CHANGE",
  CONTROL_CHANGE = "CONTROL_CHANGE",
}
