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
import { FilterEnvelopeEvent } from "../../../types/filter-envelope-event";
import { CutoffModState } from "../../../types/voice";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("filter-envelope-element")
export class FilterEnvelope extends SynthPanel {
  @property({ type: Object })
  state: CutoffModState;

  render() {
    return html`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <control-learn-wrapper controlID=${ControlID.CUT_ATTACK}>
              <fader-element label="A" .value=${this.state.attack.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.ATTACK, e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
            <control-learn-wrapper controlID=${ControlID.CUT_DECAY}>
              <fader-element label="D" .value=${this.state.decay.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.DECAY, e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
          </div>
          <div class="mod-controls">
            <div class="mod-control mod">
              <control-learn-wrapper controlID=${ControlID.CUT_MOD}>
                <knob-element label="mod" .value=${this.state.amount.value as number}
                  @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.AMOUNT, e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <div class="mod-control velocity">
              <control-learn-wrapper controlID=${ControlID.CUT_VEL}>
                <knob-element label="vel" .value=${this.state.velocity.value as number}
                  @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.VELOCITY, e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--filter-mod-panel-color);
        --fader-height: 120px;
        --knob-size: 50px;
        container-type: inline-size;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }

      .time-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 60%;
      }

      .mod-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 70%;
      }

      .mod-controls .mod { --knob-size: 40px; }
      .mod-controls .velocity { --knob-size: 25px; }

      @container (max-width: 100px) {
        .envelope-controls { flex-direction: column; gap: 0.5em; }
        .time-controls { width: 100%; }
        .mod-controls { flex-direction: row; gap: 0.5em; height: auto; }
        .mod-controls .mod { --knob-size: 30px; }
        .mod-controls .velocity { --knob-size: 25px; }
        :host { --fader-height: 80px; }
      }
    `;
  }
}
