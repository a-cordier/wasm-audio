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
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SpaceEvent } from "../../../types/routing-event";
import { SpaceState } from "../../../types/voice";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("space-element")
export class Space extends SynthPanel {
  @property({ type: Object })
  state: SpaceState;

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="space-controls">
          <div class="space-control">
            <div class="knob-control spread-control">
              <control-learn-wrapper controlID=${ControlID.STEREO_SPREAD}>
                <knob-element
                  .value=${this.state.spread.value as number}
                  @change=${(e: CustomEvent) => this.dispatchChange(SpaceEvent.SPREAD, e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <label>spread</label>
          </div>
          <div class="space-control">
            <div class="knob-control width-control">
              <control-learn-wrapper controlID=${ControlID.STEREO_WIDTH}>
                <knob-element
                  .value=${this.state.width.value as number}
                  @change=${(e: CustomEvent) => this.dispatchChange(SpaceEvent.WIDTH, e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <label>width</label>
          </div>
          <div class="space-control">
            <div class="knob-control drift-control">
              <control-learn-wrapper controlID=${ControlID.PHASE_DRIFT}>
                <knob-element
                  .value=${this.state.drift.value as number}
                  @change=${(e: CustomEvent) => this.dispatchChange(SpaceEvent.DRIFT, e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <label>drift</label>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--space-panel-color);
        container-type: inline-size;
      }

      .space-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }

      .space-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .knob-control {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      .spread-control { --knob-size: 40px; }
      .width-control { --knob-size: 40px; }
      .drift-control { --knob-size: 35px; }

      @container (max-width: 100px) {
        .spread-control, .width-control, .drift-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
      }
    `;
  }
}
