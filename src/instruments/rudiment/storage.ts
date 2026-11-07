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

import { Channel } from "../../midi/types";
import { RudimentConfigBuffer } from "./config-buffer";
import { DrumPatternBuffer } from "./pattern-buffer";
import {
  BANK_COUNT,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  LANE_COUNT,
  MAX_STEPS,
  PATTERN_COUNT,
  RudimentConfig,
  RudimentState,
  SerializedDrumPattern,
  SerializedHit,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
} from "./types";

const STORAGE_KEY = "rudiment.state.v1";

function storageKey(slotId: string): string {
  return `${STORAGE_KEY}/${slotId}`;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sanitizeConfig(raw: unknown): RudimentConfig {
  const c = (raw ?? {}) as Partial<RudimentConfig>;
  const notes = Array.isArray(c.laneNotes) ? c.laneNotes : [];
  const mutes = Array.isArray(c.laneMutes) ? c.laneMutes : [];
  return {
    bpm: num(c.bpm, DEFAULT_CONFIG.bpm),
    subdivision: num(c.subdivision, DEFAULT_CONFIG.subdivision) as Subdivision,
    swing: num(c.swing, DEFAULT_CONFIG.swing),
    gate: num(c.gate, DEFAULT_CONFIG.gate),
    outputChannel: (num(c.outputChannel, DEFAULT_CONFIG.outputChannel) & 0x0f) as Channel,
    switchMode: num(c.switchMode, DEFAULT_CONFIG.switchMode) as SwitchMode,
    metronome: typeof c.metronome === "boolean" ? c.metronome : DEFAULT_CONFIG.metronome,
    // Per lane, so a state saved with fewer lanes (future growth) fills the
    // new ones from the defaults.
    laneNotes: DEFAULT_CONFIG.laneNotes.map((d, i) => num(notes[i], d)),
    laneMutes: DEFAULT_CONFIG.laneMutes.map((d, i) => (typeof mutes[i] === "boolean" ? mutes[i] : d)),
  };
}

export function serializePatterns(patterns: DrumPatternBuffer): SerializedDrumPattern[] {
  const out: SerializedDrumPattern[] = [];

  for (let index = 0; index < PATTERN_COUNT; index++) {
    const length = patterns.getLength(index);
    const hits: SerializedHit[] = [];
    let laneLengths: Record<number, number> | undefined;

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const laneLength = patterns.getLaneLength(index, lane);
      if (laneLength > 0) (laneLengths ??= {})[lane] = laneLength;
      for (let i = 0; i < MAX_STEPS; i++) {
        const velocity = patterns.getHit(index, lane, i);
        if (velocity > 0) hits.push({ lane, index: i, velocity });
      }
    }

    if (hits.length === 0 && length === DEFAULT_PATTERN_STEPS && !laneLengths) continue;
    const pattern: SerializedDrumPattern = { index, length, hits };
    if (laneLengths) pattern.laneLengths = laneLengths;
    out.push(pattern);
  }

  return out;
}

export function serializeState(
  config: RudimentConfigBuffer,
  patterns: DrumPatternBuffer,
  activePattern: number,
  bank: number
): RudimentState {
  return {
    version: STATE_VERSION,
    config: config.getConfig(),
    patterns: serializePatterns(patterns),
    activePattern,
    bank,
  };
}

export function applyState(
  raw: unknown,
  config: RudimentConfigBuffer,
  patterns: DrumPatternBuffer
): { activePattern: number; bank: number } {
  const state = (raw ?? {}) as Partial<RudimentState>;

  // MIDI routing belongs to the slot, not to the pattern bank: a preset or a
  // restored save may carry an outputChannel, but it must never move the one
  // the user selected in the slot header.
  const routedChannel = config.getConfig().outputChannel;
  config.setConfig(sanitizeConfig(state.config));
  config.setOutputChannel(routedChannel);

  patterns.clearAll();
  for (const pattern of state.patterns ?? []) {
    const index = num(pattern?.index, -1);
    if (index < 0 || index >= PATTERN_COUNT) continue;

    patterns.setLength(index, num(pattern.length, DEFAULT_PATTERN_STEPS));
    for (const [lane, length] of Object.entries(pattern.laneLengths ?? {})) {
      patterns.setLaneLength(index, Number(lane), num(length, 0));
    }
    for (const hit of pattern.hits ?? []) {
      const lane = num(hit?.lane, -1);
      const i = num(hit?.index, -1);
      const velocity = num(hit?.velocity, 0);
      if (lane < 0 || lane >= LANE_COUNT || i < 0 || i >= MAX_STEPS || velocity <= 0) continue;
      patterns.setHit(index, lane, i, velocity);
    }
  }

  const activePattern = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(num(state.activePattern, 0))));
  const bank = Math.max(0, Math.min(BANK_COUNT - 1, Math.round(num(state.bank, 0))));
  config.setActivePattern(activePattern);

  return { activePattern, bank };
}

export function saveState(state: RudimentState, slotId: string): void {
  try {
    localStorage.setItem(storageKey(slotId), JSON.stringify(state));
  } catch {
    // Storage disabled or over quota — persistence is best effort.
  }
}

export function loadStoredState(slotId: string): RudimentState | null {
  try {
    const raw = localStorage.getItem(storageKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RudimentState;
    if (parsed?.version !== STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredState(slotId: string): void {
  try {
    localStorage.removeItem(storageKey(slotId));
  } catch {
    // ignore
  }
}
