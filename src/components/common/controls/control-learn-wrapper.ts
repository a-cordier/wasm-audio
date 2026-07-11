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
import { classMap } from "lit/directives/class-map.js";
import { ControlID } from "../../../control/types";
import { LearnController, getBindingManager } from "../../../control/binding-manager";

function findAncestorSlotId(el: Element): string | null {
  let node: Node | null = el;
  while (node) {
    const root = node.getRootNode();
    if (root instanceof ShadowRoot) {
      const host = root.host;
      if (host.tagName === "DEVICE-SLOT" && (host as any).config?.id) {
        return (host as any).config.id;
      }
      node = host;
    } else {
      break;
    }
  }
  return null;
}

@customElement("control-learn-wrapper")
export class ControlLearnWrapper extends LitElement {
  @property({ type: Number })
  controlID: ControlID;

  private learn = new LearnController(this);
  private _slotId: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._slotId = findAncestorSlotId(this);
  }

  get hasFocus() {
    return this.learn.learningTarget === this.controlID;
  }

  private get isMySlotLearning(): boolean {
    if (!this._slotId) return this.learn.isLearning;
    return getBindingManager().isLearningSlot(this._slotId);
  }

  private handleClick(e: MouseEvent) {
    if (!this.isMySlotLearning) return;
    e.stopPropagation();
    e.preventDefault();
    getBindingManager().startLearning(this.controlID);
  }

  render() {
    const classes = {
      wrapper: true,
      focus: this.hasFocus,
      learnable: this.isMySlotLearning,
    };
    return html`
      <div class="${classMap(classes)}" @click=${this.handleClick}>
        <slot></slot>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        display: inline-block;
        width: fit-content;
      }

      .wrapper {
        display: inline-block;
        width: fit-content;
        border-radius: 4px;
        --learn-outline-color: transparent;
      }

      .wrapper.learnable {
        cursor: pointer;
        --learn-outline-color: rgba(255, 200, 0, 0.3);
      }

      .wrapper.learnable:hover {
        --learn-outline-color: rgba(255, 200, 0, 0.7);
      }

      .wrapper.focus {
        --learn-outline-color: rgba(180, 212, 85, 1);
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        0% {
          --learn-outline-color: rgba(180, 212, 85, 1);
          --control-handle-color: var(--control-hander-color-focused);
        }
        50% {
          --learn-outline-color: rgba(180, 212, 85, 0.3);
        }
        100% {
          --learn-outline-color: rgba(180, 212, 85, 1);
          --control-handle-color: var(--control-hander-color-focused);
        }
      }
    `;
  }
}
