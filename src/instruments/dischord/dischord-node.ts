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
import { DischordConfigBuffer } from "./config-buffer";
import { ChordPatternBuffer } from "./pattern-buffer";

export type PositionCallback = (step: number) => void;
export type StoppedCallback = () => void;
export type PatternAppliedCallback = (index: number) => void;
export type MuteAppliedCallback = (muted: boolean) => void;

/**
 * AudioWorkletNode wrapper for the dischord processor.
 * Manages SAB allocation and transport messages.
 */
export class DischordNode extends AudioWorkletNode {
  readonly config: DischordConfigBuffer;
  readonly pattern: ChordPatternBuffer;
  // 256 slots (sequels uses 128): a chord step bursts up to ~3N events at
  // one boundary (ons + held offs + gated offs), so the headroom doubles.
  readonly outputRing: MidiRingBuffer;

  private positionCallback: PositionCallback | null = null;
  private stoppedCallback: StoppedCallback | null = null;
  private patternAppliedCallback: PatternAppliedCallback | null = null;
  private muteAppliedCallback: MuteAppliedCallback | null = null;

  constructor(context: AudioContext) {
    super(context, "dischord", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });

    this.config = new DischordConfigBuffer();
    this.pattern = new ChordPatternBuffer();
    this.outputRing = new MidiRingBuffer(256);

    this.port.postMessage({
      type: "__init_sab",
      configBuffer: this.config.buffer,
      patternBuffer: this.pattern.buffer,
      ringBuffer: this.outputRing.buffer,
    });

    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  private onMessage(msg: { type: string; step?: number; index?: number; muted?: boolean }): void {
    if (msg.type === "__position" && this.positionCallback) {
      this.positionCallback(msg.step ?? -1);
    } else if (msg.type === "__stopped" && this.stoppedCallback) {
      this.stoppedCallback();
    } else if (msg.type === "__pattern_applied" && this.patternAppliedCallback) {
      this.patternAppliedCallback(msg.index ?? 0);
    } else if (msg.type === "__mute_applied" && this.muteAppliedCallback) {
      this.muteAppliedCallback(msg.muted === true);
    }
  }

  onPosition(callback: PositionCallback): void {
    this.positionCallback = callback;
  }

  /** Fired when the worklet ends a non-looping sequence on its own. */
  onStopped(callback: StoppedCallback): void {
    this.stoppedCallback = callback;
  }

  /** Fired when a frame-targeted pattern switch lands on its boundary. */
  onPatternApplied(callback: PatternAppliedCallback): void {
    this.patternAppliedCallback = callback;
  }

  /** Fired when a mute change (immediate or frame-targeted) takes effect. */
  onMuteApplied(callback: MuteAppliedCallback): void {
    this.muteAppliedCallback = callback;
  }

  /**
   * `startAtFrame` > 0 parks the clock until that AudioContext frame
   * (mod 2^24) — how synced sequencers hit a sample-aligned common downbeat.
   * No count-in: dischord has no recorder, which is the only thing a
   * pre-roll ever served.
   */
  start(startAtFrame = 0): void {
    this.port.postMessage({ type: "__start", startAtFrame });
  }

  stop(): void {
    this.port.postMessage({ type: "__stop" });
  }

  /**
   * Queues a pattern switch for the step boundary at `frame` (mod 2^24).
   * The processor confirms with __pattern_applied — the main thread must NOT
   * write ACTIVE_PATTERN until then (the per-block config check would race).
   */
  patternAt(index: number, frame: number): void {
    this.port.postMessage({ type: "__pattern_at", index, frame });
  }

  /** Drops a queued frame-targeted pattern switch, if any. */
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
    this.stoppedCallback = null;
    this.patternAppliedCallback = null;
    this.muteAppliedCallback = null;
    this.disconnect();
  }
}
