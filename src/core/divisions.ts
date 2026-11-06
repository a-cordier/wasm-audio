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
 * index; labels are BAR fractions, 1B = 4 beats, so "3/8" = a dotted quarter
 * and "1/6" = a quarter triplet). ONE list for the whole app: MOTION's lane
 * and every instrument LFO step the same divisions, so "1/8" means the same
 * thing on every panel. The audio engines mirror the beats column by hand
 * (dsp/lfo.h kDivBeats, the JS processors' DIV_BEATS) — keep them in step.
 *
 * APPEND-ONLY: stored DIV values are indices into this array (sessions and
 * presets bake them in), so new entries land at the END and steppers walk
 * DIVISION_ORDER — the musical sort — never this array's raw order.
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
  // Appended: dotted (3/x) and triplet (1/6-family) cycles.
  { label: "3/4", beats: 3 },
  { label: "3/8", beats: 1.5 },
  { label: "1/6", beats: 2 / 3 },
  { label: "3/16", beats: 0.75 },
  { label: "1/12", beats: 1 / 3 },
  { label: "1/24", beats: 1 / 6 },
] as const;

/** Index order for steppers, beats descending — 4B … 3/8 … 1/4 … 1/32. */
export const DIVISION_ORDER: readonly number[] = [...DIVISIONS.keys()].sort(
  (a, b) => DIVISIONS[b].beats - DIVISIONS[a].beats
);

/** Step a STORED division index one slot through the musical order,
 * clamping at both ends (the MOTION stepper convention). */
export function stepDivision(index: number, delta: number): number {
  const safe = Math.max(0, Math.min(DIVISIONS.length - 1, Math.round(index)));
  const pos = DIVISION_ORDER.indexOf(safe);
  const next = Math.max(0, Math.min(DIVISION_ORDER.length - 1, pos + delta));
  return DIVISION_ORDER[next];
}
