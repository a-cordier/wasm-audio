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
  LENGTHS_OFFSET,
  MAX_STEPS,
  PATTERN_BUFFER_BYTES,
  PATTERN_BYTES,
  PATTERN_COUNT,
  STEP_SLOT_SIZE,
} from "./types";

/**
 * SharedArrayBuffer-backed pattern storage for all 40 patterns.
 *
 * Layout:
 *   [0 .. 5119]     40 patterns x 64 slots x 2 bytes
 *                     slot[n * 128 + i * 2]     = MIDI note (0 = step off, 1-127 = active)
 *                     slot[n * 128 + i * 2 + 1] = velocity (0-127)
 *   [5120 .. 5159]  40 length bytes (1-64 steps per pattern)
 *
 * Main thread writes when the user edits or records; the worklet reads the
 * active pattern's slots and length at step boundaries.
 */
export class PatternBuffer {
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

  setStep(pattern: number, index: number, note: number, velocity: number): void {
    const offset = this.offset(pattern, index);
    this.view[offset] = note & 0x7f;
    this.view[offset + 1] = velocity & 0x7f;
  }

  clearStep(pattern: number, index: number): void {
    const offset = this.offset(pattern, index);
    this.view[offset] = 0;
    this.view[offset + 1] = 0;
  }

  getStep(pattern: number, index: number): { note: number; velocity: number } {
    const offset = this.offset(pattern, index);
    return {
      note: this.view[offset],
      velocity: this.view[offset + 1],
    };
  }

  isStepActive(pattern: number, index: number): boolean {
    return this.view[this.offset(pattern, index)] !== 0;
  }

  /** True when the pattern holds at least one active step. */
  hasContent(pattern: number): boolean {
    const start = pattern * PATTERN_BYTES;
    for (let i = 0; i < MAX_STEPS; i++) {
      if (this.view[start + i * STEP_SLOT_SIZE] !== 0) return true;
    }
    return false;
  }

  getLength(pattern: number): number {
    return this.lengths[pattern] || DEFAULT_PATTERN_STEPS;
  }

  setLength(pattern: number, steps: number): void {
    this.lengths[pattern] = Math.max(1, Math.min(MAX_STEPS, Math.round(steps)));
  }

  /** Copies notes and length from one pattern slot to another. */
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
