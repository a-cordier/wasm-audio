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
import { Control } from "../../../../types/control";
import { ControlID } from "../../../../control/types";
import { SynthPanel } from "../../../common/synth-panel";

@customElement("oscillator-mix-element")
export class OscillatorMix extends SynthPanel {
  @property({ type: Object })
  mix: Control;

  @property({ type: Object })
  noise: Control;

  render() {
    return html`
      <panel-wrapper-element class="oscillator-mix">
        <div class="oscillator-mix-control">
          <control-learn-wrapper .controlID=${ControlID.OSC_MIX}>
            <knob-element class="mix" label="mix"
              .value=${this.mix.value as number}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.MIX, e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.NOISE}>
            <knob-element class="noise" label="noise"
              .value=${this.noise.value as number}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.NOISE, e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);
      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 130px;
      }

      .oscillator-mix .mix { --knob-size: 40px; }
      .oscillator-mix .noise { --knob-size: 30px; }
    `;
  }
}
