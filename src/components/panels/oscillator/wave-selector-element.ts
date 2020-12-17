import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { OscillatorMode } from "../../../types/oscillator-mode";

import "../../common/icons/sine-wave-icon";
import "../../common/icons/square-wave-icon";
import "../../common/icons/sawtooth-wave-icon";
import "../../common/icons/triangle-wave-icon";

@customElement("wave-selector-element")
export class WaveSelector extends LitElement {
  @property({ type: Number })
  public value = OscillatorMode.SINE;

  async onSawSelect() {
    this.value = OscillatorMode.SAWTOOTH;
    this.dispatchSelect();
  }

  async onSquareSelect() {
    this.value = OscillatorMode.SQUARE;
    this.dispatchSelect();
  }

  async onSineSelect() {
    this.value = OscillatorMode.SINE;
    this.dispatchSelect();
  }

  async onTriangleSelect() {
    this.value = OscillatorMode.TRIANGLE;
    this.dispatchSelect();
  }

  dispatchSelect() {
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    return html`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(OscillatorMode.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `;
  }

  computeButtonClasses(wave) {
    return classMap({
      active: wave === this.value,
    });
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        width: 100%;
      }

      .wave-selector {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        width: var(--button-width, 25px);
        height: var(--button-height, 25px);
        font-size: var(--button-font-size, 1.5em);

        background-color: var(--button-disposed-background-color);
        border: 1px solid #ccc;
        border-radius: 50%;
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;

        cursor: pointer;

        --stroke-color: var(--button-disposed-label-color);
      }

      button .icon {
        margin-top: -2px;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color:  var(--button-active-background-color);
        --stroke-color: var(--button-active-label-color);
        border-color: white;
      }
    `;
  }
}
