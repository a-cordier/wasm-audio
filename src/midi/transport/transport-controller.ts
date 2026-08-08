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

import { TransportAnchor, TransportChild } from "../../core/types";

/**
 * The DAW master transport (the "mother" clock). Owned by the shell, one per
 * app — the KeyboardController pattern. Children opt in per slot (SYNC) and
 * follow start/stop/tempo; everything is anchored on the AudioContext clock,
 * which every worklet shares, so children never drift from the master or
 * from each other.
 *
 * Command sources: today the transport bar / shell API is the only one. An
 * external MIDI-clock-in adapter later maps 0xFA/FB/FC (+0xF8 tempo
 * estimation) onto the same start()/stop()/setBpm() calls — children cannot
 * tell the difference, by design.
 */
export class TransportController extends EventTarget {
  /**
   * Lead time before the shared start frame — just enough for the __start
   * port messages to reach every child worklet (~1-2 ms in practice). The
   * sequencer pre-rolls its scheduler through this window, so the first
   * notes sound exactly ON the anchor frame: total play latency ≈ this.
   */
  private static readonly START_DELAY_S = 0.025;

  private ctx: AudioContext;
  private _bpm = 120;
  private _playing = false;
  private _anchorTime = 0;
  private children = new Set<TransportChild>();

  constructor(ctx: AudioContext) {
    super();
    this.ctx = ctx;
  }

  get bpm(): number {
    return this._bpm;
  }

  get isPlaying(): boolean {
    return this._playing;
  }

  /** Beats elapsed at context time t; negative before the anchor. */
  beatsAt(t: number): number {
    return ((t - this._anchorTime) * this._bpm) / 60;
  }

  anchor(): TransportAnchor {
    return {
      contextTime: this._anchorTime,
      bpm: this._bpm,
      startFrame: Math.round(this._anchorTime * this.ctx.sampleRate),
    };
  }

  /**
   * The next master beat boundary at least `minLeadSeconds` away, as a
   * context frame — where a child's LOCAL start lands while the master runs
   * (Ableton-style quantized launch). When stopped, just "soon".
   */
  nextBeatFrame(minLeadSeconds = TransportController.START_DELAY_S): number {
    const sr = this.ctx.sampleRate;
    const t = this.ctx.currentTime + minLeadSeconds;
    if (!this._playing) return Math.round(t * sr);
    const beatLen = 60 / this._bpm;
    const beats = Math.ceil((t - this._anchorTime) / beatLen);
    return Math.round((this._anchorTime + beats * beatLen) * sr);
  }

  start(): void {
    if (this._playing) return;
    this._playing = true;
    this.dispatchEvent(new CustomEvent("transport-state", { detail: { playing: true } }));
    if (this.ctx.state === "suspended") {
      // The first resume spins up the audio hardware (seconds on Bluetooth).
      // Anchoring on the frozen clock would park every child on a stale
      // frame — wait for the clock to actually run, then place the downbeat.
      void this.ctx.resume().then(() => {
        if (this._playing) this.beginPlayback();
      });
      return;
    }
    this.beginPlayback();
  }

  private beginPlayback(): void {
    // Anchor slightly ahead so every child arms the SAME future frame —
    // a sample-aligned common downbeat.
    this._anchorTime = this.ctx.currentTime + TransportController.START_DELAY_S;
    const anchor = this.anchor();
    for (const child of this.children) child.onMasterStart(anchor);
  }

  stop(): void {
    if (!this._playing) return;
    this._playing = false;
    for (const child of this.children) child.onMasterStop();
    this.dispatchEvent(new CustomEvent("transport-state", { detail: { playing: false } }));
  }

  setBpm(bpm: number): void {
    const next = Math.max(20, Math.min(300, Math.round(bpm)));
    if (next === this._bpm) return;
    // Re-anchor so the current beat position is preserved: tempo changes
    // alter the RATE from here on (the sequencer clock behaves identically).
    if (this._playing) {
      const beats = this.beatsAt(this.ctx.currentTime);
      this._anchorTime = this.ctx.currentTime - (beats * 60) / next;
    }
    this._bpm = next;
    for (const child of this.children) child.onMasterTempo(next);
    this.dispatchEvent(new CustomEvent("transport-tempo", { detail: { bpm: next } }));
  }

  /** Attaching mid-run syncs tempo immediately and joins a running master. */
  addChild(child: TransportChild): void {
    if (this.children.has(child)) return;
    this.children.add(child);
    child.onMasterTempo(this._bpm);
    if (this._playing) child.onMasterStart(this.anchor());
  }

  removeChild(child: TransportChild): void {
    this.children.delete(child);
  }
}
