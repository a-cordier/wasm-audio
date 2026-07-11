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

import { MidiRingBuffer } from "../midi/transport/ring-buffer";
import { SequencerConfigBuffer } from "./config-buffer";
import { PatternBuffer } from "./pattern-buffer";

export type PositionCallback = (step: number) => void;

/**
 * AudioWorkletNode wrapper for the sequencer processor.
 * Manages SAB allocation and transport messages.
 */
export class SequencerNode extends AudioWorkletNode {
  readonly config: SequencerConfigBuffer;
  readonly pattern: PatternBuffer;
  readonly outputRing: MidiRingBuffer;

  private positionCallback: PositionCallback | null = null;

  constructor(context: AudioContext) {
    super(context, "seq", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });

    this.config = new SequencerConfigBuffer();
    this.pattern = new PatternBuffer();
    this.outputRing = new MidiRingBuffer(128);

    this.port.postMessage({
      type: "__init_sab",
      configBuffer: this.config.buffer,
      patternBuffer: this.pattern.buffer,
      ringBuffer: this.outputRing.buffer,
    });

    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  private onMessage(msg: { type: string; step?: number }): void {
    if (msg.type === "__position" && this.positionCallback) {
      this.positionCallback(msg.step ?? -1);
    }
  }

  onPosition(callback: PositionCallback): void {
    this.positionCallback = callback;
  }

  start(): void {
    this.port.postMessage({ type: "__start" });
  }

  stop(): void {
    this.port.postMessage({ type: "__stop" });
  }
}
