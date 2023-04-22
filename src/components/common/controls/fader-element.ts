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
import { LitElement, html, css, customElement, property } from "lit-element";
import { styleMap } from "lit-html/directives/style-map";
import { clamp } from "./clamp";

@customElement("fader-element")
export class Fader extends LitElement {
  @property({ type: String })
  public label = String();

  @property({ type: Number })
  public value = 127;

  toggleActive(event) {
    const host = this.shadowRoot.host as HTMLElement;
    const parent = host.offsetParent as HTMLElement;
    const wrapper = this.cursorWrapperElement;
    const height = wrapper.offsetHeight;
    const position = event.pageY - (parent.offsetTop + wrapper.offsetTop);

    this.updateValue((1 - position / height) * 127);

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

  computeFaderCursorStyle() {
    return styleMap({
      height: `${(this.value / 127) * 100}%`,
    });
  }

  get cursorElement() {
    return html` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`;
  }

  get cursorWrapperElement(): HTMLElement {
    return this.shadowRoot.querySelector(".cursor-wrapper");
  }

  render() {
    return html`
      <div class="fader">
        <div class="fader-wrapper">
          <div
            class="cursor-wrapper"
            @mousedown="${this.toggleActive}"
            @wheel="${this.onWheel}"
          >
            ${this.cursorElement}
          </div>
        </div>
        <label>${this.label}</label>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .fader {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .fader-wrapper {
        width: var(--fader-width, 20px);
        height: var(--fader-height, 100px);
        border: 2px solid var(--lighter-color, white);
        border-radius: 4px;
        padding: 1px;
      }

      .cursor-wrapper {
        width: 100%;
        height: 100%;
        margin: 0 auto;

        position: relative;
      }

      .fader-cursor {
        display: block;
        width: 100%;

        background-color: var(--control-handle-color);

        position: absolute;
        bottom: 0;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
        margin-top: 0.3em;
      }
    `;
  }
}
