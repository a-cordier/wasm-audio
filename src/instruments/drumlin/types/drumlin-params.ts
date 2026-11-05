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

// The param id / count. Pure-JS worklet: must match the PARAM_COUNT in
// drumlin-processor.js (the check:conventions script asserts it).
// Append only — never renumber, presets store the raw indices.
export const DrumlinParamId = Object.freeze({
  KICK_TUNE: 0,
  KICK_PUNCH: 1,
  KICK_DECAY: 2,
  KICK_LEVEL: 3,
  SNARE_TUNE: 4,
  SNARE_SNAP: 5,
  SNARE_DECAY: 6,
  SNARE_LEVEL: 7,
  CLAP_TONE: 8,
  CLAP_DECAY: 9,
  CLAP_LEVEL: 10,
  HAT_TONE: 11,
  CH_DECAY: 12,
  CH_LEVEL: 13,
  OH_DECAY: 14,
  OH_LEVEL: 15,
  TOM_TUNE: 16,
  TOM_DECAY: 17,
  TOM_LEVEL: 18,
  ACCENT: 19,
  RIM_TUNE: 20,
  RIM_DECAY: 21,
  RIM_LEVEL: 22,
  RIDE_TONE: 23,
  RIDE_DECAY: 24,
  RIDE_LEVEL: 25,
  CRASH_TONE: 26,
  CRASH_DECAY: 27,
  CRASH_LEVEL: 28,
  PARAM_COUNT: 29,
});
