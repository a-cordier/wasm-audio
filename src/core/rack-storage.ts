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

/**
 * Full-session persistence for the rack: which devices are mounted, in which
 * slots, with which MIDI/mixer wiring, plus a state snapshot per device so a
 * reload restores the whole setup. Follows the sequels storage idiom:
 * versioned key, sanitize on read, best-effort try/catch writes.
 *
 * Sequels itself is excluded from the state snapshot — it self-persists a
 * richer serialization under its own slot-scoped key.
 */

export interface RackSlotEntry {
  id: string;
  pluginId: string;
  name: string;
  midiChannel: number | "omni";
  outputChannel: number;
  inputDevice: string;
  mixerChannel: number;
  collapsed: boolean;
  /** Device state snapshot from plugin.getState(); absent for self-persisting devices. */
  state?: unknown;
}

export interface RackSession {
  version: number;
  slotCounter: number;
  slots: RackSlotEntry[];
}

const STORAGE_KEY = "rack.session.v1";
const RACK_VERSION = 1;

function clampChannel(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(15, Math.round(value)))
    : fallback;
}

function sanitizeEntry(raw: unknown): RackSlotEntry | null {
  const e = raw as Partial<RackSlotEntry> | null;
  if (!e || typeof e.id !== "string" || typeof e.pluginId !== "string") return null;
  return {
    id: e.id,
    pluginId: e.pluginId,
    name: typeof e.name === "string" ? e.name : e.pluginId.toUpperCase(),
    midiChannel: e.midiChannel === "omni" ? "omni" : clampChannel(e.midiChannel, 0),
    outputChannel: clampChannel(e.outputChannel, 0),
    inputDevice: typeof e.inputDevice === "string" ? e.inputDevice : "internal",
    mixerChannel: clampChannel(e.mixerChannel, -1),
    collapsed: e.collapsed === true,
    state: e.state,
  };
}

export function saveRackSession(session: RackSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage disabled or over quota — persistence is best effort.
  }
}

export function loadRackSession(): RackSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RackSession>;
    if (parsed?.version !== RACK_VERSION || !Array.isArray(parsed.slots)) return null;
    const slots = parsed.slots
      .map(sanitizeEntry)
      .filter((e): e is RackSlotEntry => e !== null);
    if (slots.length === 0) return null;
    return {
      version: RACK_VERSION,
      slotCounter:
        typeof parsed.slotCounter === "number" && Number.isFinite(parsed.slotCounter)
          ? Math.max(0, Math.round(parsed.slotCounter))
          : slots.length,
      slots,
    };
  } catch {
    return null;
  }
}

export function clearRackSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
