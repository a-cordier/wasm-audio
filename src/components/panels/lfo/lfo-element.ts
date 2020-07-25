import { LitElement, html, css, customElement, property } from "lit-element";
import { LfoEvent } from "../../../types/lfo-event";
import { OscillatorMode } from "../../../types/oscillator-mode";

import "../oscillator/wave-selector-element";
import "../../common/controls/knob-element";
import "../panel-wrapper-element";
import "./lcd-selector-element";
import { lfoDestinations } from "../../../types/lfo-destination";

@customElement("lfo-element")
export class Lfo extends LitElement {
  @property({ type: String })
  private label = "LFO";

  @property({ type: Object })
  private state = {
    mode: OscillatorMode.SAWTOOTH,
    destinations: lfoDestinations,
    frequency: 127 / 2,
    modAmount: 0,
  };

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  onFrequencyChange(event: CustomEvent) {
    this.state.destinations.next();
    this.requestUpdate();
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
              .value=${this.state.mode}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.state.destinations}
              @change=${this.onDestinationChange}
            ></lcd-selector-element>
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
              <label>freq.</label>
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
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: #b13f1a;
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
        color: white;
        font-size: 0.8em;
      }
    `;
  }
}
