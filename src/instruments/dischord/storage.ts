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
import { DischordConfigBuffer } from "./config-buffer";
import { ChordPatternBuffer } from "./pattern-buffer";
import {
  BANK_COUNT,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  DischordConfig,
  DischordState,
  EmitOrder,
  MAX_STEPS,
  PATTERN_COUNT,
  Quality,
  SerializedChordPattern,
  SerializedChordStep,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
  Voicing,
} from "./types";

const STORAGE_KEY = "dischord.state.v1";

/** Persistence is keyed by hosting slot so two mounted dischords never
 * clobber each other. No legacy fallback key — the device was born
 * slot-scoped. */
function storageKey(slotId?: string): string {
  return slotId ? `${STORAGE_KEY}/${slotId}` : STORAGE_KEY;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Fills in anything missing or malformed from DEFAULT_CONFIG. */
export function sanitizeConfig(raw: unknown): DischordConfig {
  const c = (raw ?? {}) as Partial<DischordConfig>;
  return {
    bpm: num(c.bpm, DEFAULT_CONFIG.bpm),
    subdivision: num(c.subdivision, DEFAULT_CONFIG.subdivision) as Subdivision,
    swing: num(c.swing, DEFAULT_CONFIG.swing),
    gate: num(c.gate, DEFAULT_CONFIG.gate),
    direction: num(c.direction, DEFAULT_CONFIG.direction) as Direction,
    loop: typeof c.loop === "boolean" ? c.loop : DEFAULT_CONFIG.loop,
    outputChannel: (num(c.outputChannel, DEFAULT_CONFIG.outputChannel) & 0x0f) as Channel,
    switchMode: num(c.switchMode, DEFAULT_CONFIG.switchMode) as SwitchMode,
    metronome: typeof c.metronome === "boolean" ? c.metronome : DEFAULT_CONFIG.metronome,
    key: num(c.key, DEFAULT_CONFIG.key),
    scale: num(c.scale, DEFAULT_CONFIG.scale),
    voices: num(c.voices, DEFAULT_CONFIG.voices),
    voicing: num(c.voicing, DEFAULT_CONFIG.voicing) as Voicing,
    order: num(c.order, DEFAULT_CONFIG.order) as EmitOrder,
    strum: num(c.strum, DEFAULT_CONFIG.strum),
  };
}

/**
 * Reads the pattern buffer into a sparse, hand-authorable form.
 * Patterns with no active step and a default length are omitted; step
 * fields at their defaults (octave 0, no tie, diatonic) are omitted too.
 */
export function serializePatterns(patterns: ChordPatternBuffer): SerializedChordPattern[] {
  const out: SerializedChordPattern[] = [];

  for (let index = 0; index < PATTERN_COUNT; index++) {
    const length = patterns.getLength(index);
    const steps: SerializedChordStep[] = [];

    for (let i = 0; i < MAX_STEPS; i++) {
      const { degree, octave, velocity, tie, quality } = patterns.getStep(index, i);
      if (degree <= 0) continue;
      const step: SerializedChordStep = { index: i, degree, velocity };
      if (octave !== 0) step.octave = octave;
      if (tie) step.tie = true;
      if (quality !== Quality.DIATONIC) step.quality = quality;
      steps.push(step);
    }

    if (steps.length === 0 && length === DEFAULT_PATTERN_STEPS) continue;
    out.push({ index, length, steps });
  }

  return out;
}

export function serializeState(
  config: DischordConfigBuffer,
  patterns: ChordPatternBuffer,
  activePattern: number,
  bank: number
): DischordState {
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
  config: DischordConfigBuffer,
  patterns: ChordPatternBuffer
): { activePattern: number; bank: number } {
  const state = (raw ?? {}) as Partial<DischordState>;

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
      const degree = num(step?.degree, 0);
      if (i < 0 || i >= MAX_STEPS || degree <= 0 || degree > 7) continue;
      patterns.setStep(
        index,
        i,
        degree,
        num(step.octave, 0),
        num(step.velocity, 100),
        step.tie === true,
        num(step.quality, Quality.DIATONIC) as Quality
      );
    }
  }

  const activePattern = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(num(state.activePattern, 0))));
  const bank = Math.max(0, Math.min(BANK_COUNT - 1, Math.round(num(state.bank, 0))));
  config.setActivePattern(activePattern);

  return { activePattern, bank };
}

export function saveState(state: DischordState, slotId?: string): void {
  try {
    localStorage.setItem(storageKey(slotId), JSON.stringify(state));
  } catch {
    // Storage disabled or over quota — persistence is best effort.
  }
}

export function loadStoredState(slotId?: string): DischordState | null {
  try {
    const raw = localStorage.getItem(storageKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DischordState;
    if (parsed?.version !== STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredState(slotId?: string): void {
  try {
    localStorage.removeItem(storageKey(slotId));
  } catch {
    // ignore
  }
}
