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
import { SequencerConfigBuffer } from "./config-buffer";
import { PatternBuffer } from "./pattern-buffer";
import {
  BANK_COUNT,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  MAX_STEPS,
  PATTERN_COUNT,
  SequencerConfig,
  SequencerState,
  SerializedPattern,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
} from "./types";

const STORAGE_KEY = "sequels.state.v1";

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Fills in anything missing or malformed from DEFAULT_CONFIG. */
export function sanitizeConfig(raw: unknown): SequencerConfig {
  const c = (raw ?? {}) as Partial<SequencerConfig>;
  return {
    bpm: num(c.bpm, DEFAULT_CONFIG.bpm),
    subdivision: num(c.subdivision, DEFAULT_CONFIG.subdivision) as Subdivision,
    swing: num(c.swing, DEFAULT_CONFIG.swing),
    gate: num(c.gate, DEFAULT_CONFIG.gate),
    direction: num(c.direction, DEFAULT_CONFIG.direction) as Direction,
    loop: typeof c.loop === "boolean" ? c.loop : DEFAULT_CONFIG.loop,
    outputChannel: (num(c.outputChannel, DEFAULT_CONFIG.outputChannel) & 0x0f) as Channel,
    switchMode: num(c.switchMode, DEFAULT_CONFIG.switchMode) as SwitchMode,
    transpose: num(c.transpose, DEFAULT_CONFIG.transpose),
    metronome: typeof c.metronome === "boolean" ? c.metronome : DEFAULT_CONFIG.metronome,
  };
}

/**
 * Reads the pattern buffer into a sparse, hand-authorable form.
 * Patterns with no active step and a default length are omitted.
 */
export function serializePatterns(patterns: PatternBuffer): SerializedPattern[] {
  const out: SerializedPattern[] = [];

  for (let index = 0; index < PATTERN_COUNT; index++) {
    const length = patterns.getLength(index);
    const steps = [];

    for (let i = 0; i < MAX_STEPS; i++) {
      const { note, velocity, slide } = patterns.getStep(index, i);
      if (note > 0) steps.push(slide ? { index: i, note, velocity, slide } : { index: i, note, velocity });
    }

    if (steps.length === 0 && length === DEFAULT_PATTERN_STEPS) continue;
    out.push({ index, length, steps });
  }

  return out;
}

export function serializeState(
  config: SequencerConfigBuffer,
  patterns: PatternBuffer,
  activePattern: number,
  bank: number
): SequencerState {
  return {
    version: STATE_VERSION,
    config: config.getConfig(),
    patterns: serializePatterns(patterns),
    activePattern,
    bank,
  };
}

/**
 * Writes a serialized state into the live buffers.
 * Returns the selection to restore alongside it.
 */
export function applyState(
  raw: unknown,
  config: SequencerConfigBuffer,
  patterns: PatternBuffer
): { activePattern: number; bank: number } {
  const state = (raw ?? {}) as Partial<SequencerState>;

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
    for (const step of pattern.steps ?? []) {
      const i = num(step?.index, -1);
      const note = num(step?.note, 0);
      if (i < 0 || i >= MAX_STEPS || note <= 0) continue;
      patterns.setStep(index, i, note, num(step.velocity, 100), step.slide === true);
    }
  }

  const activePattern = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(num(state.activePattern, 0))));
  const bank = Math.max(0, Math.min(BANK_COUNT - 1, Math.round(num(state.bank, 0))));
  config.setActivePattern(activePattern);

  return { activePattern, bank };
}

export function saveState(state: SequencerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage disabled or over quota — persistence is best effort.
  }
}

export function loadStoredState(): SequencerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SequencerState;
    if (parsed?.version !== STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
