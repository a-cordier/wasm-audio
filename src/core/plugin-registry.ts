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

import type { PluginDescriptor, Plugin } from "./types";

export interface PluginRegistration {
  descriptor: PluginDescriptor;
  controllerFactory: (ctx: AudioContext) => Plugin;
  elementTag: string;
  workletModules?: string[];
  keyboardOctaveShift?: number;
  /** Mount with the slot's SYNC already on. For devices that are meaningless
   * without the master clock (SONG), so their panel isn't born ghosted;
   * free-running-capable devices (MOTION, sequencers) leave it off. */
  defaultSync?: boolean;
  /** A MIDI source's preferred default target: on mount it drives the first
   * slot running this plugin id (RUDIMENT → "drumlin", whose receive notes
   * its lanes default to), falling back to the first instrument. */
  preferredTarget?: string;
}

class PluginRegistry {
  private entries = new Map<string, PluginRegistration>();

  register(reg: PluginRegistration): void {
    this.entries.set(reg.descriptor.id, reg);
  }

  get(pluginId: string): PluginRegistration | undefined {
    return this.entries.get(pluginId);
  }

  getAll(): PluginRegistration[] {
    return [...this.entries.values()];
  }
}

export const pluginRegistry = new PluginRegistry();
