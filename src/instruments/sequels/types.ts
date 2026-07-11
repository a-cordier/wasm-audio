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

export const enum Subdivision {
  QUARTER = 1,
  EIGHTH = 2,
  SIXTEENTH = 4,
  THIRTY_SECOND = 8,
}

export const enum Direction {
  FORWARD = 0,
  REVERSE = 1,
  PING_PONG = 2,
  RANDOM = 3,
}

export const enum TransportState {
  STOPPED = 0,
  PLAYING = 1,
}

export const enum ConfigParam {
  BPM = 0,
  STEPS = 1,
  SUBDIVISION = 2,
  SWING = 3,
  GATE = 4,
  DIRECTION = 5,
  LOOP = 6,
  OUTPUT_CHANNEL = 7,
}

export const CONFIG_PARAM_COUNT = 8;

export interface SequencerConfig {
  bpm: number;
  steps: number;
  subdivision: Subdivision;
  swing: number;
  gate: number;
  direction: Direction;
  loop: boolean;
  outputChannel: Channel;
}

export interface SequencerState {
  config: SequencerConfig;
  transport: TransportState;
  currentStep: number;
}

export const MAX_STEPS = 64;
export const STEP_SLOT_SIZE = 2; // note + velocity

export const DEFAULT_CONFIG: SequencerConfig = {
  bpm: 120,
  steps: 16,
  subdivision: Subdivision.SIXTEENTH,
  swing: 0,
  gate: 75,
  direction: Direction.FORWARD,
  loop: true,
  outputChannel: 0 as Channel,
};
