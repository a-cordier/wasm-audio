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
import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { MidiControlID } from "../../../types/midi-learn-options";

@customElement("midi-control-wrapper")
export class MidiControlWrapper extends LitElement {
  @property({ type: Number })
  private controlID: MidiControlID;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  get hasFocus() {
    return this.currentLearnerID === this.controlID;
  }

  render() {
    return html`
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `;
  }

  computeClassMap() {
    return classMap({
      wrapper: true,
      focus: this.hasFocus,
    });
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);  
        }
      }
    `;
  }
}
