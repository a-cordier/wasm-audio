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

// Each control's value is wrapped in `{ value }` so a section is a uniform
// Record the merge helper can walk. Values are raw 0..127 (house rule: the
// controller owns the mapping to real units — here Hz, seconds, shape index).
interface Field {
  value: number;
}

/** LCD order; SHAPE stores the index. STEP is last — the lane lights up. */
export const SHAPES = ["SIN", "TRI", "RMP", "SQR", "S&H", "STEP"] as const;

/** Cycle lengths for synced mode (DIV stores the index) — the app-wide list
 * (core/divisions.ts), re-exported so MOTION's own modules keep their import.
 * In STEP shape the cycle divides evenly across the lane: step = DIV / count. */
export { DIVISIONS } from "../../../core/divisions";

export const STEP_LANE_CAPACITY = 16;

/** The automated address: a mounted slot + one of its learnable ControlIDs.
 * Resolved lazily through the ParamDirectory — the slot may be restored
 * later than this module, or ejected while the target is still stored. */
export interface AutomationTarget {
  slotId: string | null;
  controlId: number;
}

export interface AutomationState {
  signal: {
    shape: Field; // index into SHAPES
    rate: Field; // free-run speed, raw → Hz (log)
    div: Field; // index into DIVISIONS (synced cycle length)
    min: Field; // output floor, raw — MIN > MAX inverts the shape
    max: Field; // output ceiling, raw
    glide: Field; // output slew, raw → seconds (universal lag)
    run: Field; // free-run gate (0|1); synced mode follows the master
  };
  steps: { count: number; values: number[] };
  target: AutomationTarget;
}

const DEFAULTS: AutomationState = {
  signal: {
    shape: { value: 0 },
    rate: { value: 64 },
    div: { value: 2 },
    min: { value: 0 },
    max: { value: 127 },
    glide: { value: 0 },
    run: { value: 0 },
  },
  steps: { count: 8, values: new Array(STEP_LANE_CAPACITY).fill(0) },
  target: { slotId: null, controlId: -1 },
};

function mergeSection<T extends Record<string, Field>>(
  defaults: T,
  partial?: Partial<Record<keyof T, Field>>
): T {
  const out = {} as T;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const saved = partial?.[key];
    out[key] = {
      value: typeof saved?.value === "number" ? saved.value : defaults[key].value,
    } as T[keyof T];
  }
  return out;
}

/** The lane keeps its full capacity regardless of count: shrinking the
 * count truncates the view, never the data, so step values survive edits. */
function mergeSteps(partial?: Partial<AutomationState["steps"]>): AutomationState["steps"] {
  const count =
    typeof partial?.count === "number"
      ? Math.max(2, Math.min(STEP_LANE_CAPACITY, Math.round(partial.count)))
      : DEFAULTS.steps.count;
  const values = new Array(STEP_LANE_CAPACITY).fill(0);
  if (Array.isArray(partial?.values)) {
    for (let i = 0; i < STEP_LANE_CAPACITY; i++) {
      const v = partial.values[i];
      if (typeof v === "number") values[i] = Math.max(0, Math.min(127, Math.round(v)));
    }
  }
  return { count, values };
}

function mergeTarget(partial?: Partial<AutomationTarget>): AutomationTarget {
  return {
    slotId: typeof partial?.slotId === "string" ? partial.slotId : null,
    controlId: typeof partial?.controlId === "number" ? partial.controlId : -1,
  };
}

export function createAutomationState(partial: Partial<AutomationState> = {}): AutomationState {
  return {
    signal: mergeSection(DEFAULTS.signal, partial.signal),
    steps: mergeSteps(partial.steps),
    target: mergeTarget(partial.target),
  };
}
