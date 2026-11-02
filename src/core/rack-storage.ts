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

import { ChannelStripState, sanitizeStripState, sanitizeBusGain } from "../mixer/types";

export interface RackSlotEntry {
  id: string;
  pluginId: string;
  name: string;
  midiChannel: number | "omni";
  outputChannel: number;
  inputDevice: string;
  /** Mixer strip settings for the slot's channel; absent for sequencers.
   * (Replaces the retired fixed `mixerChannel` index — strip order follows
   * slot order now that channels are dynamic.) */
  mixer?: ChannelStripState;
  collapsed: boolean;
  sync: boolean;
  /** Rack row index (rows are the arrangement unit — devices sit side by side). */
  row: number;
  /** Device state snapshot from plugin.getState(); absent for self-persisting devices. */
  state?: unknown;
}

export interface RackSession {
  version: number;
  slotCounter: number;
  slots: RackSlotEntry[];
  /** Master transport settings. */
  transport?: { bpm: number };
  /** Mixer bus levels (the strips persist per slot in `slots[].mixer`). */
  mixer?: { master: number; click: number };
  /** Workspace chrome state (docked panels). */
  ui?: { mixerCollapsed: boolean; browserOpen: boolean };
}

const STORAGE_KEY = "rack.session.v1";
const RACK_VERSION = 1;

function clampChannel(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(15, Math.round(value)))
    : fallback;
}

function sanitizeEntry(raw: unknown, index: number): RackSlotEntry | null {
  const e = raw as Partial<RackSlotEntry> | null;
  if (!e || typeof e.id !== "string" || typeof e.pluginId !== "string") return null;
  return {
    id: e.id,
    pluginId: e.pluginId,
    name: typeof e.name === "string" ? e.name : e.pluginId.toUpperCase(),
    midiChannel: e.midiChannel === "omni" ? "omni" : clampChannel(e.midiChannel, 0),
    outputChannel: clampChannel(e.outputChannel, 0),
    inputDevice: typeof e.inputDevice === "string" ? e.inputDevice : "internal",
    // Legacy sessions carry no strip snapshot — their channels boot from
    // defaults, exactly as the pre-item-5 mixer always did.
    mixer: e.mixer == null ? undefined : sanitizeStripState(e.mixer),
    collapsed: e.collapsed === true,
    sync: e.sync === true,
    // Legacy sessions (no row) flow into ONE row — it wraps to fill the
    // viewport, so wide screens stay fully used until the user makes rows.
    row: typeof e.row === "number" && Number.isFinite(e.row)
      ? Math.max(0, Math.round(e.row))
      : 0,
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
      .map((raw, index) => sanitizeEntry(raw, index))
      .filter((e): e is RackSlotEntry => e !== null);
    if (slots.length === 0) return null;
    const rawBpm = (parsed.transport as { bpm?: unknown } | undefined)?.bpm;
    const rawMixer = parsed.mixer as { master?: unknown; click?: unknown } | undefined;
    const rawUi = parsed.ui as { mixerCollapsed?: unknown; browserOpen?: unknown } | undefined;
    return {
      version: RACK_VERSION,
      slotCounter:
        typeof parsed.slotCounter === "number" && Number.isFinite(parsed.slotCounter)
          ? Math.max(0, Math.round(parsed.slotCounter))
          : slots.length,
      slots,
      transport: {
        bpm: typeof rawBpm === "number" && Number.isFinite(rawBpm)
          ? Math.max(20, Math.min(300, Math.round(rawBpm)))
          : 120,
      },
      mixer: {
        master: sanitizeBusGain(rawMixer?.master, 0.8),
        click: sanitizeBusGain(rawMixer?.click, 0.8),
      },
      ui: {
        mixerCollapsed: rawUi?.mixerCollapsed === true,
        // The browser rail defaults to open — absent means legacy session.
        browserOpen: rawUi?.browserOpen !== false,
      },
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
