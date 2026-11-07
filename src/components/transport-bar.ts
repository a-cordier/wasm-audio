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
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { TransportController } from "../midi/transport/transport-controller";

import "./common/lcd/lcd-element";

const TAP_TIMEOUT_MS = 2000;
const TAP_AVERAGE = 4;
const BEATS_PER_BAR = 4;

/**
 * The master transport strip (the mother clock's face): PLAY/STOP, BPM, and
 * a bar.beat position readout in one thin full-width band pinned to the top
 * screen edge. The global menu (app presets…) docks on its right through
 * the "menu" slot. Devices follow it only when their slot's SYNC is on.
 */
@customElement("transport-bar")
export class TransportBar extends LitElement {
  @property({ attribute: false })
  transport?: TransportController;

  @property({ attribute: false })
  audioContext?: AudioContext;

  @state()
  private playing = false;

  @state()
  private bpm = 120;

  @state()
  private position = "1.1";

  private rafId = 0;
  private tapTimes: number[] = [];

  private onTransportState = (e: Event) => {
    this.playing = (e as CustomEvent).detail.playing;
    if (this.playing) this.startPositionLoop();
    else this.position = "1.1";
  };

  private onTransportTempo = (e: Event) => {
    this.bpm = (e as CustomEvent).detail.bpm;
  };

  private onVisibilityChange = () => {
    cancelAnimationFrame(this.rafId);
    if (!document.hidden && this.playing) this.startPositionLoop();
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.transport) {
      this.transport.addEventListener("transport-state", this.onTransportState);
      this.transport.addEventListener("transport-tempo", this.onTransportTempo);
      this.playing = this.transport.isPlaying;
      this.bpm = this.transport.bpm;
    }
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.transport) {
      this.transport.removeEventListener("transport-state", this.onTransportState);
      this.transport.removeEventListener("transport-tempo", this.onTransportTempo);
    }
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    cancelAnimationFrame(this.rafId);
  }

  private startPositionLoop() {
    cancelAnimationFrame(this.rafId);
    const update = () => {
      if (!this.playing || !this.transport || !this.audioContext) return;
      const beats = Math.max(0, this.transport.beatsAt(this.audioContext.currentTime));
      const bar = Math.floor(beats / BEATS_PER_BAR) + 1;
      const beat = (Math.floor(beats) % BEATS_PER_BAR) + 1;
      const text = `${bar}.${beat}`;
      if (text !== this.position) this.position = text;
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  private togglePlay() {
    if (!this.transport) return;
    if (this.transport.isPlaying) this.transport.stop();
    else this.transport.start();
  }

  private setBpm(bpm: number) {
    this.transport?.setBpm(bpm);
  }

  private onTap = () => {
    const now = performance.now();
    if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > TAP_TIMEOUT_MS) {
      this.tapTimes = [];
    }
    this.tapTimes.push(now);
    if (this.tapTimes.length > TAP_AVERAGE + 1) this.tapTimes.shift();
    if (this.tapTimes.length >= 2) {
      const gaps = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        gaps.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      this.setBpm(Math.round(60000 / avg));
    }
  };

  render() {
    return html`
      <div class="bar">
        <div class="side"></div>
        <div class="transport">
        <button
          class=${classMap({ "round-btn": true, active: this.playing })}
          title=${this.playing ? "Stop all synced devices" : "Start all synced devices"}
          @click=${this.togglePlay}
        >${this.playing ? "■" : "▶"}</button>
        <div class="bpm-group">
          <button class="inc-btn" @click=${() => this.setBpm(this.bpm - 1)}>-</button>
          <lcd-element .text=${String(this.bpm)}></lcd-element>
          <button class="inc-btn" @click=${() => this.setBpm(this.bpm + 1)}>+</button>
          <button class="tap-btn" title="Tap tempo" @click=${this.onTap}>TAP</button>
        </div>
        <div class="position">
          <lcd-element .text=${this.position}></lcd-element>
        </div>
        </div>
        <div class="side menu"><slot name="menu"></slot></div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      border-bottom: 1px solid var(--medium, #2b3844);
      background: var(--transport-bar-bg, #181818);
      --lcd-screen-width: 52px;
      --lcd-font-size: 11px;
    }

    /* Transport centred; the global menu (presets…) docks right. */
    .bar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 18px;
      padding: 6px 1.5em;
    }

    .transport {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .side.menu {
      display: flex;
      justify-content: flex-end;
    }

    .round-btn {
      width: 30px;
      height: 30px;
      border-radius: 4px;
      border: 1px solid var(--light-secondary, #cbe2f3);
      background: var(--dark-secondary, #192734);
      color: var(--lighter, #fff);
      font-size: 0.7em;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .round-btn.active {
      background: var(--transport-active-color, #b4d455);
      color: var(--darker, #15202b);
      border-color: var(--transport-active-color, #b4d455);
    }

    .bpm-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .inc-btn,
    .tap-btn {
      height: 24px;
      padding: 0 8px;
      font-size: 0.6em;
      font-weight: 700;
      background: var(--dark-secondary, #192734);
      color: var(--lighter, #fff);
      border: 1px solid var(--light-secondary, #cbe2f3);
      border-radius: 3px;
      cursor: pointer;
    }

    .position {
      --lcd-screen-width: 64px;
    }
  `;
}
