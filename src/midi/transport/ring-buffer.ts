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

import { MidiEvent, Status, Channel } from "../types";

/**
 * Fixed-size MIDI event record: 4 x Float32 = 16 bytes.
 *
 * Layout per slot:
 *   [0] = packed status/channel/data1/data2 as: (status << 20) | (channel << 16) | (data1 << 8) | data2
 *   [1] = timestamp (ms, from performance.now or MIDIMessageEvent.timeStamp)
 *   [2] = reserved (frequency hint for note events, or 0)
 *   [3] = reserved (future use)
 */
export const MIDI_EVENT_SIZE = 4;
const HEADER_BYTES = 8;

function packEvent(event: MidiEvent): number {
  return ((event.status & 0x0f) << 20) |
    ((event.channel & 0x0f) << 16) |
    ((event.data1 & 0x7f) << 8) |
    (event.data2 & 0x7f);
}

export function unpackStatus(packed: number): Status {
  return ((packed >> 20) & 0x0f) as Status;
}

export function unpackChannel(packed: number): Channel {
  return ((packed >> 16) & 0x0f) as Channel;
}

export function unpackData1(packed: number): number {
  return (packed >> 8) & 0x7f;
}

export function unpackData2(packed: number): number {
  return packed & 0x7f;
}

/**
 * Lock-free SPSC ring buffer for MIDI events, backed by SharedArrayBuffer.
 * Designed for main-thread → worklet communication.
 *
 * Compatible with the existing SharedEventQueue protocol (same header layout)
 * but uses the new 4-float MIDI record format.
 */
export class MidiRingBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly heads: Int32Array;
  private readonly data: Float32Array;
  private readonly capacity: number;

  constructor(capacity: number);
  constructor(buffer: SharedArrayBuffer);
  constructor(arg: number | SharedArrayBuffer) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
      this.capacity = (arg.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
    } else {
      this.capacity = arg;
      const byteLength = HEADER_BYTES + arg * MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT;
      this.buffer = new SharedArrayBuffer(byteLength);
    }
    this.heads = new Int32Array(this.buffer, 0, 2);
    this.data = new Float32Array(this.buffer, HEADER_BYTES);
  }

  /**
   * Enqueue a MIDI event (producer / main thread).
   * Returns false if the queue is full.
   */
  enqueue(event: MidiEvent, frequencyHint = 0): boolean {
    const write = Atomics.load(this.heads, 1);
    const nextWrite = (write + 1) % this.capacity;
    if (nextWrite === Atomics.load(this.heads, 0)) return false;

    const offset = write * MIDI_EVENT_SIZE;
    this.data[offset] = packEvent(event);
    this.data[offset + 1] = event.timestamp;
    this.data[offset + 2] = frequencyHint;
    this.data[offset + 3] = 0;

    Atomics.store(this.heads, 1, nextWrite);
    return true;
  }

  /**
   * Dequeue a MIDI event into the provided Float32Array (consumer / worklet).
   * Returns false if the queue is empty.
   */
  dequeue(out: Float32Array): boolean {
    const read = Atomics.load(this.heads, 0);
    if (read === Atomics.load(this.heads, 1)) return false;

    const offset = read * MIDI_EVENT_SIZE;
    out[0] = this.data[offset];
    out[1] = this.data[offset + 1];
    out[2] = this.data[offset + 2];
    out[3] = this.data[offset + 3];

    Atomics.store(this.heads, 0, (read + 1) % this.capacity);
    return true;
  }

  /**
   * Convenience: enqueue from raw status/channel/data fields without
   * requiring a full MidiEvent object.
   */
  enqueueRaw(
    status: Status,
    channel: Channel,
    data1: number,
    data2: number,
    timestamp: number,
    frequencyHint = 0,
  ): boolean {
    const write = Atomics.load(this.heads, 1);
    const nextWrite = (write + 1) % this.capacity;
    if (nextWrite === Atomics.load(this.heads, 0)) return false;

    const packed = ((status & 0x0f) << 20) |
      ((channel & 0x0f) << 16) |
      ((data1 & 0x7f) << 8) |
      (data2 & 0x7f);

    const offset = write * MIDI_EVENT_SIZE;
    this.data[offset] = packed;
    this.data[offset + 1] = timestamp;
    this.data[offset + 2] = frequencyHint;
    this.data[offset + 3] = 0;

    Atomics.store(this.heads, 1, nextWrite);
    return true;
  }
}
