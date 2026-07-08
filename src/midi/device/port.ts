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

import { MidiEvent, MidiSource, MidiTarget, RouteFilter, Disposable, Channel, Status } from "../types";
import { decode, decodeInto } from "../codec/decode";

/**
 * Wraps a Web MIDI API MIDIInput as a MidiSource.
 * Parses incoming bytes and feeds events to connected targets.
 */
export class MidiInputPort implements MidiSource {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;

  private readonly port: MIDIInput;
  private readonly connections: { target: MidiTarget; filter?: RouteFilter }[] = [];
  private readonly decodeBuffer: MidiEvent = {
    status: Status.NOTE_ON,
    channel: 0 as Channel,
    data1: 0,
    data2: 0,
    timestamp: 0,
  };

  constructor(port: MIDIInput) {
    this.port = port;
    this.id = port.id;
    this.name = port.name ?? "Unknown";
    this.manufacturer = port.manufacturer ?? "";
    this.port.onmidimessage = this.onMessage;
  }

  connect(target: MidiTarget, filter?: RouteFilter): Disposable {
    const entry = { target, filter };
    this.connections.push(entry);
    return {
      dispose: () => {
        const idx = this.connections.indexOf(entry);
        if (idx !== -1) {
          this.connections[idx] = this.connections[this.connections.length - 1];
          this.connections.pop();
        }
      },
    };
  }

  disconnect(): void {
    this.port.onmidimessage = null;
    this.connections.length = 0;
  }

  private onMessage = (e: MIDIMessageEvent): void => {
    if (!decodeInto(e.data as Uint8Array, e.timeStamp, this.decodeBuffer)) return;

    for (let i = 0, len = this.connections.length; i < len; i++) {
      const conn = this.connections[i];
      if (this.matchesFilter(conn.filter)) {
        conn.target.receive(this.decodeBuffer);
      }
    }
  };

  private matchesFilter(filter?: RouteFilter): boolean {
    if (!filter) return true;

    if (filter.channel !== undefined) {
      if (Array.isArray(filter.channel)) {
        if (!filter.channel.includes(this.decodeBuffer.channel)) return false;
      } else if (filter.channel !== this.decodeBuffer.channel) {
        return false;
      }
    }

    if (filter.status !== undefined) {
      if (Array.isArray(filter.status)) {
        if (!filter.status.includes(this.decodeBuffer.status)) return false;
      } else if (filter.status !== this.decodeBuffer.status) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Wraps a Web MIDI API MIDIOutput as a MidiTarget.
 * Receives MIDI events and serializes them to the hardware output.
 */
export class MidiOutputPort implements MidiTarget {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;

  private readonly port: MIDIOutput;
  private readonly sendBuf3 = new Uint8Array(3);
  private readonly sendBuf2 = new Uint8Array(2);

  constructor(port: MIDIOutput) {
    this.port = port;
    this.id = port.id;
    this.name = port.name ?? "Unknown";
    this.manufacturer = port.manufacturer ?? "";
  }

  receive(event: MidiEvent): void {
    const statusByte = (event.status << 4) | event.channel;

    if (event.status === Status.PROGRAM_CHANGE || event.status === Status.CHANNEL_AFTERTOUCH) {
      this.sendBuf2[0] = statusByte;
      this.sendBuf2[1] = event.data1;
      this.port.send(this.sendBuf2, event.timestamp);
    } else {
      this.sendBuf3[0] = statusByte;
      this.sendBuf3[1] = event.data1;
      this.sendBuf3[2] = event.data2;
      this.port.send(this.sendBuf3, event.timestamp);
    }
  }

  disconnect(): void {
    this.port.close();
  }
}
