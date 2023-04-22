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
import { classMap } from "lit-html/directives/class-map";

import "../../../common/lcd/lcd-element";
import { SelectOptions } from "../../../../types/select-option";

@customElement("lcd-selector-element")
export class LCDSelector extends LitElement {
  @property({ type: Object })
  private options: SelectOptions;

  @property({ type: Object })
  private value;

  render() {
    return html`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.options.selectValue(this.value);
  }

  createOptionSelector(_: never, index: number) {
    return html`
      <button @click=${this.createOptionHandler(index)} class="${this.computeButtonClasses(index)}">${index}</button>
    `;
  }

  computeButtonClasses(index: number) {
    return classMap({
      active: this.options.index === index,
    });
  }

  createOptionHandler(index) {
    return () => {
      this.options.index = index;
      this.requestUpdate();
      this.dispatchChange(this.options.getCurrent());
    };
  }

  nextOption() {
    this.options.next();
    this.requestUpdate();
    this.dispatchChange(this.options.getCurrent());
  }

  previousOption() {
    this.options.previous();
    this.requestUpdate();
    this.dispatchChange(this.options.getCurrent());
  }

  dispatchChange({ value }) {
    this.dispatchEvent(new CustomEvent("change", { detail: { value } }));
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .lcd-selector {
        margin: auto;
      }

      .lcd-selector .options {
        display: flex;
        justify-content: space-between;
        margin: 0.5rem auto 0.5rem auto;

        width: 80%;
      }

      button {
        font-size: var(--button-font-size, 0.5em);

        background-color: var(--button-disposed-background-color);
        border: var(--button-border);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        color: var(--button-disposed-label-color);
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);

        cursor: auto;
      }
    `;
  }
}
