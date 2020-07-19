import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import "./sine-wave-icon";
import "./square-wave-icon";
import "./sawtooth-wave-icon";
import "./triangle-wave-icon";

const wave = Object.freeze({
  sine: "sine",
  sawtooth: "sawtooth",
  square: "square",
  triangle: "triangle",
});

@customElement("wave-selector-element")
export class WaveSelector extends LitElement {
  @property({ type: String })
  public value = wave.sine;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  async onSawSelect() {
    this.value = wave.sawtooth;
    this.dispatchSelect();
  }

  async onSquareSelect() {
    this.value = wave.square;
    this.dispatchSelect();
  }

  async onSineSelect() {
    this.value = wave.sine;
    this.dispatchSelect();
  }

  async onTriangleSelect() {
    this.value = wave.triangle;
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
          class="${this.computeButtonClasses(wave.sawtooth)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(wave.square)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(wave.triangle)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(wave.sine)}"
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

        background-color: var(--lighter-color);
        border: 1px solid #ccc;
        border-radius: 50%;
        box-shadow: 0px 1px 1px 1px 1 #ccc;
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;

        cursor: pointer;

        --stroke-color: black;
      }

      button .icon {
        margin-top: -2px;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--control-handle-color);
        --stroke-color: white;
        border-color: white;
      }
    `;
  }
}
