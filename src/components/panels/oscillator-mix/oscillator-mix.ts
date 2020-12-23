import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import { MidiControlID } from "../../../types/midi-learn-options";
import { OscillatorEvent } from "../../../types/oscillator-event";

@customElement("oscillator-mix-element")
export class OscillatorMix extends LitElement {
@property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  @property({ type: Object })
  private state: any;

  render() {
    return html`
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${MidiControlID.OSC_MIX}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="mix"
                    label="mix"
                    .value=${this.state.osc2Amplitude.value as number}
                    @change=${this.onMixChange}
                ></knob-element>
                </midi-control-wrapper>
                <midi-control-wrapper
                .controlID=${MidiControlID.NOISE_LEVEL}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="noise"
                    label="noise"
                    .value=${this.state.noiseLevel.value as number}
                    @change=${this.onNoiseChange}
                ></knob-element>
                </midi-control-wrapper>
            </div>
            <div class="noise-control">
                
            </div>
        </panel-wrapper-element>
    `;
  }

  onMixChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.MIX, event.detail.value);
  }

  onNoiseChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEvent.NOISE, event.detail.value);
  }

  dispatchChange(type: OscillatorEvent, value: number | string) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);

      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;

        width: 60px; 
        height: 130px;
      }

      .oscillator-mix .mix {
        --knob-size: 40px;
      }

      .oscillator-mix .noise {
        --knob-size: 30px;
      }     
    `;
  }
}
