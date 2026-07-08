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
 * Worklet-side drain helper for MidiRingBuffer.
 * Unpacks the 4-float MIDI event records into status/channel/data fields.
 *
 * Record layout (4 x Float32):
 *   [0] = packed: (status << 20) | (channel << 16) | (data1 << 8) | data2
 *   [1] = timestamp (ms)
 *   [2] = frequency hint (for note events)
 *   [3] = reserved
 */

const MIDI_EVENT_SIZE = 4;
const HEADER_INTS = 2;
const HEADER_BYTES = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT;

// Status nibble constants (same as types.ts Status enum)
const NOTE_OFF = 0x08;
const NOTE_ON = 0x09;
const CONTROL_CHANGE = 0x0b;
const PITCH_BEND = 0x0e;

/**
 * Create a drain context for a MidiRingBuffer SharedArrayBuffer.
 *
 * @param {SharedArrayBuffer} buffer - The SAB backing a MidiRingBuffer
 * @returns {object} drain API: { dequeue, status, channel, data1, data2, timestamp, frequency }
 */
export function createMidiDrain(buffer) {
  const capacity = (buffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
  const heads = new Int32Array(buffer, 0, HEADER_INTS);
  const data = new Float32Array(buffer, HEADER_BYTES);

  let _status = 0;
  let _channel = 0;
  let _data1 = 0;
  let _data2 = 0;
  let _timestamp = 0;
  let _frequency = 0;

  function dequeue() {
    const read = Atomics.load(heads, 0);
    if (read === Atomics.load(heads, 1)) return false;

    const offset = read * MIDI_EVENT_SIZE;
    const packed = data[offset];
    _timestamp = data[offset + 1];
    _frequency = data[offset + 2];

    _status = (packed >> 20) & 0x0f;
    _channel = (packed >> 16) & 0x0f;
    _data1 = (packed >> 8) & 0x7f;
    _data2 = packed & 0x7f;

    Atomics.store(heads, 0, (read + 1) % capacity);
    return true;
  }

  return {
    dequeue,
    get status() { return _status; },
    get channel() { return _channel; },
    get data1() { return _data1; },
    get data2() { return _data2; },
    get timestamp() { return _timestamp; },
    get frequency() { return _frequency; },
    NOTE_ON,
    NOTE_OFF,
    CONTROL_CHANGE,
    PITCH_BEND,
  };
}
