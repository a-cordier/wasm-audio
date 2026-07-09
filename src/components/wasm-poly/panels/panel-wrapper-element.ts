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

@customElement("panel-wrapper-element")
export class PanelWrapper extends LitElement {
  @property({ type: String })
  private label = String();

  render() {
    return html`
      <div class="wrapper">
        <div class="header">
          <label>${this.label}</label>
          <slot name="header"></slot>
        </div>
        <div class="content">
          <slot></slot>
          <slot name="controls"></slot>
        </div>
        <div class="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .wrapper {
        position: relative;

        width: 100%;
        box-sizing: border-box;

        background-color: var(--panel-wrapper-background-color, transparent);

        border-radius: 0.5rem;

        padding: 0.25em;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      label {
        display: block;
        color: var(--panel-wrapper-label-color, white);
        margin: 0 auto 0.5em auto;
        text-align: center;
      }

      .content {
        width: 100%;
      }

      .footer:empty {
        display: none;
      }
    `;
  }
}
