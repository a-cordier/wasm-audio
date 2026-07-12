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
import { OscillatorEnvelopeEvent } from "../../../types/oscillator-envelope-event";
import { EnvelopeState } from "../../../types/voice";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("envelope-element")
export class Envelope extends SynthPanel {
  @property({ type: Object })
  state: EnvelopeState;

  render() {
    return html`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <control-learn-wrapper .controlID=${ControlID.ATTACK}>
            <fader-element label="A" .value=${this.state.attack.value}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEnvelopeEvent.ATTACK, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.DECAY}>
            <fader-element label="D" .value=${this.state.decay.value}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEnvelopeEvent.DECAY, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.SUSTAIN}>
            <fader-element label="S" .value=${this.state.sustain.value}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEnvelopeEvent.SUSTAIN, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.RELEASE}>
            <fader-element label="R" .value=${this.state.release.value}
              @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEnvelopeEvent.RELEASE, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--envelope-panel-color);
        --fader-height: 120px;
        --fader-width: 40px;
        container-type: inline-size;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }

      @container (max-width: 120px) {
        .envelope-controls {
          flex-wrap: wrap;
          gap: 0.25em;
        }
        :host {
          --fader-height: 80px;
          --fader-width: 32px;
        }
      }
    `;
  }
}
