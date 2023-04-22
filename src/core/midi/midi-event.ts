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
import { newMidiMessage } from "./midi-message";
import { MetaEvent } from "./meta-event";
import {
  isMetaEvent,
  isSysexMessage,
  getVariableLengthQuantity,
} from "./midi-util";
import { SysexMessage } from "./sysex-message";

export function MidiEvent(data, offset) {
  /* eslint-disable no-param-reassign */
  const deltaTime = getVariableLengthQuantity(data, offset);
  const event = {
    delta: deltaTime.value,
  };
  offset = deltaTime.next;
  if (isMetaEvent(data, offset)) {
    return Object.assign(MetaEvent(data, offset), event);
  }
  if (isSysexMessage(data, offset)) {
    // throw new Error('Sysex messages are not implemented yet')
    return SysexMessage(data, offset);
  }
  return Object.assign(newMidiMessage(data, offset), event);
}
