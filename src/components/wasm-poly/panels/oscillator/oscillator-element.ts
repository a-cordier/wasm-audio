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
import { OscillatorEvent } from "../../../../types/oscillator-event";
import { OscillatorMode } from "../../../../types/oscillator-mode";

import "./wave-selector-element";
import "../../../common/controls/knob-element";
import "../panel-wrapper-element";
import { MidiControlID } from "../../../../types/midi-learn-options";

@customElement("oscillator-element")
export class Oscillator extends LitElement {
  @property({ type: String })
  private label = "Osc";

  @property({ type: Object })
  private state: any;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  @property({ type: Number })
  private semiControlID = MidiControlID.OSC1_SEMI;

  @property({ type: Number })
  private centControlID = MidiControlID.OSC1_CENT;

  @property({ type: Number })
  private cycleControlID = MidiControlID.OSC1_CYCLE;

  private cycleRange = { min: 5, max: 122 };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onSemiShift(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.SEMI_SHIFT, event.detail.value);
  }

  get semiShiftValue() {
    return this.state.semiShift.value;
  }

  onCentShift(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.CENT_SHIFT, event.detail.value);
  }

  get centShiftValue() {
    return this.state.centShift.value;
  }

  onCycleChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.CYCLE, event.detail.value);    
  }

  get cycleValue() {
    return this.state.cycle.value;
  }

  onWaveFormChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.WAVE_FORM, event.detail.value);
  }

  dispatchChange(type: OscillatorEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value as OscillatorMode}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="knob-control semi-shift-control">
                <midi-control-wrapper
                  controlID=${this.semiControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.semiShiftValue}
                    @change=${this.onSemiShift}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>semi</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cent-shift-control cent">
                <midi-control-wrapper
                  controlID=${this.centControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.centShiftValue}
                    @change=${this.onCentShift}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cents</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cycle-shift-control cycle">
                <midi-control-wrapper
                  controlID=${this.cycleControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .range=${this.cycleRange}
                    .value=${this.cycleValue}
                    @change=${this.onCycleChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cycle</label>
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
        --panel-wrapper-background-color: var(--oscillator-panel-color);
      }

      .oscillator-controls {
        position: relative;

        width: 160px;
        height: 120px;
      }

      .oscillator-controls .tone-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .oscillator-controls .tone-controls .shift-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .oscillator-controls .tone-controls .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;
      }

      .oscillator-controls .tone-controls .semi-shift-control {
        --knob-size: 50px;
      }

      .oscillator-controls .tone-controls .cent-shift-control {
        --knob-size: 40px;
      }

      .oscillator-controls .tone-controls .cycle-shift-control {
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
