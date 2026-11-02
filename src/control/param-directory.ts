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

import { Plugin, Learnable, LearnableParam, isLearnable } from "../core/types";

/**
 * The automation address book: every mounted Learnable device, keyed by slot
 * id (an automatable address is the pair slotId + ControlID — the same
 * addresses MIDI-learn dispatches to). The shell feeds it on mount/unmount;
 * automation modules enumerate targets here and dispatch straight into
 * `plugin.handleControlChange`, which moves the engine AND the panel — no
 * learn ceremony, no event fan-out, and the session-save hook stays out of
 * the per-tick path (automation wiggle is not user intent).
 */
export interface AutomationTargetEntry {
  slotId: string;
  /** Slot name ("MONOLOG 2") — unique per rack, same label as the header. */
  name: string;
  params: LearnableParam[];
  plugin: Plugin & Learnable;
}

export class ParamDirectory extends EventTarget {
  /** Insertion order is mount order — the steppers walk it as-is. */
  private entries = new Map<string, AutomationTargetEntry>();

  /** No-op for non-learnable plugins: the shell registers every mount. */
  register(slotId: string, name: string, plugin: Plugin): void {
    if (!isLearnable(plugin)) return;
    this.entries.set(slotId, { slotId, name, params: plugin.getLearnableParams(), plugin });
    this.notify();
  }

  unregister(slotId: string): void {
    if (this.entries.delete(slotId)) this.notify();
  }

  getTargets(): AutomationTargetEntry[] {
    return [...this.entries.values()];
  }

  /** Lazy resolution: a stored target may not be mounted (yet). */
  resolve(slotId: string | null): AutomationTargetEntry | null {
    if (!slotId) return null;
    return this.entries.get(slotId) ?? null;
  }

  private notify() {
    this.dispatchEvent(new CustomEvent("directory-change"));
  }
}

let directory: ParamDirectory | null = null;

export function getParamDirectory(): ParamDirectory {
  if (!directory) directory = new ParamDirectory();
  return directory;
}
