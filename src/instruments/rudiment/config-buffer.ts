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
  LANE_COUNT,
  PATTERN_COUNT,
  RudimentConfig,
  Subdivision,
  SUBDIVISIONS,
  SwitchMode,
} from "./types";

/** Float32 config shared with the worklet (read once per block there). */
export class RudimentConfigBuffer {
  readonly buffer: SharedArrayBuffer;
  private readonly view: Float32Array;

  constructor() {
    this.buffer = new SharedArrayBuffer(CONFIG_PARAM_COUNT * Float32Array.BYTES_PER_ELEMENT);
    this.view = new Float32Array(this.buffer);
    this.setConfig(DEFAULT_CONFIG);
    this.setActivePattern(0);
  }

  setBpm(bpm: number): void {
    this.view[ConfigParam.BPM] = Math.max(20, Math.min(300, bpm));
  }

  setSubdivision(sub: Subdivision): void {
    this.view[ConfigParam.SUBDIVISION] = (SUBDIVISIONS as readonly number[]).includes(sub)
      ? sub
      : DEFAULT_CONFIG.subdivision;
  }

  setSwing(swing: number): void {
    this.view[ConfigParam.SWING] = Math.max(0, Math.min(100, swing));
  }

  setGate(gate: number): void {
    this.view[ConfigParam.GATE] = Math.max(5, Math.min(100, gate));
  }

  setOutputChannel(ch: Channel): void {
    this.view[ConfigParam.OUTPUT_CHANNEL] = ch;
  }

  setActivePattern(index: number): void {
    this.view[ConfigParam.ACTIVE_PATTERN] = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
  }

  getActivePattern(): number {
    return Math.round(this.view[ConfigParam.ACTIVE_PATTERN]);
  }

  setSwitchMode(mode: SwitchMode): void {
    this.view[ConfigParam.SWITCH_MODE] = mode === SwitchMode.CYCLE ? 1 : 0;
  }

  setMetronome(on: boolean): void {
    this.view[ConfigParam.METRONOME] = on ? 1 : 0;
  }

  setLaneNote(lane: number, note: number): void {
    if (lane < 0 || lane >= LANE_COUNT) return;
    this.view[ConfigParam.LANE_NOTE_BASE + lane] = Math.max(0, Math.min(127, Math.round(note)));
  }

  getLaneNote(lane: number): number {
    return Math.round(this.view[ConfigParam.LANE_NOTE_BASE + lane]);
  }

  setLaneMute(lane: number, muted: boolean): void {
    if (lane < 0 || lane >= LANE_COUNT) return;
    this.view[ConfigParam.LANE_MUTE_BASE + lane] = muted ? 1 : 0;
  }

  getLaneMute(lane: number): boolean {
    return this.view[ConfigParam.LANE_MUTE_BASE + lane] === 1;
  }

  setConfig(config: RudimentConfig): void {
    this.setBpm(config.bpm);
    this.setSubdivision(config.subdivision);
    this.setSwing(config.swing);
    this.setGate(config.gate);
    this.setOutputChannel(config.outputChannel);
    this.setSwitchMode(config.switchMode);
    this.setMetronome(config.metronome);
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      this.setLaneNote(lane, config.laneNotes[lane] ?? DEFAULT_CONFIG.laneNotes[lane]);
      this.setLaneMute(lane, config.laneMutes[lane] === true);
    }
  }

  getConfig(): RudimentConfig {
    const laneNotes: number[] = [];
    const laneMutes: boolean[] = [];
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      laneNotes.push(this.getLaneNote(lane));
      laneMutes.push(this.getLaneMute(lane));
    }
    return {
      bpm: this.view[ConfigParam.BPM],
      subdivision: this.view[ConfigParam.SUBDIVISION] as Subdivision,
      swing: this.view[ConfigParam.SWING],
      gate: this.view[ConfigParam.GATE],
      outputChannel: this.view[ConfigParam.OUTPUT_CHANNEL] as Channel,
      switchMode: (this.view[ConfigParam.SWITCH_MODE] === 1 ? 1 : 0) as SwitchMode,
      metronome: this.view[ConfigParam.METRONOME] === 1,
      laneNotes,
      laneMutes,
    };
  }
}
