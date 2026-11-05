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

// Each voice receives ONE configurable note (state fields, GM defaults — the
// panel's per-zone steppers edit them; tom answers its base ±2 at ∓/±5 st).
// The processor resolves notes itself from params 29–37; the controller's
// voicesForNote mirror only decides which pads flash. Two voices on the same
// note BOTH fire — layering is a feature. The old multi-alias GM map (35, 40,
// 44, 50, 53, 57) retired when the selectors landed.

export type DrumVoice =
  | "kick"
  | "snare"
  | "clap"
  | "ch"
  | "oh"
  | "tom"
  | "rim"
  | "ride"
  | "crash";
