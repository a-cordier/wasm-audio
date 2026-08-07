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
import { ControlID } from "../../../control/types";
import { TemplateController } from "../template-controller";
import { TemplateState } from "../types/template-state";
import { TemplateEvent } from "../types/template-event";
import { TemplateWave } from "../types/template-params";

import "../../../components/common/controls/knob-element";
import "../../../components/common/controls/control-learn-wrapper";

const WAVES = [
  { value: TemplateWave.SINE, label: "SINE" },
  { value: TemplateWave.SAW, label: "SAW" },
  { value: TemplateWave.SQUARE, label: "SQUARE" },
];

/**
 * Reference UI. Demonstrates the three control idioms on one neutral panel
 * with a two-zone camaïeu: mode-selector buttons (WAVE), a stepper (OCTAVE),
 * and knobs (ATTACK / RELEASE / LEVEL, MIDI-learnable).
 */
@customElement("template-element")
export class TemplateElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @state()
  private osc: TemplateState["osc"] | null = null;

  @state()
  private amp: TemplateState["amp"] | null = null;

  private get controller(): TemplateController {
    return this.plugin as TemplateController;
  }

  // Stable handler identities so add/removeEventListener stay symmetric:
  // controllers are plain EventTargets, and a disconnected element MUST
  // unsubscribe or the controller keeps it alive forever.
  private onOsc = (e: Event) => { this.osc = { ...(e as CustomEvent).detail }; };
  private onAmp = (e: Event) => { this.amp = { ...(e as CustomEvent).detail }; };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    const s = this.controller.getState();
    this.osc = s.osc;
    this.amp = s.amp;
    this.controller.addEventListener(TemplateEvent.OSC, this.onOsc);
    this.controller.addEventListener(TemplateEvent.AMP, this.onAmp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!this.plugin) return;
    this.controller.removeEventListener(TemplateEvent.OSC, this.onOsc);
    this.controller.removeEventListener(TemplateEvent.AMP, this.onAmp);
  }

  render() {
    if (!this.osc || !this.amp) return html``;
    const shift = this.osc.octave.value - 2;
    return html`
      <div class="synth">
        <div class="zone osc">
          <label class="zone-label">OSC</label>
          <div class="waves">
            ${WAVES.map(
              (w) => html`
                <button
                  class=${classMap({ "name-btn": true, active: this.osc!.wave.value === w.value })}
                  @click=${() => this.controller.setWave(w.value)}
                >
                  ${w.label}
                </button>
              `
            )}
          </div>
          <div class="stepper">
            <label class="ctrl-label">OCT</label>
            <button class="inc-btn" @click=${() => this.setOctave(this.osc!.octave.value - 1)}>-</button>
            <lcd-element .text=${`${shift > 0 ? "+" : ""}${shift}`}></lcd-element>
            <button class="inc-btn" @click=${() => this.setOctave(this.osc!.octave.value + 1)}>+</button>
          </div>
        </div>

        <div class="zone amp">
          <label class="zone-label">AMP</label>
          <div class="knobs">
            ${this.knob("ATK", ControlID.TPL_ATTACK, this.amp.attack.value, (v) => this.controller.setAttack(v))}
            ${this.knob("REL", ControlID.TPL_RELEASE, this.amp.release.value, (v) => this.controller.setRelease(v))}
            ${this.knob("LVL", ControlID.TPL_LEVEL, this.amp.level.value, (v) => this.controller.setLevel(v))}
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
          @change=${(e: CustomEvent) => onChange(e.detail.value)}
        ></knob-element>
      </control-learn-wrapper>
    `;
  }

  private setOctave(next: number) {
    this.controller.setOctave(Math.max(0, Math.min(4, next)));
  }

  static styles = css`
    :host {
      display: block;
      /* One Pantone accent per instrument; tints the controls. */
      --control-cursor-color: var(--template-accent, #b57edc);
      --control-label-color: var(--light-secondary);
    }

    .synth {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5em;
      background: var(--main-panel-color);
      border-radius: 0 0 0.5rem 0.5rem;
      padding: 1em;
      box-sizing: border-box;
    }

    /* Neutral charcoal zones, each nudged toward its own hue — the camaïeu. */
    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6em;
      padding: 0.7em 0.8em;
      border-radius: 0.4rem;
    }
    .zone.osc { background: var(--template-osc-panel-color, #2f2f31); }
    .zone.amp { background: var(--template-amp-panel-color, #2f2f31); }

    .zone-label {
      align-self: flex-start;
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
    }

    /* Mode selector: full-width name buttons spanning the zone. */
    .waves {
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
    .name-btn:hover { background: var(--medium); }
    .name-btn.active {
      background: var(--template-accent, #b57edc);
      border-color: var(--template-accent, #b57edc);
      color: var(--darker);
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
      --lcd-screen-width: 2.6em;
    }
    .ctrl-label {
      font-size: var(--control-label-font-size);
      color: var(--light-secondary);
      margin-right: 0.2em;
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
    .inc-btn:hover { background: var(--medium); }

    .knobs {
      display: flex;
      gap: 0.8em;
      --knob-size: 34px;
      --control-label-font-size: 0.62em;
    }
  `;
}
