import { LitElement, html, css, customElement, property } from "lit-element";
import { OscillatorEvent } from "../types/oscillator-event";
import { OscillatorMode } from "../types/oscillator-mode";

import "./wave-selector-element";
import "./knob-element";
import "./panel-wrapper-element";

interface OscillatorState {
  mode: OscillatorMode;
  semiShift: number;
  centShift: number;
}

@customElement("oscillator-element")
export class Oscillator extends LitElement {
  @property({ type: String })
  private label = "Osc";

  @property({ type: Object })
  private state: OscillatorState = {
    mode: OscillatorMode.SAWTOOTH,
    semiShift: 0,
    centShift: 0,
  };

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onSemiShift(event: CustomEvent) {
    if (event.detail.value < 39 || event.detail.value > 87) {
      return;
    }
    const value = event.detail.value - 39 - 24; // mapped to [-24;24]
    this.dispatchChange(OscillatorEvent.SEMI_SHIFT, value);
  }

  get semiShiftValue() {
    return this.state.semiShift + 39 + 24;
  }

  onCentShift(event: CustomEvent) {
    if (event.detail.value < 13 || event.detail.value > 113) {
      return;
    }
    const value = event.detail.value - 13 - 50; // mapped to [-50;50]
    this.dispatchChange(OscillatorEvent.CENT_SHIFT, value);
  }

  get centShiftValue() {
    return this.state.centShift + 13 + 50;
  }

  onWaveFormChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.WAVE_FORM, event.detail.value);
  }

  dispatchChange(type: OscillatorEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="semi-shift-control">
                <knob-element
                  .value=${this.semiShiftValue}
                  @change=${this.onSemiShift}
                  .shouldMidiLearn=${this.shouldMidiLearn}
                ></knob-element>
              </div>
              <label>semi</label>
            </div>
            <div class="shift-control">
              <div class="cent-shift-control cent">
                <knob-element
                  .value=${this.centShiftValue}
                  @change=${this.onCentShift}
                  .shouldMidiLearn=${this.shouldMidiLearn}
                ></knob-element>
              </div>
              <label>cents</label>
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
        --panel-wrapper-background-color: #7a1621;
      }

      .oscillator-controls {
        position: relative;

        width: 160px;
        height: 130px;
      }

      .oscillator-controls .tone-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .oscillator-controls .tone-controls .shift-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .oscillator-controls .tone-controls .semi-shift-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;

        --knob-size: 50px;
      }

      .oscillator-controls .tone-controls .cent-shift-control {
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
