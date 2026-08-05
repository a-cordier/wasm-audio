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
      <panel-wrapper-element label="Mod.">
        <div class="mod-controls">
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
          <control-learn-wrapper controlID=${ControlID.CUT_MOD}>
            <fader-element label="AMT" .value=${this.state.amount.value as number}
              @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.AMOUNT, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper controlID=${ControlID.CUT_VEL}>
            <fader-element label="VEL" .value=${this.state.velocity.value as number}
              @change=${(e: CustomEvent) => this.dispatchChange(FilterEnvelopeEvent.VELOCITY, e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--filter-mod-panel-color);
        /* Fader SVG viewBox is 50x140 (1:2.8). Keep --fader-height ≤ width*2.8
           so the graphic fills its box without letterboxing (which would gap
           the fader from its label). */
        --fader-width: 32px;
        --fader-height: 88px;
        container-type: inline-size;
      }

      /* Four faders in an even row — the filter envelope (A / D / Amt / Vel)
         mirrors the amp Envelope panel so the two read as a matched pair, with
         every label on one shared baseline like the rest of the panels. */
      .mod-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 114px;
      }

      @container (max-width: 120px) {
        .mod-controls {
          flex-wrap: wrap;
          gap: 0.25em;
        }
        :host {
          --fader-height: 72px;
          --fader-width: 26px;
        }
      }
    `;
  }
}
