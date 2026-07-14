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

export interface PluginDescriptor {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
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

export function hasPresets(plugin: Plugin): plugin is Plugin & HasPresets {
  return "getFactoryPresets" in plugin;
}
