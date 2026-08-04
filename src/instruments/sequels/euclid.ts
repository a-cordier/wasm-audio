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
 * Euclidean rhythm generator (Bjorklund's algorithm).
 *
 * Distributes `pulses` hits as evenly as possible across `steps` positions —
 * E(3,8) gives the tresillo x..x..x., E(5,8) gives x.xx.xx. Combined with
 * per-pattern lengths, different (pulses, steps) pairs in adjacent slots are
 * what make polymetric switching interesting.
 */
export function euclideanPattern(steps: number, pulses: number): boolean[] {
  if (steps <= 0) return [];
  if (pulses <= 0) return new Array(steps).fill(false);
  if (pulses >= steps) return new Array(steps).fill(true);

  let a: boolean[][] = Array.from({ length: pulses }, () => [true]);
  let b: boolean[][] = Array.from({ length: steps - pulses }, () => [false]);

  // Each round pairs off the shorter list against the longer one; the leftover
  // becomes the new remainder. It terminates when at most one remainder group
  // is left — the step count bounds the iterations, the guard is belt-and-braces.
  for (let guard = 0; b.length > 1 && guard < steps; guard++) {
    const n = Math.min(a.length, b.length);
    const merged: boolean[][] = [];
    for (let i = 0; i < n; i++) merged.push([...a[i], ...b[i]]);

    const remainder = a.length > n ? a.slice(n) : b.slice(n);
    a = merged;
    b = remainder;
  }

  return [...a, ...b].flat();
}

/**
 * Rotates a pattern left by `by` positions, wrapping. Rotation is the third
 * Euclidean parameter: E(3,8) is `x..x..x.`, rotated once it is `.x..x..x`,
 * a materially different groove from the same pulse count.
 */
export function rotate(hits: boolean[], by: number): boolean[] {
  const n = hits.length;
  if (n === 0) return hits;
  const shift = ((by % n) + n) % n;
  if (shift === 0) return hits;
  return [...hits.slice(n - shift), ...hits.slice(0, n - shift)];
}
