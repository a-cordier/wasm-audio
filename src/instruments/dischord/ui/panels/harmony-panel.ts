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
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ControlID } from "../../../../control/types";
import { ChangeDetail } from "../../../../types/events";
import { KEY_NAMES, SCALE_NAMES } from "../../chords";
import { EmitOrder, MAX_STRUM_MS, Voicing } from "../../types";
import "../../../../components/common/controls/knob-element";

export const enum HarmonyEvent {
  KEY = "key",
  SCALE = "scale",
  VOICES = "voices",
  VOICING = "voicing",
  ORDER = "order",
  STRUM = "strum",
}

/** VOICES 3/4/5 in musician's words. */
const VOICES_NAMES: Record<number, string> = { 3: "TRI", 4: "7TH", 5: "9TH" };

@customElement("harmony-panel")
export class HarmonyPanel extends LitElement {
  /** Key root, 0 = C .. 11 = B. */
  @property({ type: Number })
  keyRoot = 0;

  /** Index into SCALE_NAMES. */
  @property({ type: Number })
  scale = 0;

  /** Diatonic stack height, 3-5. */
  @property({ type: Number })
  voices = 3;

  @property({ type: Number })
  voicing: number = Voicing.ROOT;

  @property({ type: Number })
  order: number = EmitOrder.LEAD;

  /** Strum gap between raked notes, ms. */
  @property({ type: Number })
  strum = 0;

  render() {
    return html`
      <div class="harmony">
        <div class="panel">
          ${this.stepper("KEY", KEY_NAMES[this.keyRoot] ?? "C", HarmonyEvent.KEY, this.keyRoot - 1, this.keyRoot + 1)}
          ${this.stepper("SCALE", SCALE_NAMES[this.scale] ?? "MAJ", HarmonyEvent.SCALE, this.scale - 1, this.scale + 1)}
          ${this.stepper("VOICES", VOICES_NAMES[this.voices] ?? "TRI", HarmonyEvent.VOICES, this.voices - 1, this.voices + 1)}
        </div>
        <div class="panel">
          <div class="pair" title="Chord voicing: literal root position, or the inversion that moves least from the previous chord">
            <button
              class=${classMap({ "toggle-btn": true, active: this.voicing === Voicing.ROOT })}
              @click=${() => this.emit(HarmonyEvent.VOICING, Voicing.ROOT)}
            >
              ROOT
            </button>
            <button
              class=${classMap({ "toggle-btn": true, active: this.voicing === Voicing.SMOOTH })}
              @click=${() => this.emit(HarmonyEvent.VOICING, Voicing.SMOOTH)}
            >
              SMOOTH
            </button>
          </div>
          <div class="pair" title="Note-emission order — a mono target plays the last note: LEAD = top voice, BASS = root">
            <button
              class=${classMap({ "toggle-btn": true, active: this.order === EmitOrder.LEAD })}
              @click=${() => this.emit(HarmonyEvent.ORDER, EmitOrder.LEAD)}
            >
              LEAD
            </button>
            <button
              class=${classMap({ "toggle-btn": true, active: this.order === EmitOrder.BASS })}
              @click=${() => this.emit(HarmonyEvent.ORDER, EmitOrder.BASS)}
            >
              BASS
            </button>
          </div>
          <control-learn-wrapper .controlID=${ControlID.DIS_STRUM}>
            <knob-element
              .value=${this.strum}
              .range=${{ min: 0, max: MAX_STRUM_MS }}
              .step=${1}
              .label=${"STRUM"}
              label-position="left"
              title="Rake the chord: gap between consecutive notes, in milliseconds"
              @change=${(e: CustomEvent) => this.emit(HarmonyEvent.STRUM, e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
        </div>
      </div>
    `;
  }

  /** Label + [-] value [+]; every setting stays visible instead of click-to-cycle. */
  private stepper(label: string, value: string, event: HarmonyEvent, prev: number, next: number) {
    return html`
      <div class="stepper">
        <label class="ctrl-label">${label}</label>
        <div class="lcd-row">
          <button class="inc-btn" @click=${() => this.emit(event, prev)}>-</button>
          <lcd-element .text=${value}></lcd-element>
          <button class="inc-btn" @click=${() => this.emit(event, next)}>+</button>
        </div>
      </div>
    `;
  }

  private emit<T extends string>(type: T, value: number | string) {
    this.dispatchEvent(
      new CustomEvent<ChangeDetail<T>>("change", {
        detail: { type, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      --control-label-color: var(--light-secondary);
      --knob-size: 26px;
    }

    .harmony {
      display: flex;
      align-items: stretch;
      gap: 0.4em;
      flex-wrap: wrap;
    }

    .panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6em;
      padding: 0.5em 0.6em;
      background: var(--dischord-harmony-panel-color, var(--dischord-panel-color));
      border-radius: 0.4rem;
      flex: 1 1 auto;
      flex-wrap: wrap;
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
    }

    .pair {
      display: flex;
      align-items: center;
      gap: 0.25em;
    }

    .lcd-row {
      display: flex;
      align-items: center;
      gap: 0.2em;
      --lcd-screen-width: 3.2em;
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .inc-btn:hover {
      background: var(--medium);
    }

    .ctrl-label {
      font-size: var(--control-label-font-size);
      color: var(--light-secondary);
    }

    .toggle-btn {
      padding: 0.25em 0.4em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.65em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .toggle-btn:hover:not(:disabled) {
      background: var(--medium);
    }

    .toggle-btn.active {
      background: var(--dischord-accent);
      color: var(--darker);
      border-color: var(--dischord-accent);
    }
  `;
}
