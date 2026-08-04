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

/** Snapshot of the running clock, as the main thread understands it. */
export interface RecordClock {
  playing: boolean;
  /** Step the worklet last reported (-1 when idle). */
  currentStep: number;
  /** performance.now() at the moment that step was reported. */
  lastStepTime: number;
  /** Duration of one step in ms, derived from bpm and subdivision. */
  stepMs: number;
  /** Step count of the pattern being recorded into. */
  length: number;
}

export type StepWriter = (index: number, note: number, velocity: number) => void;

/**
 * Captures incoming notes into a pattern.
 *
 * Stopped  -> step record: each note lands on the edit cursor, which advances
 *             once all held keys are released (so a chord writes one step
 *             rather than smearing across three).
 * Playing  -> live record: each note is quantized to the nearest step of the
 *             running clock.
 *
 * The pattern holds one note per step, so within a chord the last note wins.
 */
export class PatternRecorder {
  private held = new Set<number>();
  private wrote = false;
  private _cursor = 0;

  get cursor(): number {
    return this._cursor;
  }

  setCursor(index: number, length: number): void {
    if (length <= 0) return;
    this._cursor = ((index % length) + length) % length;
  }

  moveCursor(delta: number, length: number): void {
    this.setCursor(this._cursor + delta, length);
  }

  /** Drops held-key state — call when disarming or switching pattern. */
  reset(): void {
    this.held.clear();
    this.wrote = false;
  }

  /**
   * Records a note. Returns the step it landed on, or -1 when the note was
   * rejected (note 0 is the pattern buffer's "step off" marker).
   */
  noteOn(note: number, velocity: number, timestamp: number, clock: RecordClock, write: StepWriter): number {
    if (note <= 0 || velocity <= 0 || clock.length <= 0) return -1;

    const target = clock.playing ? this.quantize(timestamp, clock) : this._cursor;
    if (target < 0) return -1;

    write(target, note, velocity);
    this.held.add(note);
    this.wrote = true;
    return target;
  }

  /** Advances the edit cursor once the last held key is released. */
  noteOff(note: number, clock: RecordClock): void {
    if (!this.held.delete(note)) return;
    if (this.held.size > 0 || clock.playing || !this.wrote) return;

    this.wrote = false;
    this.moveCursor(1, clock.length);
  }

  /**
   * Rounds to the nearest step. The worklet reports positions by postMessage,
   * so the offset into the current step is interpolated from the wall clock
   * rather than read back from the audio thread.
   */
  private quantize(timestamp: number, clock: RecordClock): number {
    // The transport can report PLAYING before the worklet's first position
    // message lands. Falling back to the edit cursor keeps the note rather
    // than dropping it on the floor.
    if (clock.currentStep < 0) return this._cursor;

    const now = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : performance.now();
    const elapsed = now - clock.lastStepTime;
    const ahead = elapsed > clock.stepMs / 2 ? 1 : 0;

    return (clock.currentStep + ahead) % clock.length;
  }
}
