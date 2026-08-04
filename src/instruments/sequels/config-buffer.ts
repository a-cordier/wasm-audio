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
import {
  ConfigParam,
  CONFIG_PARAM_COUNT,
  DEFAULT_CONFIG,
  Direction,
  MAX_TRANSPOSE,
  PATTERN_COUNT,
  SequencerConfig,
  Subdivision,
  SwitchMode,
} from "./types";

/**
 * SharedArrayBuffer-backed config for the sequencer worklet.
 * Main thread writes; worklet reads each quantum (no atomics needed —
 * a torn float is harmless for these parameters).
 *
 * Step count is deliberately absent: it is a per-pattern property and
 * lives in the pattern buffer's length region instead.
 */
export class SequencerConfigBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly view: Float32Array;

  constructor();
  constructor(buffer: SharedArrayBuffer);
  constructor(arg?: SharedArrayBuffer) {
    if (arg instanceof SharedArrayBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = new SharedArrayBuffer(CONFIG_PARAM_COUNT * Float32Array.BYTES_PER_ELEMENT);
    }
    this.view = new Float32Array(this.buffer);
    if (!(arg instanceof SharedArrayBuffer)) {
      this.applyDefaults();
    }
  }

  private applyDefaults(): void {
    this.setConfig(DEFAULT_CONFIG);
    this.setActivePattern(0);
  }

  setBpm(bpm: number): void {
    this.view[ConfigParam.BPM] = Math.max(20, Math.min(300, bpm));
  }

  setSubdivision(sub: Subdivision): void {
    this.view[ConfigParam.SUBDIVISION] = sub;
  }

  setSwing(swing: number): void {
    this.view[ConfigParam.SWING] = Math.max(0, Math.min(100, swing));
  }

  setGate(gate: number): void {
    this.view[ConfigParam.GATE] = Math.max(5, Math.min(100, gate));
  }

  setDirection(dir: Direction): void {
    this.view[ConfigParam.DIRECTION] = dir;
  }

  setLoop(loop: boolean): void {
    this.view[ConfigParam.LOOP] = loop ? 1 : 0;
  }

  setOutputChannel(ch: Channel): void {
    this.view[ConfigParam.OUTPUT_CHANNEL] = ch;
  }

  setActivePattern(index: number): void {
    this.view[ConfigParam.ACTIVE_PATTERN] = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
  }

  setSwitchMode(mode: SwitchMode): void {
    this.view[ConfigParam.SWITCH_MODE] = mode;
  }

  setMetronome(on: boolean): void {
    this.view[ConfigParam.METRONOME] = on ? 1 : 0;
  }

  setTranspose(semitones: number): void {
    this.view[ConfigParam.TRANSPOSE] = Math.max(-MAX_TRANSPOSE, Math.min(MAX_TRANSPOSE, Math.round(semitones)));
  }

  getActivePattern(): number {
    return Math.round(this.view[ConfigParam.ACTIVE_PATTERN]);
  }

  setConfig(config: SequencerConfig): void {
    this.setBpm(config.bpm);
    this.setSubdivision(config.subdivision);
    this.setSwing(config.swing);
    this.setGate(config.gate);
    this.setDirection(config.direction);
    this.setLoop(config.loop);
    this.setOutputChannel(config.outputChannel);
    this.setSwitchMode(config.switchMode);
    this.setTranspose(config.transpose);
    this.setMetronome(config.metronome);
  }

  getConfig(): SequencerConfig {
    return {
      bpm: this.view[ConfigParam.BPM],
      subdivision: this.view[ConfigParam.SUBDIVISION] as Subdivision,
      swing: this.view[ConfigParam.SWING],
      gate: this.view[ConfigParam.GATE],
      direction: this.view[ConfigParam.DIRECTION] as Direction,
      loop: this.view[ConfigParam.LOOP] === 1,
      outputChannel: this.view[ConfigParam.OUTPUT_CHANNEL] as Channel,
      switchMode: this.view[ConfigParam.SWITCH_MODE] as SwitchMode,
      transpose: this.view[ConfigParam.TRANSPOSE],
      metronome: this.view[ConfigParam.METRONOME] === 1,
    };
  }
}
