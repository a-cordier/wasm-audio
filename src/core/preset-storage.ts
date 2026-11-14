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
 * App-level presets: named whole-workspace snapshots. The autosaved session
 * (rack-storage) stays the working copy; a preset is an explicit snapshot of
 * it carrying EVERY device's state (self-persisting sequencers included) —
 * minus the workspace chrome (`ui`), which belongs to the user, not the song.
 *
 * INIT is virtual: never stored, always first, opens an empty rack. Nothing
 * in this module can write it. Factory presets ship with the app the same
 * way — read-only, never stored, listed right after INIT.
 */

import { RackSession, RACK_VERSION, sanitizeRackSession } from "./rack-storage";
import { CE_PORTE_SESSION } from "./factory-presets/ce-porte";

export const INIT_PRESET_ID = "init";
export const INIT_PRESET_NAME = "INIT";
export const PRESET_NAME_MAX = 16;

export interface AppPreset {
  id: string;
  name: string;
  session: RackSession;
}

const FACTORY_SOURCES: Array<{ id: string; name: string; session: unknown }> = [
  { id: "factory-ce-porte", name: "CE PORTE", session: CE_PORTE_SESSION },
];

let factoryCache: AppPreset[] | null = null;

/** The presets that ship with the app, in stepping order. Read-only. */
export function factoryPresets(): AppPreset[] {
  if (!factoryCache) {
    factoryCache = [];
    for (const src of FACTORY_SOURCES) {
      const session = sanitizeRackSession(src.session);
      if (session) factoryCache.push({ id: src.id, name: src.name, session: toPresetSession(session) });
    }
  }
  return factoryCache;
}

/** INIT and the factory presets: openable, never written, renamed or deleted. */
export function isReadOnlyPreset(id: string): boolean {
  return id === INIT_PRESET_ID || FACTORY_SOURCES.some((p) => p.id === id);
}

const STORAGE_KEY = "rack.presets.v1";
const PRESETS_VERSION = 1;

/** The INIT workspace: an empty rack at the default tempo and bus levels. */
export function initSession(): RackSession {
  return {
    version: RACK_VERSION,
    slotCounter: 0,
    slots: [],
    transport: { bpm: 120 },
    mixer: { master: 0.8, click: 0.8 },
  };
}

export function sanitizePresetName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().toUpperCase() : "";
  return name.slice(0, PRESET_NAME_MAX);
}

/** Strip the working-copy-only fields off a session. */
export function toPresetSession(session: RackSession): RackSession {
  const { ui: _ui, preset: _preset, ...rest } = session;
  return rest;
}

export function loadPresets(): AppPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: unknown; presets?: unknown };
    if (parsed?.version !== PRESETS_VERSION || !Array.isArray(parsed.presets)) return [];
    const seen = new Set<string>([INIT_PRESET_ID, ...FACTORY_SOURCES.map((p) => p.id)]);
    const out: AppPreset[] = [];
    for (const p of parsed.presets as Array<Partial<AppPreset>>) {
      if (!p || typeof p.id !== "string" || seen.has(p.id)) continue;
      const session = sanitizeRackSession(p.session);
      if (!session) continue;
      seen.add(p.id);
      out.push({
        id: p.id,
        name: sanitizePresetName(p.name) || "PRESET",
        session: toPresetSession(session),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Best-effort write; false means storage refused it (quota / disabled). */
export function savePresets(presets: AppPreset[]): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PRESETS_VERSION,
        // Belt and braces: INIT and the factory presets are never persisted,
        // whatever the caller holds.
        presets: presets.filter((p) => !isReadOnlyPreset(p.id)),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function newPresetId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** "PRESET n" with the lowest n not already taken. */
export function defaultPresetName(presets: AppPreset[]): string {
  const names = new Set(presets.map((p) => p.name));
  let n = presets.length + 1;
  while (names.has(`PRESET ${n}`)) n++;
  return `PRESET ${n}`;
}
