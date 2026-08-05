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
import { OscillatorEvent } from "../../../types/oscillator-event";
import { RoutingEvent } from "../../../types/routing-event";
import { OscRouting } from "../../../types/osc-routing";
import { Control } from "../../../types/control";
import { RoutingState } from "../../../types/voice";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("oscillator-mix-element")
export class OscillatorMix extends SynthPanel {
  @property({ type: Object })
  mix: Control;

  @property({ type: Object })
  noise: Control;

  @property({ type: Object })
  routing: RoutingState;

  render() {
    const routing = this.routing.routing.value as OscRouting;

    return html`
      <panel-wrapper-element class="oscillator-mix" label="Voice">
        <div class="oscillator-mix-control">
          <osc-routing-selector-element
            .value=${routing}
            @change=${(e: CustomEvent) => this.dispatchChange(RoutingEvent.ROUTING, e.detail.value)}
          ></osc-routing-selector-element>
          <div class="knobs">
            <control-learn-wrapper .controlID=${ControlID.OSC_MIX}>
              <knob-element class="mix" label="mix"
                .value=${this.mix.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.MIX, e.detail.value)}
              ></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.SUB_LEVEL}>
              <knob-element class="sub" label="sub"
                .value=${this.routing.subLevel.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(RoutingEvent.SUB_LEVEL, e.detail.value)}
              ></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.NOISE}>
              <knob-element class="noise" label="noise"
                .value=${this.noise.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(OscillatorEvent.NOISE, e.detail.value)}
              ></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.FM_INDEX}>
              <knob-element class="fm" label="fm"
                ?disabled=${routing !== OscRouting.FM}
                .value=${this.routing.fmIndex.value as number}
                @change=${(e: CustomEvent) => this.dispatchChange(RoutingEvent.FM_INDEX, e.detail.value)}
              ></knob-element>
            </control-learn-wrapper>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        container-type: inline-size;
      }

      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);
      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.6em;
        width: 100%;
        min-height: 94px;
      }

      .knobs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        justify-items: center;
        align-items: center;
        gap: 0.3em;
        width: 100%;
      }

      .oscillator-mix knob-element { --knob-size: var(--control-size-sm, 30px); }

      @container (max-width: 90px) {
        .knobs { grid-template-columns: 1fr; }
        .oscillator-mix knob-element { --knob-size: 25px; }
      }
    `;
  }
}
