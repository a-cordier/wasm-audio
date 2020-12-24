import { LitElement, html, css, customElement, property } from "lit-element";
import { OscillatorEnvelopeEvent } from "../../../../types/oscillator-envelope-event";
import { MidiControlID } from "../../../../types/midi-learn-options";

import "../panel-wrapper-element";
import "../../../common/controls/midi-control-wrapper";
import "../../../common/controls/fader-element";

@customElement("envelope-element")
export class Envelope extends LitElement {
  @property({ type: String })
  private label = "Envelope";

  @property({ type: Object })
  private state;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  onAttackChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEnvelopeEvent.ATTACK, event.detail.value);
  }

  onDecayChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEnvelopeEvent.DECAY, event.detail.value);
  }

  onSustainChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEnvelopeEvent.SUSTAIN, event.detail.value);
  }

  onReleaseChange(event: CustomEvent) {
    this.dispatchChange(OscillatorEnvelopeEvent.RELEASE, event.detail.value);
  }

  dispatchChange(type: OscillatorEnvelopeEvent, value: number) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <midi-control-wrapper
            .controlID=${MidiControlID.ATTACK}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control focus"
              label="A"
              .value=${this.state.attack.value}
              @change=${this.onAttackChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${MidiControlID.DECAY}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="D"
              .value=${this.state.decay.value}
              @change=${this.onDecayChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${MidiControlID.SUSTAIN}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="S"
              .value=${this.state.sustain.value}
              @change=${this.onSustainChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${MidiControlID.RELEASE}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="R"
              .value=${this.state.release.value}
              @change=${this.onReleaseChange}
            ></fader-element>
          </midi-control-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: var(--envelope-panel-color);
        --fader-height: 120px;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        width: 160px;
        height: 160px;
      }
    `;
  }
}
