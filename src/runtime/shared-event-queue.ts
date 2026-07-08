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
 * Lock-free single-producer single-consumer (SPSC) ring buffer
 * backed by a SharedArrayBuffer.
 *
 * Layout (byte offsets):
 *   [0..3]   Int32  readHead   (atomic)
 *   [4..7]   Int32  writeHead  (atomic)
 *   [8..]    Float32 × (capacity × eventSize)  payload
 *
 * Each event is a fixed-size tuple of floats (e.g. [type, midi, freq, vel]).
 * The producer (main thread) calls enqueue(); the consumer (worklet) calls
 * dequeue(). Both are wait-free.
 */

const HEADER_BYTES = 8; // 2 × Int32 for read/write heads

function computeBufferSize(capacity: number, eventSize: number): number {
  return HEADER_BYTES + capacity * eventSize * Float32Array.BYTES_PER_ELEMENT;
}

export class SharedEventQueue {
  readonly buffer: SharedArrayBuffer;
  private readonly heads: Int32Array;
  private readonly data: Float32Array;
  private readonly capacity: number;
  private readonly eventSize: number;

  constructor(capacity: number, eventSize: number);
  constructor(buffer: SharedArrayBuffer, eventSize: number);
  constructor(arg: number | SharedArrayBuffer, eventSize: number, _unused?: never) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
      this.eventSize = eventSize;
      this.capacity =
        (this.buffer.byteLength - HEADER_BYTES) /
        (eventSize * Float32Array.BYTES_PER_ELEMENT);
    } else {
      this.capacity = arg;
      this.eventSize = eventSize;
      this.buffer = new SharedArrayBuffer(computeBufferSize(arg, eventSize));
    }
    this.heads = new Int32Array(this.buffer, 0, 2);
    this.data = new Float32Array(this.buffer, HEADER_BYTES);
  }

  /**
   * Enqueue an event (producer / main thread).
   * Returns false if the queue is full.
   */
  enqueue(event: ArrayLike<number>): boolean {
    const write = Atomics.load(this.heads, 1);
    const nextWrite = (write + 1) % this.capacity;
    const read = Atomics.load(this.heads, 0);

    if (nextWrite === read) return false; // full

    const offset = write * this.eventSize;
    for (let i = 0; i < this.eventSize; i++) {
      this.data[offset + i] = event[i];
    }

    Atomics.store(this.heads, 1, nextWrite);
    return true;
  }

  /**
   * Dequeue an event into `out` (consumer / worklet thread).
   * Returns false if the queue is empty.
   */
  dequeue(out: Float32Array): boolean {
    const read = Atomics.load(this.heads, 0);
    const write = Atomics.load(this.heads, 1);

    if (read === write) return false; // empty

    const offset = read * this.eventSize;
    for (let i = 0; i < this.eventSize; i++) {
      out[i] = this.data[offset + i];
    }

    Atomics.store(this.heads, 0, (read + 1) % this.capacity);
    return true;
  }
}
