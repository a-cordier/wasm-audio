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
import { getBytes, getVariableLengthQuantity } from "./midi-util";

export function SysexMessage(data, offset) {
  /* eslint-disable no-param-reassign */
  offset += 1;
  const length = getVariableLengthQuantity(data, offset);
  offset = length.next;
  const dataBytes = getBytes(data, offset, length.value);
  offset += length.value;
  return {
    type: 0xf0,
    data: dataBytes,
    next: offset,
  };
}
