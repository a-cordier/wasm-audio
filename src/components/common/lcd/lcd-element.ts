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

import { chars } from "./lcd-chars";

import "./lcd-char-element";

@customElement("lcd-element")
export class LCD extends LitElement {
  @property({ type: String })
  public text;

  @property({ type: Number })
  public columns = 12;

  render() {
    const gridColumns = Math.max(Array.from(this.text).length, this.columns);
    return html`
      <div
        class="lcd"
        style="grid-template-columns: repeat(${gridColumns}, 1fr)"
      >
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `;
  }

  createLcdChar(char: string) {
    const lcdChar = chars[char];
    return html`
      <lcd-char-element .char=${lcdChar} class="char"></lcd-char-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .lcd {
        width: var(--lcd-screen-width, 120px);
        height: var(--lcd-screen-height, 14px);

        display: grid;

        border: 1px solid gray;

        background-color: var(--lcd-screen-background, darkslategray);
        border-color: var(--lcd-screen-border-color);

        padding: 5px;
      }

      .char {
        width: var(--lcd-char-width, 85%);
        grid-row: 1;
      }
    `;
  }
}
