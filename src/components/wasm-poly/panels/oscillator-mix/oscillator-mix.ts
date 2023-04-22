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

import { MidiControlID } from "../../../../types/midi-learn-options";
import { OscillatorEvent } from "../../../../types/oscillator-event";

@customElement("oscillator-mix-element")
export class OscillatorMix extends LitElement {
@property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  @property({ type: Object })
  private mix: any;

  @property({ type: Object })
  private noise: any;

  render() {
    return html`
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${MidiControlID.OSC_MIX}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="mix"
                    label="mix"
                    .value=${this.mix.value as number}
                    @change=${this.onMixChange}
                ></knob-element>
                </midi-control-wrapper>
                <midi-control-wrapper
                .controlID=${MidiControlID.NOISE}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="noise"
                    label="noise"
                    .value=${this.noise.value as number}
                    @change=${this.onNoiseChange}
                ></knob-element>
                </midi-control-wrapper>
            </div>
            <div class="noise-control">
                
            </div>
        </panel-wrapper-element>
    `;
  }

  onMixChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.MIX, event.detail.value);
  }

  onNoiseChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.NOISE, event.detail.value);
  }

  dispatchChange(type: OscillatorEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);

      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;

        width: 60px; 
        height: 130px;
      }

      .oscillator-mix .mix {
        --knob-size: 40px;
      }

      .oscillator-mix .noise {
        --knob-size: 30px;
      }     
    `;
  }
}
