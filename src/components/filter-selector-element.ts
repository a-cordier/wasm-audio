import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { FilterMode } from "../types/filter-mode";

@customElement("filter-selector-element")
export class FilterSelector extends LitElement {
  @property({ type: String })
  public value = FilterMode.LOWPASS;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  async onLpSelect() {
    this.value = FilterMode.LOWPASS;
    this.dispatchSelect();
  }

  async onLpPlusSelect() {
    this.value = FilterMode.LOWPASS_PLUS;
    this.dispatchSelect();
  }

  async onBpSelect() {
    this.value = FilterMode.BANDPASS;
    this.dispatchSelect();
  }

  async onHpSelect() {
    this.value = FilterMode.HIGHPASS;
    this.dispatchSelect();
  }

  dispatchSelect() {
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    return html`
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(FilterMode.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `;
  }

  computeButtonClasses(mode) {
    return classMap({
      active: mode === this.value,
    });
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        width: 100%;
        font-size: 0.5em;
      }

      .filter-selector {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        width: var(--button-width, 30px);
        height: var(--button-height, 30px);

        font-size: var(--button-font-size, 1.5em);

        background-color: var(--lighter-color);
        border: 1px solid var(--light-color, #ccc);
        border-radius: 50%;
        box-shadow: 0px 1px 1px 1px var(--control-background-color, #ccc);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;

        cursor: pointer;

        color: black;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--control-handle-color);
        color: white;
        border-color: white;
      }
    `;
  }
}
