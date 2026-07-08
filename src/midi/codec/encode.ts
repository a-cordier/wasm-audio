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

import { Status, Channel } from "../types";

const POOL_SIZE = 8;

const pool3: Uint8Array[] = Array.from({ length: POOL_SIZE }, () => new Uint8Array(3));
const pool2: Uint8Array[] = Array.from({ length: POOL_SIZE }, () => new Uint8Array(2));

let poolIndex3 = 0;
let poolIndex2 = 0;

function acquire3(): Uint8Array {
  const buf = pool3[poolIndex3];
  poolIndex3 = (poolIndex3 + 1) & (POOL_SIZE - 1);
  return buf;
}

function acquire2(): Uint8Array {
  const buf = pool2[poolIndex2];
  poolIndex2 = (poolIndex2 + 1) & (POOL_SIZE - 1);
  return buf;
}

function statusByte(status: Status, channel: Channel): number {
  return (status << 4) | channel;
}

export function noteOn(channel: Channel, note: number, velocity: number): Uint8Array {
  const buf = acquire3();
  buf[0] = statusByte(Status.NOTE_ON, channel);
  buf[1] = note & 0x7f;
  buf[2] = velocity & 0x7f;
  return buf;
}

export function noteOff(channel: Channel, note: number, velocity = 0): Uint8Array {
  const buf = acquire3();
  buf[0] = statusByte(Status.NOTE_OFF, channel);
  buf[1] = note & 0x7f;
  buf[2] = velocity & 0x7f;
  return buf;
}

export function controlChange(channel: Channel, control: number, value: number): Uint8Array {
  const buf = acquire3();
  buf[0] = statusByte(Status.CONTROL_CHANGE, channel);
  buf[1] = control & 0x7f;
  buf[2] = value & 0x7f;
  return buf;
}

export function programChange(channel: Channel, program: number): Uint8Array {
  const buf = acquire2();
  buf[0] = statusByte(Status.PROGRAM_CHANGE, channel);
  buf[1] = program & 0x7f;
  return buf;
}

export function pitchBend(channel: Channel, value: number): Uint8Array {
  const centered = (value + 8192) & 0x3fff;
  const buf = acquire3();
  buf[0] = statusByte(Status.PITCH_BEND, channel);
  buf[1] = centered & 0x7f;
  buf[2] = (centered >> 7) & 0x7f;
  return buf;
}

export function channelAftertouch(channel: Channel, value: number): Uint8Array {
  const buf = acquire2();
  buf[0] = statusByte(Status.CHANNEL_AFTERTOUCH, channel);
  buf[1] = value & 0x7f;
  return buf;
}

export function polyAftertouch(channel: Channel, note: number, value: number): Uint8Array {
  const buf = acquire3();
  buf[0] = statusByte(Status.POLY_AFTERTOUCH, channel);
  buf[1] = note & 0x7f;
  buf[2] = value & 0x7f;
  return buf;
}

/**
 * Channel-scoped factory for fluent message construction.
 * All methods return pooled buffers — do not hold references across ticks.
 */
export function channel(ch: Channel) {
  return {
    noteOn: (note: number, velocity: number) => noteOn(ch, note, velocity),
    noteOff: (note: number, velocity?: number) => noteOff(ch, note, velocity),
    cc: (control: number, value: number) => controlChange(ch, control, value),
    programChange: (program: number) => programChange(ch, program),
    pitchBend: (value: number) => pitchBend(ch, value),
    aftertouch: (value: number) => channelAftertouch(ch, value),
    polyAftertouch: (note: number, value: number) => polyAftertouch(ch, note, value),
  };
}
