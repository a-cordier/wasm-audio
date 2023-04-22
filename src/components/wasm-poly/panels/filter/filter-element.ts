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
import { FilterEvent } from "../../../../types/filter-event";

import "../panel-wrapper-element";
import "../../../common/controls/midi-control-wrapper";
import "../../../common/controls/knob-element";
import "./filter-selector-element";
import { MidiControlID } from "../../../../types/midi-learn-options";

@customElement("filter-element")
export class Filter extends LitElement {
  @property({ type: Object })
  private state: any;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  onCutoffChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.CUTOFF, event.detail.value);
  }

  onResonanceChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.RESONANCE, event.detail.value);
  }

  onDriveChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.DRIVE, event.detail.value);
  }

  onTypeChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.MODE, event.detail.value);
  }

  dispatchChange(type: FilterEvent, value: number) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${this.onTypeChange}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="knob-control cutoff-control">
                <midi-control-wrapper
                  controlID=${MidiControlID.CUTOFF}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.cutoff.value}
                    @change=${this.onCutoffChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control resonance-control">
                <midi-control-wrapper
                  controlID=${MidiControlID.RESONANCE}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.resonance.value}
                    @change=${this.onResonanceChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>res</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control drive-control">
                <midi-control-wrapper
                  controlID=${MidiControlID.DRIVE}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.drive.value}
                    @change=${this.onDriveChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>drive</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: var(--filter-panel-color);
      }

      .filter-controls {
        position: relative;
        width: 160px;
        height: 120px;
      }

      .filter-controls .mode-control {
        width: 100%;
        display: block;
      }

      .filter-controls .frequency-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .filter-controls .frequency-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .filter-controls .frequency-controls .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;
      }

      .frequency-control .cutoff-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        --knob-size: 50px;
      }

      .frequency-control .resonance-control {
        --knob-size: 40px;
      }

      .frequency-control .drive-control {
        --knob-size: 35px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `;
  }
}
