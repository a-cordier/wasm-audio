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

import { QUALITY_INTERVALS } from "./chords";
import {
  DEFAULT_PATTERN_STEPS,
  DEGREE_MASK,
  LENGTHS_OFFSET,
  MAX_OCT_OFFSET,
  MAX_STEPS,
  OCT_BIAS,
  OCT_MASK,
  OCT_SHIFT,
  PATTERN_BUFFER_BYTES,
  PATTERN_BYTES,
  PATTERN_COUNT,
  Quality,
  STEP_SLOT_SIZE,
  TIE_BIT,
} from "./types";

export interface ChordStepData {
  /** Scale degree 1-7; 0 = step off. */
  degree: number;
  /** Octave offset in octaves, -2..+2. */
  octave: number;
  velocity: number;
  /** Held open into the next step (chord tie). */
  tie: boolean;
  quality: Quality;
}

export const EMPTY_STEP: ChordStepData = { degree: 0, octave: 0, velocity: 0, tie: false, quality: Quality.DIATONIC };

/**
 * SharedArrayBuffer-backed chord-pattern storage for all 40 patterns.
 *
 * Layout:
 *   [0 .. 10239]      40 patterns x 64 slots x 4 bytes
 *                       byte 0: degree (bits 0-2, 0 = off) | biased octave (bits 3-5)
 *                       byte 1: velocity (bits 0-6) + tie (bit 7)
 *                       byte 2: quality (0 = diatonic .. 9)
 *                       byte 3: reserved
 *   [10240 .. 10279]  40 length bytes (1-64 steps per pattern)
 *
 * Main thread writes when the user edits; the worklet reads the active
 * pattern's slots and length at step boundaries. "Active" is defined by the
 * degree bits alone, so clearStep zeroes ALL four bytes — a stale octave or
 * quality must never resurrect with the next paint.
 */
export class ChordPatternBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly view: Uint8Array;
  private readonly lengths: Uint8Array;

  constructor();
  constructor(buffer: SharedArrayBuffer);
  constructor(arg?: SharedArrayBuffer) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = new SharedArrayBuffer(PATTERN_BUFFER_BYTES);
    }
    this.view = new Uint8Array(this.buffer, 0, LENGTHS_OFFSET);
    this.lengths = new Uint8Array(this.buffer, LENGTHS_OFFSET, PATTERN_COUNT);

    if (!(arg instanceof SharedArrayBuffer)) {
      this.lengths.fill(DEFAULT_PATTERN_STEPS);
    }
  }

  private offset(pattern: number, index: number): number {
    return pattern * PATTERN_BYTES + index * STEP_SLOT_SIZE;
  }

  setStep(
    pattern: number,
    index: number,
    degree: number,
    octave: number,
    velocity: number,
    tie = false,
    quality: Quality = Quality.DIATONIC
  ): void {
    const offset = this.offset(pattern, index);
    const deg = Math.max(0, Math.min(7, Math.round(degree))) & DEGREE_MASK;
    const oct = Math.max(-MAX_OCT_OFFSET, Math.min(MAX_OCT_OFFSET, Math.round(octave))) + OCT_BIAS;
    this.view[offset] = deg | ((oct & OCT_MASK) << OCT_SHIFT);
    this.view[offset + 1] = (velocity & 0x7f) | (tie ? TIE_BIT : 0);
    // Clamp against the quality table itself, so appending shapes there is
    // the whole change (an out-of-range byte would fall back to diatonic in
    // the processor anyway, but a clean buffer round-trips the UI).
    this.view[offset + 2] = Math.max(0, Math.min(QUALITY_INTERVALS.length - 1, Math.round(quality)));
    this.view[offset + 3] = 0;
  }

  clearStep(pattern: number, index: number): void {
    const offset = this.offset(pattern, index);
    this.view[offset] = 0;
    this.view[offset + 1] = 0;
    this.view[offset + 2] = 0;
    this.view[offset + 3] = 0;
  }

  getStep(pattern: number, index: number): ChordStepData {
    const offset = this.offset(pattern, index);
    const b0 = this.view[offset];
    const velByte = this.view[offset + 1];
    return {
      degree: b0 & DEGREE_MASK,
      octave: ((b0 >> OCT_SHIFT) & OCT_MASK) - OCT_BIAS,
      velocity: velByte & 0x7f,
      tie: (velByte & TIE_BIT) !== 0,
      quality: this.view[offset + 2] as Quality,
    };
  }

  /** Toggles the per-step tie flag without disturbing the rest of the step. */
  setTie(pattern: number, index: number, tie: boolean): void {
    const offset = this.offset(pattern, index) + 1;
    this.view[offset] = (this.view[offset] & 0x7f) | (tie ? TIE_BIT : 0);
  }

  getTie(pattern: number, index: number): boolean {
    return (this.view[this.offset(pattern, index) + 1] & TIE_BIT) !== 0;
  }

  isStepActive(pattern: number, index: number): boolean {
    return (this.view[this.offset(pattern, index)] & DEGREE_MASK) !== 0;
  }

  /** True when the pattern holds at least one active step. */
  hasContent(pattern: number): boolean {
    const start = pattern * PATTERN_BYTES;
    for (let i = 0; i < MAX_STEPS; i++) {
      if ((this.view[start + i * STEP_SLOT_SIZE] & DEGREE_MASK) !== 0) return true;
    }
    return false;
  }

  getLength(pattern: number): number {
    return this.lengths[pattern] || DEFAULT_PATTERN_STEPS;
  }

  setLength(pattern: number, steps: number): void {
    this.lengths[pattern] = Math.max(1, Math.min(MAX_STEPS, Math.round(steps)));
  }

  /** Copies steps and length from one pattern slot to another. */
  copy(from: number, to: number): void {
    if (from === to) return;
    this.view.copyWithin(to * PATTERN_BYTES, from * PATTERN_BYTES, (from + 1) * PATTERN_BYTES);
    this.lengths[to] = this.lengths[from];
  }

  clear(pattern: number): void {
    this.view.fill(0, pattern * PATTERN_BYTES, (pattern + 1) * PATTERN_BYTES);
  }

  clearAll(): void {
    this.view.fill(0);
    this.lengths.fill(DEFAULT_PATTERN_STEPS);
  }
}
