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
import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import "./device-menu";
import type { DeviceKind } from "../core/types";

/** Viewport-px anchor: the clicked cell's horizontal center and extent. */
export interface PickerAnchor {
  x: number;
  top: number;
  bottom: number;
}

const PANEL_WIDTH = 190;

/**
 * The add-device popover: the shared device-menu docked over an anchor cell
 * (fixed position, so no ancestor overflow clips it; flips below the anchor
 * in the upper half of the viewport). The HOST owns the open state: set
 * `anchor` to open, null to close. The menu's `device-pick` bubbles through
 * untouched; `picker-close` asks the host to close (outside press, Escape,
 * or the world moving under the fixed anchor — scroll/resize).
 */
@customElement("device-picker")
export class DevicePicker extends LitElement {
  @property({ attribute: false })
  anchor: PickerAnchor | null = null;

  @property({ attribute: false })
  omitKinds: DeviceKind[] = [];

  @property({ type: String })
  heading = "ADD DEVICE";

  /** Clamp an anchor so the panel stays on screen — hosts build anchors with it. */
  static anchorFor(rect: DOMRect): PickerAnchor {
    const half = PANEL_WIDTH / 2 + 8;
    return {
      x: Math.max(half, Math.min(window.innerWidth - half, rect.left + rect.width / 2)),
      top: rect.top,
      bottom: rect.bottom,
    };
  }

  private requestClose = () => {
    if (this.anchor === null) return;
    this.dispatchEvent(new CustomEvent("picker-close", { bubbles: true, composed: true }));
  };

  private onDocumentPointerDown = (e: PointerEvent) => {
    if (!e.composedPath().includes(this)) this.requestClose();
  };

  private onDocumentKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.requestClose();
  };

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("anchor")) {
      if (this.anchor !== null) {
        document.addEventListener("pointerdown", this.onDocumentPointerDown);
        document.addEventListener("keydown", this.onDocumentKeyDown);
        window.addEventListener("resize", this.requestClose);
        document.addEventListener("scroll", this.requestClose, true);
      } else {
        this.removeDocumentListeners();
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeDocumentListeners();
  }

  private removeDocumentListeners() {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    document.removeEventListener("keydown", this.onDocumentKeyDown);
    window.removeEventListener("resize", this.requestClose);
    document.removeEventListener("scroll", this.requestClose, true);
  }

  render() {
    if (!this.anchor) return nothing;
    // Open upward from the lower half of the viewport (mixer dock, bottom
    // rows), downward near the top so the panel never leaves the screen.
    const openUp = this.anchor.top > window.innerHeight / 2;
    const style = openUp
      ? `left: ${this.anchor.x}px; top: ${this.anchor.top}px; transform: translate(-50%, calc(-100% - 8px))`
      : `left: ${this.anchor.x}px; top: ${this.anchor.bottom + 8}px; transform: translateX(-50%)`;
    return html`
      <div class="panel" style=${style}>
        <div class="panel-title">${this.heading}</div>
        <device-menu .omitKinds=${this.omitKinds}></device-menu>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: contents;
    }

    .panel {
      position: fixed;
      width: 190px;
      max-height: 60vh;
      overflow-y: auto;
      scrollbar-width: thin;
      padding: 8px;
      box-sizing: border-box;
      background: var(--browser-rail-bg, #181818);
      border: 1px solid var(--browser-rail-border, #2b3844);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }

    .panel-title {
      font-size: 0.6em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--browser-rail-label-color, #e8eef2);
      padding: 0 4px 6px;
    }
  `;
}
