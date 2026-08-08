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

import { MidiEvent, Channel } from "../midi/types";
import { MidiBus } from "../midi/bus/bus";

/** Browser grouping; effect/module arrive with roadmap items 5-7. */
export type DeviceKind = "instrument" | "sequencer" | "effect" | "module";

export interface PluginDescriptor {
  readonly id: string;
  readonly name: string;
  /** How the device browser groups and labels this device. */
  readonly kind: DeviceKind;
  /** Accent for browser chips: a CSS color or var() reference. */
  readonly accent?: string;
  /** MIDI role (kept separate from kind: a sequencer is a midi-source). */
  readonly type: "instrument" | "midi-source";
}

export interface Plugin {
  readonly descriptor: PluginDescriptor;
  init(ctx?: AudioContext): void | Promise<void>;
  getState(): unknown;
  loadState(state: unknown): void;
  dispose(): void;
}

export interface MidiConsumer {
  receive(event: MidiEvent): void;
}

export interface AudioProducer {
  connectAudio(destination: AudioNode): void;
  disconnectAudio(): void;
  getOutputNode(): AudioNode;
}

export interface MidiProducer {
  connectMidiOutput(bus: MidiBus): void;
  setOutputChannel(channel: Channel): void;
}

export type InstrumentPlugin = Plugin & MidiConsumer & AudioProducer;
export type MidiSourcePlugin = Plugin & MidiProducer;

export function isInstrumentPlugin(plugin: Plugin): plugin is InstrumentPlugin {
  return plugin.descriptor.type === "instrument";
}

export function isMidiSourcePlugin(plugin: Plugin): plugin is MidiSourcePlugin {
  return plugin.descriptor.type === "midi-source";
}

// --- Core feature interfaces (optional capabilities) ---

export interface LearnableParam {
  id: number;
  name: string;
}

export interface Learnable {
  getLearnableParams(): LearnableParam[];
  handleControlChange(paramId: number, value: number): void;
}

/**
 * Plugins whose persistence must be scoped to the hosting slot implement this;
 * the host calls setSlotId before init() so state loads under the right key.
 */
export interface SlotAware {
  setSlotId(slotId: string): void;
}

/**
 * A shared timing reference from the master transport: beat 0 sits at
 * `contextTime` on the AudioContext clock (`startFrame` is the same instant
 * as a frame, for sample-aligned worklet starts). Children derive every beat
 * from it — the master and all children share the audio clock, so there is
 * no drift and no performance.now() mixing.
 */
export interface TransportAnchor {
  contextTime: number;
  bpm: number;
  startFrame: number;
}

/**
 * Devices that can follow the master transport ("child" clock mode). The
 * master is one command source; a device's own controls remain another (the
 * mother/child model — local starts quantize to the master's beat). Future
 * external sources (MIDI clock in) drive the same interface.
 */
export interface TransportChild {
  onMasterStart(anchor: TransportAnchor): void;
  onMasterStop(): void;
  onMasterTempo(bpm: number): void;
}

export interface PresetEntry {
  name: string;
  state: unknown;
}

export interface HasPresets {
  getFactoryPresets(): PresetEntry[];
}

export function isLearnable(plugin: Plugin): plugin is Plugin & Learnable {
  return "getLearnableParams" in plugin && "handleControlChange" in plugin;
}

/**
 * Capability check, deliberately duck-typed rather than keyed on
 * descriptor.type: a plugin can be a MIDI source AND a destination (the
 * sequencer records what it is fed), which the two-value type union cannot
 * express.
 */
export function isMidiConsumer(plugin: Plugin): plugin is Plugin & MidiConsumer {
  return "receive" in plugin;
}

export function hasPresets(plugin: Plugin): plugin is Plugin & HasPresets {
  return "getFactoryPresets" in plugin;
}

export function isSlotAware(plugin: Plugin): plugin is Plugin & SlotAware {
  return "setSlotId" in plugin;
}

/**
 * Duck-typed like isMidiConsumer: descriptor.type cannot express a MIDI source
 * that also produces audio (the sequencer's metronome click).
 */
export function isAudioProducer(plugin: Plugin): plugin is Plugin & AudioProducer {
  return "getOutputNode" in plugin;
}

export function isTransportChild(plugin: Plugin): plugin is Plugin & TransportChild {
  return "onMasterStart" in plugin && "onMasterTempo" in plugin;
}
