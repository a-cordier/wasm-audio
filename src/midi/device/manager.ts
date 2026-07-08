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

import { MidiInputPort, MidiOutputPort } from "./port";

export type PortEvent = "connected" | "disconnected";
export type PortListener = (port: MidiInputPort | MidiOutputPort, event: PortEvent) => void;

/**
 * Manages Web MIDI device access, port lifecycle, and hot-plug events.
 * Not a singleton — multiple instances can coexist for testing or isolation.
 */
export class DeviceManager {
  readonly inputs = new Map<string, MidiInputPort>();
  readonly outputs = new Map<string, MidiOutputPort>();

  private midiAccess: MIDIAccess | null = null;
  private listeners: PortListener[] = [];

  async init(options?: MIDIOptions): Promise<this> {
    if (!navigator.requestMIDIAccess) {
      throw new Error("Web MIDI API not supported in this browser");
    }

    this.midiAccess = await navigator.requestMIDIAccess(options ?? { sysex: false });
    this.midiAccess.onstatechange = this.onStateChange;

    this.midiAccess.inputs.forEach((port) => this.registerInput(port));
    this.midiAccess.outputs.forEach((port) => this.registerOutput(port));

    return this;
  }

  /**
   * Find an input port by name (substring match, case-insensitive).
   */
  findInput(name: string): MidiInputPort | undefined {
    const lower = name.toLowerCase();
    for (const port of this.inputs.values()) {
      if (port.name.toLowerCase().includes(lower)) return port;
    }
    return undefined;
  }

  /**
   * Find an output port by name (substring match, case-insensitive).
   */
  findOutput(name: string): MidiOutputPort | undefined {
    const lower = name.toLowerCase();
    for (const port of this.outputs.values()) {
      if (port.name.toLowerCase().includes(lower)) return port;
    }
    return undefined;
  }

  onPortChange(listener: PortListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  destroy(): void {
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }
    for (const port of this.inputs.values()) port.disconnect();
    for (const port of this.outputs.values()) port.disconnect();
    this.inputs.clear();
    this.outputs.clear();
    this.listeners.length = 0;
  }

  private registerInput(port: MIDIInput): MidiInputPort {
    const wrapped = new MidiInputPort(port);
    this.inputs.set(port.id, wrapped);
    return wrapped;
  }

  private registerOutput(port: MIDIOutput): MidiOutputPort {
    const wrapped = new MidiOutputPort(port);
    this.outputs.set(port.id, wrapped);
    return wrapped;
  }

  private onStateChange = (e: MIDIConnectionEvent): void => {
    const port = e.port;
    if (!port) return;

    if (port.type === "input") {
      if (port.state === "connected" && !this.inputs.has(port.id)) {
        const wrapped = this.registerInput(port as MIDIInput);
        this.notify(wrapped, "connected");
      } else if (port.state === "disconnected" && this.inputs.has(port.id)) {
        const wrapped = this.inputs.get(port.id)!;
        wrapped.disconnect();
        this.inputs.delete(port.id);
        this.notify(wrapped, "disconnected");
      }
    } else if (port.type === "output") {
      if (port.state === "connected" && !this.outputs.has(port.id)) {
        const wrapped = this.registerOutput(port as MIDIOutput);
        this.notify(wrapped, "connected");
      } else if (port.state === "disconnected" && this.outputs.has(port.id)) {
        const wrapped = this.outputs.get(port.id)!;
        wrapped.disconnect();
        this.outputs.delete(port.id);
        this.notify(wrapped, "disconnected");
      }
    }
  };

  private notify(port: MidiInputPort | MidiOutputPort, event: PortEvent): void {
    for (const listener of this.listeners) {
      listener(port, event);
    }
  }
}
