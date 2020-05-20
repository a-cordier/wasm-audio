import { LitElement, html, css, customElement, property } from "lit-element";
import { FilterMode } from "../types/filter-mode";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import "./wrapper-element";
import "./fader-element";
import "./knob-element";

@customElement("filter-envelope-element")
export class FilterEnvelope extends LitElement {
  @property({ type: Boolean })
  private shouldMidiLearn = false;

  @property({ type: Object })
  private state = {
    attack: 0,
    decay: 127 / 2,
    amount: 0,
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onAttackChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.ATTACK, event.detail.value);
  }

  onDecayChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.DECAY, event.detail.value);
  }

  onAmountChange(event: CustomEvent) {
    this.dispatchChange(FilterEnvelopeEvent.AMOUNT, event.detail.value);
  }

  dispatchChange(type: FilterEnvelopeEvent, value: number) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <wrapper-element label="Envelope">
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
          <knob-element
            label="mod."
            .value=${this.state.amount}
            @change=${this.onAmountChange}
          ></knob-element>
        </div>
      </wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;

        --knob-size: 50px;
      }
    `;
  }
}
