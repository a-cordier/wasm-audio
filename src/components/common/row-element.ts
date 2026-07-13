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

const chevronIcon = svg`<path d="M6 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

@customElement("row-element")
export class RowElement extends LitElement {
  @property({ type: Boolean, reflect: true })
  collapsed = false;

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
          <svg class="chevron" viewBox="0 0 20 20" width="12" height="12">
            ${chevronIcon}
          </svg>
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
        background: var(--row-bg, transparent);
        border-radius: 0.5rem;
      }

      .toggle {
        display: flex;
        align-items: center;
        justify-content: center;

        width: var(--row-toggle-width, 18px);
        min-height: 24px;
        flex-shrink: 0;

        padding: 0;
        border: none;
        border-radius: 0.3rem;

        background: var(--row-toggle-bg, var(--medium));
        color: var(--row-toggle-icon-color, var(--light-secondary));
        opacity: 0.4;

        cursor: pointer;
        transition: opacity 0.2s ease, width 0.25s ease;
      }

      .toggle:hover {
        opacity: 0.7;
      }

      .chevron {
        transition: transform 0.25s ease;
        transform: rotate(90deg);
      }

      :host([collapsed]) .chevron {
        transform: rotate(0deg);
      }

      :host([collapsed]) .toggle {
        width: 100%;
        justify-content: flex-start;
        padding-left: 0.5em;
        border-radius: 0.5rem;
      }

      .content {
        flex: 1;
        min-width: 0;
      }

      :host([collapsed]) .content {
        display: none;
      }
    `;
  }
}
