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
import { FilterEnvelopeEvent } from "../../../../types/filter-envelope-event";
import "../panel-wrapper-element";
import "../../../common/controls/midi-control-wrapper";
import "../../../common/controls/fader-element";
import "../../../common/controls/knob-element";
import { MidiControlID } from "../../../../types/midi-learn-options";

@customElement("filter-envelope-element")
export class FilterEnvelope extends LitElement {
  @property({ type: Object })
  private state;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  onAttackChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.ATTACK, event.detail.value);
  }

  onDecayChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.DECAY, event.detail.value);
  }

  onAmountChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.AMOUNT, event.detail.value);
  }

  onVelocityChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.VELOCITY, event.detail.value);
  }

  dispatchChange(type: FilterEnvelopeEvent, value: number) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <midi-control-wrapper
              controlID=${MidiControlID.CUT_ATTACK}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="A"
                .value=${this.state.attack.value as number}
                @change=${this.onAttackChange}
              ></fader-element>
            </midi-control-wrapper>
            <midi-control-wrapper
              controlID=${MidiControlID.CUT_DECAY}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="D"
                .value=${this.state.decay.value as number}
                @change=${this.onDecayChange}
              ></fader-element>
            </midi-control-wrapper>
          </div>
          <div class="mod-controls">
            <div class="mod-control mod">
              <midi-control-wrapper
                controlID=${MidiControlID.CUT_MOD}
                currentLearnerID=${this.currentLearnerID}
              >
                <knob-element
                  label="mod"
                  .value=${this.state.amount.value as number}
                  @change=${this.onAmountChange}
                ></knob-element>
              </midi-control-wrapper>
            </div>
            <div class="mod-control velocity">
              <midi-control-wrapper
                controlID=${MidiControlID.CUT_VEL}
                currentLearnerID=${this.currentLearnerID}
              >
                <knob-element
                  label="vel"
                  .value=${this.state.velocity.value as number}
                  @change=${this.onVelocityChange}
                ></knob-element>
              </midi-control-wrapper>
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
        --panel-wrapper-background-color: var(--filter-mod-panel-color);
        --fader-height: 120px;
        --knob-size: 50px;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 130px;
        height: 160px;
      }

      .envelope-controls .time-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        width: 60%;
      }

      .envelope-controls .mod-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 70%;

      }

      .envelope-controls .mod-controls .mod {
        --knob-size: 40px;
      }

      .envelope-controls .mod-controls .velocity {
        --knob-size: 25px;
      }
    `;
  }
}
