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
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { pluginRegistry } from "../core/plugin-registry";

/**
 * The rack's "+ ADD DEVICE" rail. Expands into a menu of every registered
 * device (name, kind, accent chip); clicking one dispatches `device-mount`
 * with the plugin id — the shell (root-element) does the actual mounting.
 */
@customElement("device-browser")
export class DeviceBrowser extends LitElement {
  /** Shown as a hint when the rack has no devices mounted. */
  @property({ type: Boolean })
  emptyRack = false;

  @state()
  private open = false;

  private toggle() {
    this.open = !this.open;
  }

  private mount(pluginId: string) {
    this.dispatchEvent(new CustomEvent("device-mount", {
      detail: { pluginId },
      bubbles: true,
      composed: true,
    }));
    this.open = false;
  }

  render() {
    const devices = pluginRegistry.getAll();
    return html`
      <div class="rail">
        <button class="add-btn" @click=${this.toggle}>
          ${this.open ? "CLOSE" : "+ ADD DEVICE"}
        </button>
        ${this.emptyRack && !this.open
          ? html`<div class="hint">the rack is empty — add a device</div>`
          : nothing}
        ${this.open
          ? html`
            <div class="menu">
              ${devices.map((reg) => html`
                <button
                  class="device-btn"
                  style=${styleMap({ "--device-accent": reg.descriptor.accent ?? "var(--lighter)" })}
                  @click=${() => this.mount(reg.descriptor.id)}
                >
                  <span class="device-name">${reg.descriptor.name}</span>
                  <span class="device-kind">${reg.descriptor.kind}</span>
                </button>
              `)}
            </div>`
          : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: calc(650px + 3em);
      max-width: 100%;
      margin: 0 auto;
    }

    .rail {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      background: var(--browser-rail-bg, #181818);
      border: 1px dashed var(--browser-rail-border, #2b3844);
      border-radius: 0.5rem;
    }

    .add-btn {
      width: 100%;
      height: 28px;
      font-size: 0.6em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: transparent;
      color: var(--browser-rail-label-color, #e8eef2);
      border: none;
      cursor: pointer;
      transition: color 0.15s;
    }

    .add-btn:hover {
      color: var(--lcd-led-on-color, #b4d455);
    }

    .hint {
      text-align: center;
      font-size: 0.6em;
      letter-spacing: 0.05em;
      color: var(--browser-kind-color, #cbe2f3);
      opacity: 0.6;
      padding-bottom: 4px;
    }

    .menu {
      display: flex;
      flex-direction: column;
      gap: 3px;
      background: var(--browser-menu-bg, #141414);
      padding: 6px;
      border-radius: 4px;
    }

    .device-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      height: 26px;
      padding: 4px 10px;
      font-size: 0.6em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--button-active-background-color, #192734);
      color: var(--browser-rail-label-color, #e8eef2);
      border: none;
      border-left: 3px solid var(--device-accent);
      border-radius: 3px;
      cursor: pointer;
      transition: filter 0.15s;
    }

    .device-btn:hover {
      filter: brightness(1.4);
    }

    .device-name {
      color: var(--device-accent);
    }

    .device-kind {
      font-weight: 400;
      opacity: 0.55;
      color: var(--browser-kind-color, #cbe2f3);
    }
  `;
}
