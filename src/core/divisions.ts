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
 * Musical cycle lengths for tempo-synced modulation (a DIV stepper stores the
 * index; 1B = 4 beats). ONE list for the whole app: MOTION's lane and every
 * instrument LFO step the same divisions, so "1/8" means the same thing on
 * every panel. The audio engines mirror the beats column by hand (dsp/lfo.h
 * kDivBeats, the JS processors' DIV_BEATS) — keep all three in step.
 */
export const DIVISIONS = [
  { label: "4B", beats: 16 },
  { label: "2B", beats: 8 },
  { label: "1B", beats: 4 },
  { label: "1/2", beats: 2 },
  { label: "1/4", beats: 1 },
  { label: "1/8", beats: 0.5 },
  { label: "1/16", beats: 0.25 },
  { label: "1/32", beats: 0.125 },
] as const;
