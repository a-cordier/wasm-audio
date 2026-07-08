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

import { Status, SystemStatus, Channel, MidiEvent } from "../types";

/**
 * Pre-allocated decode target to avoid per-message allocations on the hot path.
 * Callers that need to persist the data must copy it before the next decode() call.
 */
const DECODE_BUFFER: MidiEvent = {
  status: Status.NOTE_ON,
  channel: 0 as Channel,
  data1: 0,
  data2: 0,
  timestamp: 0,
};

/**
 * Decode a raw MIDI byte array into the shared DECODE_BUFFER.
 * Returns the buffer reference (not a copy) for zero-allocation hot path usage.
 * Returns null for system messages (not yet routed through the bus).
 */
export function decode(data: Uint8Array, timestamp = 0): MidiEvent | null {
  if (data.length === 0) return null;

  const statusByte = data[0];

  if (statusByte >= 0xf0) return null;

  const status = (statusByte >> 4) as Status;
  const channel = (statusByte & 0x0f) as Channel;

  DECODE_BUFFER.status = status;
  DECODE_BUFFER.channel = channel;
  DECODE_BUFFER.timestamp = timestamp;
  DECODE_BUFFER.data1 = data.length > 1 ? data[1] : 0;
  DECODE_BUFFER.data2 = data.length > 2 ? data[2] : 0;

  return DECODE_BUFFER;
}

/**
 * Decode into a caller-provided event object (avoids shared buffer contention
 * when multiple inputs are decoded in the same tick).
 */
export function decodeInto(data: Uint8Array, timestamp: number, out: MidiEvent): boolean {
  if (data.length === 0) return false;

  const statusByte = data[0];
  if (statusByte >= 0xf0) return false;

  out.status = (statusByte >> 4) as Status;
  out.channel = (statusByte & 0x0f) as Channel;
  out.timestamp = timestamp;
  out.data1 = data.length > 1 ? data[1] : 0;
  out.data2 = data.length > 2 ? data[2] : 0;

  return true;
}

/**
 * Check if a status byte indicates a channel message (vs system).
 */
export function isChannelMessage(statusByte: number): boolean {
  return statusByte >= 0x80 && statusByte < 0xf0;
}

/**
 * Check if a status byte indicates a system real-time message.
 */
export function isSystemRealTime(statusByte: number): boolean {
  return statusByte >= 0xf8;
}

/**
 * Extract rich note data from a decoded event (cold path — allocates).
 */
export function isNoteOn(event: MidiEvent): boolean {
  return event.status === Status.NOTE_ON && event.data2 > 0;
}

export function isNoteOff(event: MidiEvent): boolean {
  return event.status === Status.NOTE_OFF || (event.status === Status.NOTE_ON && event.data2 === 0);
}

export function isControlChange(event: MidiEvent): boolean {
  return event.status === Status.CONTROL_CHANGE;
}

export function isPitchBend(event: MidiEvent): boolean {
  return event.status === Status.PITCH_BEND;
}

export function pitchBendValue(event: MidiEvent): number {
  return ((event.data2 << 7) | event.data1) - 8192;
}
