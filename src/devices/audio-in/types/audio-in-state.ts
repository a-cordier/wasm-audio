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

/**
 * Config, not params: the device has no continuous knobs, so this is a plain
 * merged record rather than the Field/mergeSection idiom.
 */
export interface AudioInState {
  /** The user enabled the input once — restore reacquires silently. */
  enabled: boolean;
  /** Preferred capture device (enumerateDevices id); "" = system default. */
  deviceId: string;
  /** Monitor ON routes the input to the mixer; OFF is the feedback guard. */
  monitor: boolean;
}

export function createAudioInState(partial: Partial<AudioInState> = {}): AudioInState {
  return {
    enabled: partial.enabled === true,
    deviceId: typeof partial.deviceId === "string" ? partial.deviceId : "",
    monitor: partial.monitor === true,
  };
}
