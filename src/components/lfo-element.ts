import { LitElement, html, css, customElement, property } from "lit-element";
import { LfoEvent } from "../types/lfo-event";
import { OscillatorMode } from "../types/oscillator-mode";

import "./wave-selector-element";
import "./knob-element";
import "./wrapper-element";

interface LfoState {
  mode: OscillatorMode;
  frequency: number;
  modAmount: number;
}

@customElement("lfo-element")
export class Lfo extends LitElement {
  @property({ type: String })
  private label = "LFO";

  @property({ type: Object })
  private state: LfoState = {
    mode: OscillatorMode.SAWTOOTH,
    frequency: 127 / 2,
    modAmount: 0,
  };

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onFrequencyChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.FREQUENCY, event.detail.value);
  }

  onModAmountChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.MOD_AMOUNT, event.detail.value);
  }

  onWaveFormChange(event: CustomEvent) {
    this.dispatchChange(LfoEvent.WAVE_FORM, event.detail.value);
  }

  dispatchChange(type: LfoEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <knob-element
                  .value=${this.state.frequency}
                  @change=${this.onFrequencyChange}
                  .shouldMidiLearn=${this.shouldMidiLearn}
                ></knob-element>
              </div>
              <label>frequency</label>
            </div>
            <div class="modulation-control">
              <div class="mod-amount-control">
                <knob-element
                  .value=${this.state.modAmount}
                  @change=${this.onModAmountChange}
                  .shouldMidiLearn=${this.shouldMidiLearn}
                ></knob-element>
              </div>
              <label>mod.</label>
            </div>
          </div>
        </div>
      </wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .oscillator-controls {
        position: relative;

        width: 180px;
        height: 150px;
      }

      .oscillator-controls .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .oscillator-controls .modulation-controls .modulation-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .oscillator-controls .modulation-controls .frequency-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;

        --knob-size: 40px;
      }

      .oscillator-controls .modulation-controls .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      label {
        display: block;
        color: white;
        font-size: 0.8em;
      }
    `;
  }
}
