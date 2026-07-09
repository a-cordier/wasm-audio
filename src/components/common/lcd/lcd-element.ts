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

@customElement("lcd-element")
export class LCD extends LitElement {
  @property({ type: String })
  public text;

  render() {
    return html`
      <div class="lcd">
        <span class="lcd-text">${this.text}</span>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
      }

      .lcd {
        width: var(--lcd-screen-width, 120px);
        max-width: 100%;
        height: 100%;
        box-sizing: border-box;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 1px solid gray;

        background-color: var(--lcd-screen-background, darkslategray);
        border-color: var(--lcd-screen-border-color);

        padding: 4px 6px;
      }

      .lcd-text {
        font-family: "Silkscreen", monospace;
        font-size: var(--lcd-font-size, 10px);
        color: var(--lcd-text-color, #b4d455);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        letter-spacing: 0.5px;
      }
    `;
  }
}
