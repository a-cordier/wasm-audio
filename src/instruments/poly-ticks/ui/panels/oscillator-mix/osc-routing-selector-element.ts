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
import { OscRouting } from "../../../types/osc-routing";

const ROUTING_OPTIONS = [
  { label: "MIX", value: OscRouting.MIX, title: "Crossfade osc1 and osc2" },
  { label: "RING", value: OscRouting.RING, title: "Ring modulate osc1 by osc2" },
  { label: "SYNC", value: OscRouting.SYNC, title: "Hard sync osc2 to osc1" },
  { label: "FM", value: OscRouting.FM, title: "osc1 phase modulates osc2" },
];

@customElement("osc-routing-selector-element")
export class OscRoutingSelector extends LitElement {
  @property({ type: Number })
  public value: OscRouting = OscRouting.MIX;

  private select(routing: OscRouting) {
    this.value = routing;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    return html`
      <div class="selector">
        ${ROUTING_OPTIONS.map(opt => html`
          <button
            title=${opt.title}
            class=${classMap({ active: opt.value === this.value })}
            @click=${() => this.select(opt.value)}
          >${opt.label}</button>
        `)}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .selector {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 3px;
        width: 100%;
      }

      button {
        height: var(--button-height, 20px);
        font-size: var(--button-font-size, 0.55em);
        font-weight: 700;
        letter-spacing: 0.05em;

        background-color: var(--button-disposed-background-color);
        color: var(--button-disposed-label-color);
        border: 1px solid var(--button-border-color, #ccc);
        border-radius: 3px;
        box-shadow: var(--box-shadow);
        box-sizing: border-box;
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        padding: 0;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);
        border-color: var(--button-active-border-color, var(--button-active-label-color));
      }
    `;
  }
}
