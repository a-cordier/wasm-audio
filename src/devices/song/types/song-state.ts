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

export const SCENE_COUNT = 8;
export const CHAIN_CAPACITY = 8;
export const MIN_ENTRY_BARS = 1;
export const MAX_ENTRY_BARS = 32;

/** Cell value meaning "mute this sequencer in this scene". 0..39 selects a
 * pattern (and implies unmute); an ABSENT key is "—" (no-change): the scene
 * leaves that sequencer exactly as it was. */
export const CELL_MUTE = -1;

/** One scene row: per-sequencer cells keyed by SLOT id (slot ids survive
 * reloads; cells for unmounted slots persist invisibly and come back with
 * the device — the directory's lazy-resolve precedent). */
export interface SongScene {
  cells: Record<string, number>;
}

/** One chain step: play `scene` for `bars` bars. */
export interface SongChainEntry {
  scene: number;
  bars: number;
}

export interface SongChain {
  /** Fixed capacity; `count` is the played prefix (the lane's COUNT). */
  entries: SongChainEntry[];
  count: number;
  /** 1 = wrap at the end; 0 = hold the last scene (a module never stops
   * the master transport). */
  loop: 0 | 1;
  /** 1 = the chain drives scene changes; 0 = scenes launch manually. */
  on: 0 | 1;
}

export interface SongState {
  scenes: SongScene[];
  chain: SongChain;
  /** The highlighted row: what plays on the next master start. Playback
   * promotion follows it along; runtime queue/playing/mute state is
   * deliberately volatile and lives on the controller. */
  selectedScene: number;
}

const clampInt = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(min, Math.min(max, Math.round(v)))
    : fallback;

function mergeScene(partial?: Partial<SongScene>): SongScene {
  const cells: Record<string, number> = {};
  if (partial?.cells && typeof partial.cells === "object") {
    for (const [slotId, value] of Object.entries(partial.cells)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      cells[slotId] = Math.max(CELL_MUTE, Math.min(39, Math.round(value)));
    }
  }
  return { cells };
}

function mergeChain(partial?: Partial<SongChain>): SongChain {
  const entries: SongChainEntry[] = [];
  for (let i = 0; i < CHAIN_CAPACITY; i++) {
    const saved = Array.isArray(partial?.entries) ? partial.entries[i] : undefined;
    entries.push({
      scene: clampInt(saved?.scene, 0, SCENE_COUNT - 1, 0),
      bars: clampInt(saved?.bars, MIN_ENTRY_BARS, MAX_ENTRY_BARS, 4),
    });
  }
  return {
    entries,
    count: clampInt(partial?.count, 1, CHAIN_CAPACITY, 1),
    loop: partial?.loop === 0 ? 0 : 1,
    on: partial?.on === 1 ? 1 : 0,
  };
}

/** Defensive per-field merge — the module back-compat idiom (MOTION): every
 * missing or malformed field falls back to its default, so old saves load. */
export function createSongState(partial: Partial<SongState> = {}): SongState {
  const scenes: SongScene[] = [];
  for (let i = 0; i < SCENE_COUNT; i++) {
    scenes.push(mergeScene(Array.isArray(partial.scenes) ? partial.scenes[i] : undefined));
  }
  return {
    scenes,
    chain: mergeChain(partial.chain),
    selectedScene: clampInt(partial.selectedScene, 0, SCENE_COUNT - 1, 0),
  };
}
