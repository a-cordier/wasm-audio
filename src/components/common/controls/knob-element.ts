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
import { clamp } from "./clamp";
import type { KnobSkin } from "./skins/types";
import { knobDefaultSkin } from "./skins/knob-default-skin";

const MIDI_RANGE = {
  min: 0,
  max: 127,
};

export interface ValueRange {
  min: number;
  max: number;
}

@customElement("knob-element")
export class Knob extends LitElement {
  @property({ type: Object })
  public range = MIDI_RANGE;

  @property({ type: Number })
  public value = 64;

  @property({ type: Number })
  public step = 1;

  @property({ type: String })
  private label: string;

  @property({ type: String, attribute: "label-position" })
  labelPosition: "bottom" | "left" = "bottom";

  @property({ attribute: false })
  public skin: KnobSkin = knobDefaultSkin;

  toggleActive() {
    const drag = (event: DragEvent) => {
      event.preventDefault();
      this.updateValue(this.computeStep(-event.movementY, event.altKey));
    };

    const destroy = () => {
      document.removeEventListener("mouseup", destroy);
      document.removeEventListener("mousemove", drag);
    };

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", destroy);
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    this.updateValue(this.computeStep(event.deltaY, event.altKey));
  }

  updateValue(step) {
    this.value = clamp(this.range, this.value + step);
  }

  computeStep(increment, sharp = false) {
    return this.computeStepMultiplier(increment, sharp) * this.step;
  }

  computeStepMultiplier(increment, sharp = false) {
    const multiplier = increment < 0 ? -1 : 1;
    return sharp ? multiplier * 0.25 : multiplier;
  }

  updated(changedProperties) {
    if (changedProperties.has("value")) {
      this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }
  }

  private get normalizedValue(): number {
    const { min, max } = this.range;
    return (this.value - min) / (max - min);
  }

  render() {
    const wrapperClasses = {
      "knob-wrapper": true,
      "label-left": this.labelPosition === "left",
    };
    return html`
      <div class=${classMap(wrapperClasses)}>
        ${this.labelPosition === "left" ? html`<span class="label">${this.label}</span>` : ""}
        <div
          class="knob-skin-wrapper"
          @mousedown="${this.toggleActive}"
          @wheel="${this.onWheel}"
        >
          ${this.skin.render({ value: this.normalizedValue, active: false })}
        </div>
        ${this.labelPosition !== "left" ? html`<span class="label">${this.label}</span>` : ""}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        user-select: none;
        outline: none;
      }

      .knob-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: var(--knob-size, 100px);
      }

      .knob-wrapper.label-left {
        flex-direction: row;
        align-items: center;
        gap: 0.4em;
        max-width: none;
      }

      .knob-skin-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .knob-svg {
        height: var(--knob-size, 100px);
        width: var(--knob-size, 100px);
        cursor: pointer;
        outline: 1px solid var(--learn-outline-color, transparent);
        outline-offset: 2px;
        border-radius: 50%;
      }

      .label {
        font-size: var(--control-label-font-size);
        color: var(--control-label-color);
        display: flex;
        justify-content: center;
        margin-top: -5px;
      }

      .label-left .label {
        margin-top: 0;
      }
    `;
  }
}
