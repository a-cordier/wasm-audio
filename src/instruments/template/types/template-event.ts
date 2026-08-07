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

// The controller dispatches these so the UI can mirror state (e.g. after a
// preset load) without reaching into the controller's internals.
export enum TemplateEvent {
  NOTE_ON = "template:note-on",
  NOTE_OFF = "template:note-off",
  OSC = "template:osc",
  AMP = "template:amp",
}
