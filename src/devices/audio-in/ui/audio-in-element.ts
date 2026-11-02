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
import type { Plugin } from "../../../core/types";
import { AudioInController } from "../audio-in-controller";
import { AudioInEvent, AudioInStatus } from "../types/audio-in-event";

import "../../../components/common/lcd/lcd-element";

/**
 * The audio-input panel: the LCD is the status/device display (hardware
 * speaks through its screen, not captions), the LED shows live input level
 * pre-monitor, and the two name buttons gate the mic (ENABLE/RETRY) and the
 * room (MONITOR, default off — the feedback guard).
 */
@customElement("audio-in-element")
export class AudioInElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @state() private status: AudioInStatus = "idle";
  @state() private monitor = false;
  @state() private deviceLabel = "—";
  @state() private deviceCount = 0;
  @state() private level = 0;

  private rafId = 0;

  private get controller(): AudioInController {
    return this.plugin as AudioInController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onStatus = (e: Event) => {
    const d = (e as CustomEvent).detail;
    this.status = d.status;
    this.monitor = d.monitor;
    this.deviceLabel = d.deviceLabel;
    this.deviceCount = d.deviceCount;
  };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    this.status = this.controller.getStatus();
    this.monitor = this.controller.isMonitorOn();
    this.deviceLabel = this.controller.getCurrentDeviceLabel();
    this.deviceCount = this.controller.getDevices().length;
    this.controller.addEventListener(AudioInEvent.STATUS, this.onStatus);
    this.startLevelLoop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rafId);
    if (!this.plugin) return;
    this.controller.removeEventListener(AudioInEvent.STATUS, this.onStatus);
  }

  // The LED is cosmetic: quantized so a silent input never re-renders.
  private startLevelLoop() {
    const update = () => {
      if (!document.hidden && this.plugin) {
        const quantized = Math.min(1, Math.round(this.controller.getInputLevel() * 20) / 20);
        if (quantized !== this.level) this.level = quantized;
      }
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  // Composed so the shell hears it and snapshots the session.
  private notifyChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  private onEnable() {
    this.controller.enable();
    this.notifyChanged();
  }

  private onMonitorToggle() {
    this.controller.setMonitor(!this.monitor);
    this.notifyChanged();
  }

  private onDeviceStep(delta: number) {
    this.controller.stepDevice(delta);
    this.notifyChanged();
  }

  /** The LCD speaks for the device: its input's name, or where things stand. */
  private get lcdText(): string {
    switch (this.status) {
      case "active": return this.deviceLabel;
      case "pending": return "WAIT";
      case "denied": return "DENIED";
      case "error": return "NO INPUT";
      default: return "OFF";
    }
  }

  render() {
    const active = this.status === "active";
    const canStep = active && this.deviceCount > 1;
    const enableGhosted = active || this.status === "pending";
    return html`
      <div class="device">
        <div class="zone">
          <label class="zone-label">INPUT</label>
          <div class="io-row">
            <span
              class=${classMap({ "in-led": true, lit: active && this.level > 0.02 })}
              style="--in-level: ${active ? this.level : 0}"
            ></span>
            <div class="stepper">
              <button class="inc-btn" ?disabled=${!canStep} @click=${() => this.onDeviceStep(-1)}>-</button>
              <lcd-element .text=${this.lcdText}></lcd-element>
              <button class="inc-btn" ?disabled=${!canStep} @click=${() => this.onDeviceStep(1)}>+</button>
            </div>
          </div>
          <div class="btns">
            <button
              class="name-btn"
              ?disabled=${enableGhosted}
              @click=${this.onEnable}
            >${this.status === "denied" || this.status === "error" ? "RETRY" : "ENABLE"}</button>
            <button
              class=${classMap({ "name-btn": true, active: this.monitor })}
              ?disabled=${!active}
              @click=${this.onMonitorToggle}
            >MONITOR</button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* One Pantone accent per device; tints the controls. */
      --control-cursor-color: var(--audio-in-accent, #c75e6a);
      --control-label-color: var(--light-secondary);
    }

    .device {
      display: flex;
      justify-content: center;
      background: var(--main-panel-color);
      border-radius: 0 0 0.5rem 0.5rem;
      padding: 1em;
      box-sizing: border-box;
    }

    /* Neutral charcoal zone, nudged toward the device hue — the camaïeu. */
    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6em;
      padding: 0.7em 1.2em;
      border-radius: 0.4rem;
      background: var(--audio-in-input-panel-color, #322c2d);
    }

    .zone-label {
      align-self: flex-start;
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
    }

    .io-row {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }

    /* Input-level LED: pre-monitor, so signal shows while the room is muted. */
    .in-led {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--mixer-meter-bg, #0d1117);
      border: 1px solid var(--medium, #2b3844);
      box-sizing: border-box;
      transition: box-shadow 0.08s;
    }

    .in-led.lit {
      background: var(--audio-in-accent, #c75e6a);
      border-color: var(--audio-in-accent, #c75e6a);
      box-shadow: 0 0 calc(2px + 6px * var(--in-level, 0)) var(--audio-in-accent, #c75e6a);
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
      /* Device names run long — give the screen room and let it ellipsize. */
      --lcd-screen-width: 150px;
      --lcd-font-size: 9px;
    }

    .inc-btn {
      width: 20px;
      height: 20px;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.8em;
      cursor: pointer;
    }

    .inc-btn:hover:not(:disabled) { background: var(--medium); }

    .inc-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .btns {
      display: flex;
      width: 100%;
      gap: 0.25em;
    }

    .name-btn {
      flex: 1;
      padding: 0.35em 0;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.62em;
      font-weight: bold;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .name-btn:hover:not(:disabled) { background: var(--medium); }

    .name-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .name-btn.active {
      background: var(--audio-in-accent, #c75e6a);
      border-color: var(--audio-in-accent, #c75e6a);
      color: var(--darker);
    }
  `;
}
