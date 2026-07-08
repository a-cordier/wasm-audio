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

import { MidiEvent, MidiHandler, MidiSource, MidiTarget, RouteFilter, Status, Channel, Disposable } from "../types";
import { Dispatcher } from "./dispatch";
import { MidiRingBuffer } from "../transport/ring-buffer";
import { noteFrequency } from "../codec/notes";

/**
 * Virtual MIDI bus — the core routing abstraction.
 *
 * Sources write events into the bus; subscribers (handlers or SAB ring buffers)
 * receive events that match their route filter.
 */
export class MidiBus implements MidiTarget {
  readonly name: string;
  private readonly dispatcher = new Dispatcher();
  private readonly ringTargets: { ring: MidiRingBuffer; channelMask: number; statusMask: number }[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Receive an event into this bus (implements MidiTarget).
   * Fans out to all matching subscribers.
   */
  receive(event: MidiEvent): void {
    this.dispatcher.dispatch(event);
    this.dispatchToRings(event);
  }

  /**
   * Programmatically send an event into this bus.
   */
  send(status: Status, channel: Channel, data1: number, data2: number, timestamp = performance.now()): void {
    const event: MidiEvent = { status, channel, data1, data2, timestamp };
    this.receive(event);
  }

  /**
   * Subscribe a main-thread callback to this bus.
   */
  subscribe(handler: MidiHandler, filter?: RouteFilter): Disposable {
    return this.dispatcher.addRoute(handler, filter);
  }

  /**
   * Connect a MidiSource to this bus (the source will feed events here).
   */
  from(source: MidiSource, filter?: RouteFilter): Disposable {
    return source.connect(this, filter);
  }

  /**
   * Subscribe a SAB ring buffer (for worklet consumption) to this bus.
   * The ring buffer will receive packed MIDI events matching the filter.
   */
  subscribeRing(ring: MidiRingBuffer, filter?: RouteFilter): Disposable {
    const channelMask = filter?.channel
      ? (Array.isArray(filter.channel)
        ? filter.channel.reduce((m, ch) => m | (1 << ch), 0)
        : 1 << filter.channel)
      : 0xffff;
    const statusMask = filter?.status
      ? (Array.isArray(filter.status)
        ? filter.status.reduce((m, s) => m | (1 << (s - 0x08)), 0)
        : 1 << (filter.status - 0x08))
      : 0x7f;

    const entry = { ring, channelMask, statusMask };
    this.ringTargets.push(entry);

    return {
      dispose: () => {
        const idx = this.ringTargets.indexOf(entry);
        if (idx !== -1) {
          this.ringTargets[idx] = this.ringTargets[this.ringTargets.length - 1];
          this.ringTargets.pop();
        }
      },
    };
  }

  private dispatchToRings(event: MidiEvent): void {
    const channelBit = 1 << event.channel;
    const statusBit = 1 << (event.status - 0x08);

    for (let i = 0, len = this.ringTargets.length; i < len; i++) {
      const target = this.ringTargets[i];
      if ((target.channelMask & channelBit) && (target.statusMask & statusBit)) {
        const freqHint = (event.status === Status.NOTE_ON || event.status === Status.NOTE_OFF)
          ? noteFrequency(event.data1)
          : 0;
        target.ring.enqueue(event, freqHint);
      }
    }
  }
}
