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
import type { Plugin } from "../../../core/types";
import { ControlID } from "../../../control/types";
import { EchoController } from "../echo-controller";
import { EchoState } from "../types/echo-state";
import { EchoEvent } from "../types/echo-event";

import "../../../components/common/controls/knob-element";
import "../../../components/common/controls/control-learn-wrapper";

/**
 * The echo panel: one zone, three MIDI-learnable knobs. 100% wet by design —
 * the mix lives on the mixer strips (per-channel SEND = amount, this
 * device's own strip = return level).
 */
@customElement("echo-element")
export class EchoElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @state()
  private delay: EchoState["delay"] | null = null;

  private get controller(): EchoController {
    return this.plugin as EchoController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onDelay = (e: Event) => { this.delay = { ...(e as CustomEvent).detail }; };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    this.delay = this.controller.getState().delay;
    this.controller.addEventListener(EchoEvent.DELAY, this.onDelay);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!this.plugin) return;
    this.controller.removeEventListener(EchoEvent.DELAY, this.onDelay);
  }

  // Composed so the shell hears it and snapshots the session.
  private notifyChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.delay) return html``;
    return html`
      <div class="effect">
        <div class="zone">
          <label class="zone-label">DELAY</label>
          <div class="knobs">
            ${this.knob("TIME", ControlID.ECHO_TIME, this.delay.time.value, (v) => this.controller.setTime(v))}
            ${this.knob("FDBK", ControlID.ECHO_FEEDBACK, this.delay.feedback.value, (v) => this.controller.setFeedback(v))}
            ${this.knob("TONE", ControlID.ECHO_TONE, this.delay.tone.value, (v) => this.controller.setTone(v))}
          </div>
        </div>
      </div>
    `;
  }

  private knob(label: string, controlID: ControlID, value: number, onChange: (v: number) => void) {
    return html`
      <control-learn-wrapper .controlID=${controlID}>
        <knob-element
          .value=${value}
          .range=${{ min: 0, max: 127 }}
          .step=${1}
          .label=${label}
          @change=${(e: CustomEvent) => { onChange(e.detail.value); this.notifyChanged(); }}
        ></knob-element>
      </control-learn-wrapper>
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* One Pantone accent per device; tints the controls. */
      --control-cursor-color: var(--echo-accent, #d97f43);
      --control-label-color: var(--light-secondary);
    }

    .effect {
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
      background: var(--echo-delay-panel-color, #33302d);
    }

    .zone-label {
      align-self: flex-start;
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
    }

    .knobs {
      display: flex;
      gap: 0.8em;
      --knob-size: 34px;
      --control-label-font-size: 0.62em;
    }
  `;
}
