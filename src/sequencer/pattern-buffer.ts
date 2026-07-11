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

import { MAX_STEPS, STEP_SLOT_SIZE } from "./types";

/**
 * SharedArrayBuffer-backed pattern storage.
 *
 * Layout: 64 slots x 2 bytes each = 128 bytes total.
 *   slot[i * 2]     = MIDI note number (0 = step off, 1-127 = active)
 *   slot[i * 2 + 1] = velocity (0-127)
 *
 * Main thread writes when user edits steps; worklet reads at step boundaries.
 */
export class PatternBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly view: Uint8Array;

  constructor();
  constructor(buffer: SharedArrayBuffer);
  constructor(arg?: SharedArrayBuffer) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = new SharedArrayBuffer(MAX_STEPS * STEP_SLOT_SIZE);
    }
    this.view = new Uint8Array(this.buffer);
  }

  setStep(index: number, note: number, velocity: number): void {
    const offset = index * STEP_SLOT_SIZE;
    this.view[offset] = note & 0x7f;
    this.view[offset + 1] = velocity & 0x7f;
  }

  clearStep(index: number): void {
    const offset = index * STEP_SLOT_SIZE;
    this.view[offset] = 0;
    this.view[offset + 1] = 0;
  }

  getStep(index: number): { note: number; velocity: number } {
    const offset = index * STEP_SLOT_SIZE;
    return {
      note: this.view[offset],
      velocity: this.view[offset + 1],
    };
  }

  isStepActive(index: number): boolean {
    return this.view[index * STEP_SLOT_SIZE] !== 0;
  }

  clear(): void {
    this.view.fill(0);
  }
}
