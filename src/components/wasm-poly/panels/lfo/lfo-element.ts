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
import { LfoEvent } from "../../../../types/lfo-event";
import { OscillatorMode } from "../../../../types/oscillator-mode";

import "../oscillator/wave-selector-element";
import "../../../common/controls/knob-element";
import "../panel-wrapper-element";
import "./lcd-selector-element";
import { LfoDestination } from "../../../../types/lfo-destination";
import { SelectOptions } from "../../../../types/select-option";
import { MidiControlID } from "../../../../types/midi-learn-options";

@customElement("lfo-element")
export class Lfo extends LitElement {
  @property({ type: String })
  private label = "LFO";

  @property({ type: Object })
  private state: any;

  private destinations = new SelectOptions([
    { value: LfoDestination.OSCILLATOR_MIX, name: "OSC MIX" },
    { value: LfoDestination.FREQUENCY, name: "FREQUENCY" },
    { value: LfoDestination.CUTOFF, name: "CUTOFF" },
   // { value: LfoDestination.RESONANCE, name: "RESONANCE" },
    { value: LfoDestination.OSC1_CYCLE, name: "OSC1 CYCLE" },
    { value: LfoDestination.OSC2_CYCLE, name: "OSC2 CYCLE" },
  ]);

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  @property({ type: Number })
  private frequencyControlID = MidiControlID.LFO1_FREQ;

  @property({ type: Number })
  private modAmountControlID = MidiControlID.LFO1_MOD;

  onFrequencyChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.FREQUENCY, event.detail.value);
  }

  onModAmountChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.MOD_AMOUNT, event.detail.value);
  }

  onWaveFormChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.WAVE_FORM, event.detail.value);
  }

  onDestinationChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.DESTINATION, event.detail.value);
  }

  dispatchChange(type: LfoEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="lfo-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value as OscillatorMode}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.destinations}
              .value=${this.state.destination.value}
              @change=${this.onDestinationChange}
            ></lcd-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <midi-control-wrapper
                  controlID=${this.frequencyControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.frequency.value as number}
                    @change=${this.onFrequencyChange}
                    .shouldMidiLearn=${this.shouldMidiLearn}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>freq</label>
            </div>
            <div class="modulation-control">
              <div class="mod-amount-control">
                <midi-control-wrapper
                  controlID=${this.modAmountControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.modAmount.value as number}
                    @change=${this.onModAmountChange}
                    .shouldMidiLearn=${this.shouldMidiLearn}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>mod.</label>
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
        --panel-wrapper-background-color: var(--lfo-panel-color);
      }

      .lfo-controls {
        position: relative;
        width: 130px;
        height: 160px;
      }

      .lfo-controls .destination-control {
        margin: 10px auto 10px auto;
      }

      .lfo-controls .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .lfo-controls .modulation-controls .modulation-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .lfo-controls .modulation-controls .frequency-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;

        --knob-size: 40px;
      }

      .lfo-controls .modulation-controls .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
      }
    `;
  }
}
