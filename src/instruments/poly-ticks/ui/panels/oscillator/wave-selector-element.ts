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
import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { OscillatorMode } from "../../../types/oscillator-mode";

import "../../../../../components/common/icons/sine-wave-icon";
import "../../../../../components/common/icons/square-wave-icon";
import "../../../../../components/common/icons/sawtooth-wave-icon";
import "../../../../../components/common/icons/triangle-wave-icon";

const WAVE_ICONS: Record<OscillatorMode, () => TemplateResult> = {
  [OscillatorMode.SAWTOOTH]: () => html`<saw-wave-icon class="icon"></saw-wave-icon>`,
  [OscillatorMode.SQUARE]: () => html`<square-wave-icon class="icon"></square-wave-icon>`,
  [OscillatorMode.TRIANGLE]: () => html`<triangle-wave-icon class="icon"></triangle-wave-icon>`,
  [OscillatorMode.SINE]: () => html`<sine-wave-icon class="icon"></sine-wave-icon>`,
};

const ALL_MODES = [OscillatorMode.SAWTOOTH, OscillatorMode.SQUARE, OscillatorMode.TRIANGLE, OscillatorMode.SINE];

@customElement("wave-selector-element")
export class WaveSelector extends LitElement {
  @property({ type: Number })
  public value = OscillatorMode.SINE;

  @property({ type: Array })
  public modes: OscillatorMode[] = ALL_MODES;

  private select(mode: OscillatorMode) {
    this.value = mode;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    return html`
      <div class="wave-selector">
        ${this.modes.map(mode => html`
          <button
            class=${classMap({ active: mode === this.value })}
            @click=${() => this.select(mode)}
          >${WAVE_ICONS[mode]()}</button>
        `)}
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        width: 100%;
      }

      .wave-selector {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        width: var(--button-width, 25px);
        height: var(--button-height, 25px);
        font-size: var(--button-font-size, 1.5em);

        background-color: var(--button-disposed-background-color);
        border: 1px solid var(--button-border-color, #ccc);
        border-radius: var(--button-border-radius, 50%);
        box-shadow: var(--box-shadow);
        box-sizing: border-box;
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        padding: var(--button-padding, 0);

        --stroke-color: var(--button-disposed-label-color);
      }

      button .icon {
        margin-top: -2px;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        --stroke-color: var(--button-active-label-color);
        border-color: var(--button-active-border-color, white);
      }
    `;
  }
}
