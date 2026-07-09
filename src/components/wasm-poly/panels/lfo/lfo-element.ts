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
import { LfoEvent } from "../../../../types/lfo-event";
import { OscillatorMode } from "../../../../types/oscillator-mode";
import { LfoDestination } from "../../../../types/lfo-destination";
import { LFOState } from "../../../../types/voice";
import { SelectOptions } from "../../../../types/select-option";
import { ControlID } from "../../../../control/types";
import { SynthPanel } from "../../../common/synth-panel";

@customElement("lfo-element")
export class Lfo extends SynthPanel {
  @property({ type: Object })
  state: LFOState;

  @property({ type: Number })
  frequencyControlID = ControlID.LFO1_FREQ;

  @property({ type: Number })
  modAmountControlID = ControlID.LFO1_MOD;

  private destinations = new SelectOptions([
    { value: LfoDestination.OSCILLATOR_MIX, name: "OSC MIX" },
    { value: LfoDestination.FREQUENCY, name: "FREQUENCY" },
    { value: LfoDestination.CUTOFF, name: "CUTOFF" },
    { value: LfoDestination.OSC1_CYCLE, name: "OSC1 CYCLE" },
    { value: LfoDestination.OSC2_CYCLE, name: "OSC2 CYCLE" },
  ]);

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="lfo-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value as OscillatorMode}
              @change=${(e: CustomEvent) => this.dispatchChange(LfoEvent.WAVE_FORM, e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.destinations}
              .value=${this.state.destination.value}
              @change=${(e: CustomEvent) => this.dispatchChange(LfoEvent.DESTINATION, e.detail.value)}
            ></lcd-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <control-learn-wrapper controlID=${this.frequencyControlID}>
                  <knob-element
                    .value=${this.state.frequency.value as number}
                    @change=${(e: CustomEvent) => this.dispatchChange(LfoEvent.FREQUENCY, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>freq</label>
            </div>
            <div class="modulation-control">
              <div class="mod-amount-control">
                <control-learn-wrapper controlID=${this.modAmountControlID}>
                  <knob-element
                    .value=${this.state.modAmount.value as number}
                    @change=${(e: CustomEvent) => this.dispatchChange(LfoEvent.MOD_AMOUNT, e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>mod.</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--lfo-panel-color);
        container-type: inline-size;
      }

      .lfo-controls {
        position: relative;
        width: 100%;
        min-height: 160px;
      }

      .destination-control { margin: 10px auto; }

      .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .modulation-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .frequency-control {
        display: flex;
        align-items: center;
        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      @container (max-width: 100px) {
        .modulation-controls { flex-direction: column; gap: 0.5em; }
        .frequency-control, .mod-amount-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
      }
    `;
  }
}
