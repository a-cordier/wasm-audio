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
import { styleMap } from "lit/directives/style-map.js";

import { pluginRegistry, PluginRegistration } from "../core/plugin-registry";
import type { DeviceKind } from "../core/types";

/** Section order + short labels — the device UI speaks hardware. */
export const KIND_SECTIONS: Array<{ kind: DeviceKind; label: string }> = [
  { kind: "instrument", label: "INST" },
  { kind: "sequencer", label: "SEQ" },
  { kind: "effect", label: "FX" },
  { kind: "module", label: "MOD" },
  { kind: "input", label: "IN" },
];

/**
 * The registered-device menu: kind sections of accent nameplates. Entries
 * are DRAG SOURCES (drag one onto a prepared rack slot to mount it there)
 * and still emit `device-pick` on click — the host decides what that means.
 */
@customElement("device-menu")
export class DeviceMenu extends LitElement {
  /** Kinds to leave out — e.g. the mixer's picker omits sequencers, which
   * never take a channel. Empty (the rail) shows everything. */
  @property({ attribute: false })
  omitKinds: DeviceKind[] = [];

  private onDragStart(e: DragEvent, pluginId: string) {
    e.dataTransfer?.setData("text/x-plugin-id", pluginId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
  }

  private pick(pluginId: string) {
    this.dispatchEvent(new CustomEvent("device-pick", {
      detail: { pluginId },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const devices = pluginRegistry.getAll();
    const sections = KIND_SECTIONS
      .filter(({ kind }) => !this.omitKinds.includes(kind))
      .map(({ kind, label }) => ({
        label,
        devices: devices.filter((reg) => reg.descriptor.kind === kind),
      }))
      .filter((section) => section.devices.length > 0);
    return html`
      ${sections.map((section) => html`
        <div class="section">
          <div class="section-title">${section.label}</div>
          <div class="menu">
            ${section.devices.map((reg) => this.renderDevice(reg))}
          </div>
        </div>
      `)}
    `;
  }

  private renderDevice(reg: PluginRegistration) {
    return html`
      <button
        class="device-btn"
        draggable="true"
        title="click to mount — or drag it into the rack or mixer"
        style=${styleMap({ "--device-accent": reg.descriptor.accent ?? "var(--lighter)" })}
        @dragstart=${(e: DragEvent) => this.onDragStart(e, reg.descriptor.id)}
        @click=${() => this.pick(reg.descriptor.id)}
      >
        <span class="device-name">${reg.descriptor.name}</span>
      </button>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-title {
      font-size: 0.55em;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: var(--browser-kind-color, #cbe2f3);
      opacity: 0.5;
      padding: 6px 4px 0;
    }

    .menu {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: var(--browser-menu-bg, #141414);
      padding: 6px;
      border-radius: 4px;
    }

    /* Entries speak the device language: panel-title font in the device's
     * own accent, on its accent-tinted strip. */
    .device-btn {
      cursor: grab;
      display: flex;
      align-items: center;
      min-height: 38px;
      padding: 6px 12px;
      background: color-mix(in srgb, var(--device-accent) 7%, transparent);
      border: none;
      border-left: 3px solid var(--device-accent);
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .device-btn:hover {
      background: color-mix(in srgb, var(--device-accent) 18%, transparent);
    }

    .device-name {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 0.8em;
      letter-spacing: 0.06em;
      text-align: left;
      color: var(--device-accent);
    }
  `;
}
