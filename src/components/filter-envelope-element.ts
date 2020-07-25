import { LitElement, html, css, customElement, property } from "lit-element";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import "./panel-wrapper-element";
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
      <panel-wrapper-element label="Filter mod">
        <div class="envelope-controls">
          <div class="time-controls">
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
          </div>
          <div class="mod-control">
            <knob-element
              label="mod."
              .value=${this.state.amount}
              @change=${this.onAmountChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></knob-element>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: #334452;
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
    `;
  }
}
