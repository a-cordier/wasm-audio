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
import { FilterEvent } from "../../../types/filter-event";
import { FilterState } from "../../../types/filter-state";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("filter-element")
export class Filter extends SynthPanel {
  @property({ type: Object })
  state: FilterState;

  render() {
    return html`
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${(e: CustomEvent) => this.dispatchChange(FilterEvent.MODE, e.detail.value)}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="knob-control cutoff-control">
                <control-learn-wrapper controlID=${ControlID.CUTOFF}>
                  <knob-element
                    .value=${this.state.cutoff.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(FilterEvent.CUTOFF, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control resonance-control">
                <control-learn-wrapper controlID=${ControlID.RESONANCE}>
                  <knob-element
                    .value=${this.state.resonance.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(FilterEvent.RESONANCE, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>res</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control drive-control">
                <control-learn-wrapper controlID=${ControlID.DRIVE}>
                  <knob-element
                    .value=${this.state.drive.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(FilterEvent.DRIVE, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>drive</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--filter-panel-color);
        container-type: inline-size;
      }

      .filter-controls {
        position: relative;
        width: 100%;
        min-height: 120px;
      }

      .mode-control { width: 100%; display: block; }

      .frequency-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .frequency-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        height: 90%;
      }

      .cutoff-control { --knob-size: 50px; }
      .resonance-control { --knob-size: 40px; }
      .drive-control { --knob-size: 35px; }

      @container (max-width: 120px) {
        .frequency-controls { flex-direction: column; gap: 0.5em; }
        .cutoff-control, .resonance-control, .drive-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `;
  }
}
