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

import {
  DEFAULT_PATTERN_STEPS,
  LANE_BYTES,
  LANE_CAPACITY,
  LANE_COUNT,
  LANE_LENGTHS_OFFSET,
  LENGTHS_OFFSET,
  MAX_STEPS,
  PATTERN_BUFFER_BYTES,
  PATTERN_BYTES,
  PATTERN_COUNT,
} from "./types";

/**
 * The lanes × steps grid, shared with the worklet. A hit is its velocity
 * byte (0 = no hit); several lanes on one step is simply several non-zero
 * bytes — the whole point of the device.
 */
export class DrumPatternBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly hits: Uint8Array;
  private readonly lengths: Uint8Array;
  private readonly laneLengths: Uint8Array;

  constructor() {
    this.buffer = new SharedArrayBuffer(PATTERN_BUFFER_BYTES);
    this.hits = new Uint8Array(this.buffer, 0, LENGTHS_OFFSET);
    this.lengths = new Uint8Array(this.buffer, LENGTHS_OFFSET, PATTERN_COUNT);
    this.laneLengths = new Uint8Array(this.buffer, LANE_LENGTHS_OFFSET, PATTERN_COUNT * LANE_CAPACITY);
    this.lengths.fill(DEFAULT_PATTERN_STEPS);
  }

  private offset(pattern: number, lane: number, step: number): number {
    return pattern * PATTERN_BYTES + lane * LANE_BYTES + step;
  }

  setHit(pattern: number, lane: number, step: number, velocity: number): void {
    if (lane < 0 || lane >= LANE_COUNT || step < 0 || step >= MAX_STEPS) return;
    this.hits[this.offset(pattern, lane, step)] = Math.max(0, Math.min(127, Math.round(velocity)));
  }

  getHit(pattern: number, lane: number, step: number): number {
    return this.hits[this.offset(pattern, lane, step)];
  }

  /** A lane's hits as a fresh array (MAX_STEPS velocities). */
  readLane(pattern: number, lane: number): number[] {
    const start = this.offset(pattern, lane, 0);
    return Array.from(this.hits.subarray(start, start + MAX_STEPS));
  }

  clearLane(pattern: number, lane: number): void {
    const start = this.offset(pattern, lane, 0);
    this.hits.fill(0, start, start + MAX_STEPS);
  }

  hasContent(pattern: number): boolean {
    const start = pattern * PATTERN_BYTES;
    const end = start + LANE_COUNT * LANE_BYTES;
    for (let i = start; i < end; i++) {
      if (this.hits[i] !== 0) return true;
    }
    return false;
  }

  getLength(pattern: number): number {
    return this.lengths[pattern] || DEFAULT_PATTERN_STEPS;
  }

  setLength(pattern: number, steps: number): void {
    this.lengths[pattern] = Math.max(1, Math.min(MAX_STEPS, Math.round(steps)));
  }

  /** 0 = the lane follows the pattern's length. */
  getLaneLength(pattern: number, lane: number): number {
    return this.laneLengths[pattern * LANE_CAPACITY + lane];
  }

  setLaneLength(pattern: number, lane: number, steps: number): void {
    if (lane < 0 || lane >= LANE_COUNT) return;
    this.laneLengths[pattern * LANE_CAPACITY + lane] = Math.max(0, Math.min(MAX_STEPS, Math.round(steps)));
  }

  /** The length the lane actually cycles over. */
  effectiveLaneLength(pattern: number, lane: number): number {
    return this.getLaneLength(pattern, lane) || this.getLength(pattern);
  }

  /** Copies hits, length and lane lengths from one pattern slot to another. */
  copy(from: number, to: number): void {
    if (from === to) return;
    this.hits.copyWithin(to * PATTERN_BYTES, from * PATTERN_BYTES, (from + 1) * PATTERN_BYTES);
    this.lengths[to] = this.lengths[from];
    this.laneLengths.copyWithin(to * LANE_CAPACITY, from * LANE_CAPACITY, (from + 1) * LANE_CAPACITY);
  }

  /** Clears the hits; lengths are the pattern's shape and stay. */
  clear(pattern: number): void {
    this.hits.fill(0, pattern * PATTERN_BYTES, (pattern + 1) * PATTERN_BYTES);
  }

  clearAll(): void {
    this.hits.fill(0);
    this.lengths.fill(DEFAULT_PATTERN_STEPS);
    this.laneLengths.fill(0);
  }
}
