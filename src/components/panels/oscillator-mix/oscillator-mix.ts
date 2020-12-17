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
                    label="osc mix"
                    .value=${this.state.osc2Amplitude.value as number}
                    @change=${this.onMixChange}
                ></knob-element>
                </midi-control-wrapper>
            </div>
        </panel-wrapper-element>
    `;
  }

  onMixChange(event: CustomEvent) {
    this.dispatchEvent(new CustomEvent("change", event));
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .oscillator-mix {
        --knob-size: 60px;
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);
        display: inline-flex;
        justify-content: center;
      }

      .synth .oscillator-mix.focused {
        animation: control-focus 1s ease-in-out infinite;
      }
    `;
  }
}
