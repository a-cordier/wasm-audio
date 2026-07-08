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
import { SelectOptions } from "./select-option";

function channelLabel(n: number): string {
  return `CHANNEL:${n < 10 ? `0${n}` : `${n}`}`;
}

const MidiChannels = [
  { value: -1, name: "CHANNEL:ALL" },
  ...Array.from({ length: 16 }, (_, i) => ({ value: i, name: channelLabel(i + 1) })),
];

export const MidiChannelOptions = new SelectOptions(MidiChannels);
