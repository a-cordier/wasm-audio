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
import { OscillatorEvent } from "../../../../types/oscillator-event";
import { OscillatorMode } from "../../../../types/oscillator-mode";
import { OscillatorState } from "../../../../types/voice";
import { ControlID } from "../../../../control/types";
import { SynthPanel } from "../../../common/synth-panel";

@customElement("oscillator-element")
export class Oscillator extends SynthPanel {
  @property({ type: Object })
  state: OscillatorState;

  @property({ type: Number })
  semiControlID = ControlID.OSC1_SEMI;

  @property({ type: Number })
  centControlID = ControlID.OSC1_CENT;

  @property({ type: Number })
  cycleControlID = ControlID.OSC1_CYCLE;

  private cycleRange = { min: 5, max: 122 };

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value as OscillatorMode}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.WAVE_FORM, e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="knob-control semi-shift-control">
                <control-learn-wrapper controlID=${this.semiControlID}>
                  <knob-element
                    .value=${this.state.semiShift.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.SEMI_SHIFT, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>semi</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cent-shift-control">
                <control-learn-wrapper controlID=${this.centControlID}>
                  <knob-element
                    .value=${this.state.centShift.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.CENT_SHIFT, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cents</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cycle-shift-control">
                <control-learn-wrapper controlID=${this.cycleControlID}>
                  <knob-element
                    .range=${this.cycleRange}
                    .value=${this.state.cycle.value}
                    @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.CYCLE, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cycle</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--oscillator-panel-color);
        container-type: inline-size;
      }

      .oscillator-controls {
        position: relative;
        width: 100%;
        min-height: 120px;
      }

      .tone-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .shift-control {
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

      .semi-shift-control { --knob-size: 50px; }
      .cent-shift-control { --knob-size: 40px; }
      .cycle-shift-control { --knob-size: 35px; }

      @container (max-width: 120px) {
        .tone-controls { flex-direction: column; gap: 0.5em; }
        .semi-shift-control, .cent-shift-control, .cycle-shift-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `;
  }
}
