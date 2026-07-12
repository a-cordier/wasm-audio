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
import { clamp } from "./clamp";
import type { FaderSkin } from "./skins/types";
import { faderChannelStripSkin } from "./skins/fader-channel-strip-skin";

@customElement("fader-element")
export class Fader extends LitElement {
  @property({ type: String })
  public label = String();

  @property({ type: Number })
  public value = 127;

  @property({ attribute: false })
  public skin: FaderSkin = faderChannelStripSkin;

  toggleActive(event) {
    const svgEl = this.shadowRoot.querySelector(".fader-svg") as SVGElement;
    const rect = svgEl.getBoundingClientRect();
    const position = (event.clientY - rect.top) / rect.height;

    this.updateValue((1 - position) * 127);

    const drag = (event: DragEvent) => {
      event.preventDefault();
      this.updateValue(this.value - event.movementY);
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
    this.updateValue(this.value + event.deltaY);
  }

  updateValue(value) {
    this.value = clamp({ min: 0, max: 127 }, value);
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    const normalizedValue = this.value / 127;
    return html`
      <div
        class="fader"
        @mousedown="${this.toggleActive}"
        @wheel="${this.onWheel}"
      >
        ${this.skin.render({ value: normalizedValue, active: false })}
        <label>${this.label}</label>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        user-select: none;
      }

      .fader {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .fader-svg {
        width: var(--fader-width, 50px);
        height: var(--fader-height, 140px);
        cursor: pointer;
        outline: 1px solid var(--learn-outline-color, transparent);
        outline-offset: 2px;
        border-radius: 4px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size, 0.8em);
        margin-top: 0.3em;
      }
    `;
  }
}
