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

// The controller dispatches these so the UI can mirror state (preset loads,
// MIDI-learn/automation writes) without reaching into the controller.
// TRIGGER carries { voice, velocity } and drives the pad flash.
export enum DrumlinEvent {
  TRIGGER = "drumlin:trigger",
  KICK = "drumlin:kick",
  SNARE = "drumlin:snare",
  CLAP = "drumlin:clap",
  HATS = "drumlin:hats",
  TOM = "drumlin:tom",
  RIM = "drumlin:rim",
  RIDE = "drumlin:ride",
  CRASH = "drumlin:crash",
  OUT = "drumlin:out",
}
