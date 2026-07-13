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
import { LitElement, html, css, svg } from "lit";
import { customElement, property } from "lit/decorators.js";

const minusIcon = svg`
  <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1"/>
  <line x1="5.5" y1="10" x2="14.5" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
`;

const plusIcon = svg`
  <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1"/>
  <line x1="5.5" y1="10" x2="14.5" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="10" y1="5.5" x2="10" y2="14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
`;

@customElement("row-element")
export class RowElement extends LitElement {
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  @property({ type: String })
  label = "";

  toggle() {
    this.collapsed = !this.collapsed;
  }

  render() {
    return html`
      <div class="row" part="row">
        <button
          class="toggle"
          @click=${this.toggle}
          aria-label="Toggle row"
          aria-expanded=${!this.collapsed}
        >
          <svg class="icon" viewBox="0 0 20 20" width="14" height="14">
            ${this.collapsed ? plusIcon : minusIcon}
          </svg>
          <span class="label">${this.label}</span>
        </button>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .row {
        display: flex;
        align-items: stretch;
        width: 100%;
        background: var(--row-bg, var(--row-toggle-bg, var(--medium)));
        border-radius: 0.5rem;
        padding: 10px;
        box-sizing: border-box;
      }

      .toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: center;

        width: var(--row-toggle-width, 18px);
        min-height: 24px;
        flex-shrink: 0;

        padding: 0;
        border: none;
        border-radius: 0.3rem;
        margin-right: 5px;
        margin-left: -2px;

        background: transparent;
        color: var(--row-toggle-icon-color, var(--light-secondary));
        opacity: 0.3;

        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .toggle:hover {
        opacity: 0.6;
      }

      .label {
        display: none;
        margin-left: 1em;
        font-size: 0.7em;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      :host([collapsed]) .label {
        display: inline;
      }

      :host([collapsed]) .toggle {
        width: 100%;
        justify-content: flex-start;
        padding-left: 0.5em;
        margin-right: 0;
      }

      .content {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      :host([collapsed]) .content {
        max-height: 6px;
        opacity: 0.4;
        pointer-events: none;
        border-radius: 0.3rem;
        margin-right: 0;
      }
    `;
  }
}
