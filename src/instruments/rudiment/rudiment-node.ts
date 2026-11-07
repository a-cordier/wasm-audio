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

import { MidiRingBuffer } from "../../midi/transport/ring-buffer";
import { RudimentConfigBuffer } from "./config-buffer";
import { DrumPatternBuffer } from "./pattern-buffer";

/** `step` = the pattern position, `grid` = steps since the pattern origin
 * (lanes derive their own polymetric positions from it); both −1 = stopped. */
export type PositionCallback = (step: number, grid: number) => void;
export type PatternAppliedCallback = (index: number) => void;
export type MuteAppliedCallback = (muted: boolean) => void;

/**
 * AudioWorkletNode wrapper for the rudiment processor.
 */
export class RudimentNode extends AudioWorkletNode {
  readonly config: RudimentConfigBuffer;
  readonly pattern: DrumPatternBuffer;
  // 256 slots: a full-kit step bursts 2 × 11 events at one boundary.
  readonly outputRing: MidiRingBuffer;

  private positionCallback: PositionCallback | null = null;
  private patternAppliedCallback: PatternAppliedCallback | null = null;
  private muteAppliedCallback: MuteAppliedCallback | null = null;

  constructor(context: AudioContext) {
    super(context, "rudiment", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });

    this.config = new RudimentConfigBuffer();
    this.pattern = new DrumPatternBuffer();
    this.outputRing = new MidiRingBuffer(256);

    this.port.postMessage({
      type: "__init_sab",
      configBuffer: this.config.buffer,
      patternBuffer: this.pattern.buffer,
      ringBuffer: this.outputRing.buffer,
    });

    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  private onMessage(msg: { type: string; step?: number; grid?: number; index?: number; muted?: boolean }): void {
    if (msg.type === "__position" && this.positionCallback) {
      this.positionCallback(msg.step ?? -1, msg.grid ?? -1);
    } else if (msg.type === "__pattern_applied" && this.patternAppliedCallback) {
      this.patternAppliedCallback(msg.index ?? 0);
    } else if (msg.type === "__mute_applied" && this.muteAppliedCallback) {
      this.muteAppliedCallback(msg.muted === true);
    }
  }

  onPosition(callback: PositionCallback): void {
    this.positionCallback = callback;
  }

  /** Fired when a frame-targeted pattern switch lands on its boundary. */
  onPatternApplied(callback: PatternAppliedCallback): void {
    this.patternAppliedCallback = callback;
  }

  /** Fired when a mute change (immediate or frame-targeted) takes effect. */
  onMuteApplied(callback: MuteAppliedCallback): void {
    this.muteAppliedCallback = callback;
  }

  /** `startAtFrame` > 0 parks the clock until that frame (mod 2^24). */
  start(startAtFrame = 0): void {
    this.port.postMessage({ type: "__start", startAtFrame });
  }

  stop(): void {
    this.port.postMessage({ type: "__stop" });
  }

  /** Queues a pattern switch for the step boundary at `frame` (mod 2^24);
   * the processor confirms with __pattern_applied. */
  patternAt(index: number, frame: number): void {
    this.port.postMessage({ type: "__pattern_at", index, frame });
  }

  cancelPatternTarget(): void {
    this.port.postMessage({ type: "__pattern_cancel" });
  }

  /** Mute/unmute note emission; frame 0 applies immediately. */
  setMute(muted: boolean, frame = 0): void {
    this.port.postMessage({ type: "__mute", muted, frame });
  }

  pause(): void {
    this.port.postMessage({ type: "__pause" });
  }

  resume(): void {
    this.port.postMessage({ type: "__resume" });
  }

  dispose(): void {
    // Post first: the processor must receive __dispose before the port closes.
    this.port.postMessage({ type: "__dispose" });
    this.port.onmessage = null;
    this.port.close();
    this.positionCallback = null;
    this.patternAppliedCallback = null;
    this.muteAppliedCallback = null;
    this.disconnect();
  }
}
