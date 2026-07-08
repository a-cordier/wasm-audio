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

import { MidiEvent, MidiHandler, MidiTarget, RouteFilter, Status, Channel, Disposable, OMNI_CHANNEL } from "./types";
import { DeviceManager } from "./device/manager";
import { MidiInputPort, MidiOutputPort } from "./device/port";
import { MidiBus } from "./bus/bus";
import { MidiRingBuffer } from "./transport/ring-buffer";
import { noteFrequency } from "./codec/notes";

/**
 * Scoped input builder for fluent routing from a specific MIDI input.
 */
class InputBuilder {
  private port: MidiInputPort;
  private channelFilter: Channel | Channel[] | undefined;
  private statusFilter: Status | Status[] | undefined;

  constructor(port: MidiInputPort) {
    this.port = port;
  }

  channel(ch: Channel | Channel[]): this {
    this.channelFilter = ch;
    return this;
  }

  notes(): this {
    this.statusFilter = [Status.NOTE_ON, Status.NOTE_OFF];
    return this;
  }

  cc(): this {
    this.statusFilter = Status.CONTROL_CHANGE;
    return this;
  }

  pitchBend(): this {
    this.statusFilter = Status.PITCH_BEND;
    return this;
  }

  all(): this {
    this.channelFilter = undefined;
    this.statusFilter = undefined;
    return this;
  }

  to(target: MidiTarget): Disposable {
    const filter: RouteFilter = {};
    if (this.channelFilter !== undefined) filter.channel = this.channelFilter;
    if (this.statusFilter !== undefined) filter.status = this.statusFilter;
    return this.port.connect(target, Object.keys(filter).length > 0 ? filter : undefined);
  }
}

/**
 * Main entry point — the "swiss army knife" MIDI API.
 *
 * Usage:
 *   const midi = await createMidi();
 *
 *   const keys = midi.input("KeyStep");
 *   keys.channel(0).notes().to(synth);
 *
 *   const bus = midi.bus("main");
 *   bus.from(keys);
 *   bus.subscribe(handler, { status: Status.CONTROL_CHANGE });
 */
export class Midi {
  readonly devices: DeviceManager;
  private buses = new Map<string, MidiBus>();

  constructor(devices: DeviceManager) {
    this.devices = devices;
  }

  /**
   * Get a fluent builder for a named input device.
   * Throws if no matching input is found.
   */
  input(name: string): InputBuilder {
    const port = this.devices.findInput(name);
    if (!port) throw new Error(`MIDI input "${name}" not found. Available: ${this.inputNames().join(", ")}`);
    return new InputBuilder(port);
  }

  /**
   * Get a named output port for sending MIDI data to hardware.
   */
  output(name: string): MidiOutputPort {
    const port = this.devices.findOutput(name);
    if (!port) throw new Error(`MIDI output "${name}" not found. Available: ${this.outputNames().join(", ")}`);
    return port;
  }

  /**
   * Get or create a named virtual bus.
   */
  bus(name: string): MidiBus {
    let b = this.buses.get(name);
    if (!b) {
      b = new MidiBus(name);
      this.buses.set(name, b);
    }
    return b;
  }

  /**
   * List all available input device names.
   */
  inputNames(): string[] {
    return [...this.devices.inputs.values()].map((p) => p.name);
  }

  /**
   * List all available output device names.
   */
  outputNames(): string[] {
    return [...this.devices.outputs.values()].map((p) => p.name);
  }

  /**
   * Register a listener for device hot-plug events.
   */
  onPortChange(listener: (port: MidiInputPort | MidiOutputPort, event: "connected" | "disconnected") => void): () => void {
    return this.devices.onPortChange(listener);
  }

  /**
   * Tear down all connections and device handlers.
   */
  destroy(): void {
    this.devices.destroy();
    this.buses.clear();
  }
}

/**
 * Create and initialize the MIDI system.
 */
export async function createMidi(options?: MIDIOptions): Promise<Midi> {
  const devices = new DeviceManager();
  await devices.init(options);
  return new Midi(devices);
}
