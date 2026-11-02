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
import { customElement, property } from "lit/decorators.js";

import "./device-menu";

/**
 * The device browser rail — the workspace's left dock. Lists every
 * registered device (name, kind, accent chip); clicking one dispatches
 * `device-mount` with the plugin id — the shell (daw-element) does the
 * actual mounting. Collapses to a slim vertical tab; the open state is
 * owned by the shell and persisted with the session.
 */
@customElement("device-browser")
export class DeviceBrowser extends LitElement {
  /** Shown as a hint when the rack has no devices mounted. */
  @property({ type: Boolean })
  emptyRack = false;

  /** Rail open/collapsed — owned by the shell (persisted). */
  @property({ type: Boolean })
  open = true;

  private toggle() {
    this.dispatchEvent(new CustomEvent("browser-toggle", {
      detail: { open: !this.open },
      bubbles: true,
      composed: true,
    }));
  }

  private onDevicePick = (e: CustomEvent<{ pluginId: string }>) => {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("device-mount", {
      detail: { pluginId: e.detail.pluginId },
      bubbles: true,
      composed: true,
    }));
  };

  render() {
    if (!this.open) {
      return html`
        <button class="tab" title="open the device browser" @click=${this.toggle}>
          DEVICES
        </button>
      `;
    }
    return html`
      <div class="rail">
        <div class="rail-header">
          <span class="rail-title">DEVICES</span>
          <button class="collapse-btn" title="collapse" @click=${this.toggle}>◂</button>
        </div>
        <device-menu @device-pick=${this.onDevicePick}></device-menu>
        ${this.emptyRack
          ? html`<div class="hint">the rack is empty — add a device</div>`
          : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--browser-rail-bg, #181818);
      border-right: 1px solid var(--browser-rail-border, #2b3844);
      box-sizing: border-box;
    }

    /* Collapsed: a slim full-height tab with a vertical label. */
    .tab {
      width: 28px;
      height: 100%;
      padding: 12px 0;
      writing-mode: vertical-rl;
      font-size: 0.6em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      background: transparent;
      color: var(--browser-rail-label-color, #e8eef2);
      border: none;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .tab:hover {
      opacity: 1;
      color: var(--lcd-led-on-color, #b4d455);
    }

    .rail {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 190px;
      height: 100%;
      padding: 8px;
      box-sizing: border-box;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    .rail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .rail-title {
      font-size: 0.6em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--browser-rail-label-color, #e8eef2);
      padding-left: 4px;
    }

    .collapse-btn {
      width: 20px;
      height: 20px;
      padding: 0;
      background: transparent;
      color: var(--browser-rail-label-color, #e8eef2);
      border: none;
      cursor: pointer;
      opacity: 0.7;
    }

    .collapse-btn:hover {
      opacity: 1;
    }

    .hint {
      text-align: center;
      font-size: 0.6em;
      letter-spacing: 0.05em;
      color: var(--browser-kind-color, #cbe2f3);
      opacity: 0.6;
      padding-bottom: 4px;
    }

  `;
}
