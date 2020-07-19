import { LitElement, html, css, customElement, property } from "lit-element";
import { OscillatorEnvelopeEvent } from "../types/oscillator-envelope-event";
import "./panel-wrapper-element";
import "./fader-element";

@customElement("oscillator-envelope-element")
export class OscillatorEnvelope extends LitElement {
  @property({ type: Boolean })
  private shouldMidiLearn = false;

  @property({ type: String })
  private label = "Envelope";

  @property({ type: Object })
  private state = {
    attack: 0,
    decay: 127 / 2,
    sustain: 100,
    release: 12,
  };

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
          <fader-element
            label="A"
            .value=${this.state.attack}
            @change=${this.onAttackChange}
          ></fader-element>
          <fader-element
            label="D"
            .value=${this.state.decay}
            @change=${this.onDecayChange}
          ></fader-element>
          <fader-element
            label="S"
            .value=${this.state.sustain}
            @change=${this.onSustainChange}
          ></fader-element>
          <fader-element
            label="R"
            .value=${this.state.release}
            @change=${this.onReleaseChange}
          ></fader-element>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: #7a1621;
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
