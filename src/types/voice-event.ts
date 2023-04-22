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
export enum VoiceEvent {
  NOTE_ON = "NOTE_ON",
  NOTE_OFF = "NOTE_OFF",
  OSC1 = "OSC1",
  OSC_MIX = "OSC_MIX",
  NOISE = "NOISE",
  OSC2 = "OSC2",
  FILTER = "FILTER",
  ENVELOPE = "ENVELOPE",
  LFO1 = "LFO1",
  LFO2 = "LFO2",
  CUTOFF_MOD = "CUTOFF_MOD",
}
