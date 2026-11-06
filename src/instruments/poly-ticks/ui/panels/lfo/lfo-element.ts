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
import { LfoEvent } from "../../../types/lfo-event";
import { OscillatorMode } from "../../../types/oscillator-mode";
import { LfoDestination } from "../../../types/lfo-destination";
import { LFOState } from "../../../types/voice";
import { SelectOptions } from "../../../../../types/select-option";
import { ControlID } from "../../../../../control/types";
import { DIVISIONS, stepDivision } from "../../../../../core/divisions";
import { SynthPanel } from "../../../../../components/common/synth-panel";
import { classMap } from "lit/directives/class-map.js";

import "../../../../../components/common/lcd/lcd-element";

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
    const synced = (this.state.sync?.value ?? 0) >= 64;
    const div = this.state.div?.value ?? 4;
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
          <div class="sync-row">
            <button
              class=${classMap({ "sync-btn": true, active: synced })}
              title="follow the master clock"
              @click=${() => this.dispatchChange(LfoEvent.SYNC, synced ? 0 : 127)}
            >SYNC</button>
            <div class="stepper"
              title=${synced ? "Cycle length — follows the master clock" : "Free-running — SYNC hands the cycle to the master clock"}>
              <button class="inc-btn" ?disabled=${!synced}
                @click=${() => this.dispatchChange(LfoEvent.DIV, stepDivision(div, -1))}>-</button>
              <lcd-element .text=${DIVISIONS[div]?.label ?? "?"}></lcd-element>
              <button class="inc-btn" ?disabled=${!synced}
                @click=${() => this.dispatchChange(LfoEvent.DIV, stepDivision(div, 1))}>+</button>
            </div>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <control-learn-wrapper controlID=${this.frequencyControlID}>
                  <knob-element
                    .value=${this.state.frequency.value as number}
                    ?disabled=${synced}
                    title=${synced ? "Free-run speed — the master clock sets the rate while SYNC is on" : ""}
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
        /* Narrow panel: shrink the wave buttons so their gap matches the wider
           panels' rounded-button groups instead of nearly touching. */
        --button-width: 19px;
        --button-height: 19px;
        container-type: inline-size;
      }

      .lfo-controls {
        position: relative;
        width: 100%;
        min-height: 138px;
      }

      .destination-control {
        /* More gap above the LCD, borrowed from below it (bottom margin +
           the knob row's top margin) so the cluster height stays put. */
        margin: 10px auto 2px auto;
        max-width: 100%;
        overflow: hidden;
      }

      /* SYNC + DIV: one thin row between the destination LCD and the knobs
         (the monolog idiom — the toggle sits beside the stepper it enables). */
      .sync-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        margin: 4px 0 2px 0;
        --lcd-screen-width: 2.4em;
        --lcd-font-size: 9px;
      }

      .stepper {
        display: flex;
        align-items: center;
        gap: 1px;
      }

      .sync-btn,
      .inc-btn {
        height: 19px;
        font-size: 0.55em;
        font-weight: 700;
        padding: 0 4px;
        background: var(--dark-secondary, #4a4a4a);
        color: var(--light-secondary, #939597);
        border: 1px solid var(--medium, #5a5a5a);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        transition: background 0.15s, color 0.15s;
      }

      .inc-btn {
        width: 18px;
        padding: 0;
      }

      .sync-btn.active {
        background: var(--darker, #2a2a2a);
        color: var(--control-cursor-color, var(--lighter));
        border-color: var(--control-cursor-color, var(--lighter));
      }

      /* Conditional relevance: ghost in place, never drop from the layout. */
      .inc-btn:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 0.15em;
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
        --knob-size: 36px;
      }

      .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 90%;
        --knob-size: 36px;
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
