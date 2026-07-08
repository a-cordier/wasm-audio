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
 * A shared float array backed by a SharedArrayBuffer.
 *
 * Main thread writes with set(); worklet reads with get() or getAll().
 * No atomics needed — a torn float read is harmless for audio parameters
 * (worst case: one render quantum uses a slightly stale value).
 */
export class SharedParamBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly view: Float32Array;

  constructor(paramCount: number);
  constructor(buffer: SharedArrayBuffer);
  constructor(arg: number | SharedArrayBuffer) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = new SharedArrayBuffer(arg * Float32Array.BYTES_PER_ELEMENT);
    }
    this.view = new Float32Array(this.buffer);
  }

  get length(): number {
    return this.view.length;
  }

  set(index: number, value: number): void {
    this.view[index] = value;
  }

  get(index: number): number {
    return this.view[index];
  }
}
