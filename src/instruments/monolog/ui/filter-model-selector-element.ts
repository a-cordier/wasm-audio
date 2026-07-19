import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { MonologFilterModel } from "../types/monolog-params";

const FILTER_OPTIONS = [
  { label: "M", value: MonologFilterModel.MOOG },
  { label: "A", value: MonologFilterModel.ACID },
  { label: "S", value: MonologFilterModel.SCREAM },
  { label: "K", value: MonologFilterModel.KORG },
];

@customElement("filter-model-selector-element")
export class FilterModelSelector extends LitElement {
  @property({ type: Number })
  public value = MonologFilterModel.MOOG;

  private select(model: number) {
    this.value = model;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  render() {
    return html`
      <div class="selector">
        ${FILTER_OPTIONS.map(opt => html`
          <button
            class=${classMap({ active: opt.value === this.value })}
            @click=${() => this.select(opt.value)}
          >${opt.label}</button>
        `)}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        align-items: center;
      }

      .selector {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      button {
        width: var(--button-width, 25px);
        height: var(--button-height, 25px);
        font-size: var(--button-font-size, 0.6em);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;

        background-color: var(--button-disposed-background-color);
        color: var(--button-disposed-label-color);
        border: 1px solid var(--button-border-color, #ccc);
        border-radius: var(--button-border-radius, 50%);
        box-shadow: var(--box-shadow);
        box-sizing: border-box;
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        padding: var(--button-padding, 0);
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);
        border-color: var(--button-active-border-color, var(--button-active-label-color));
      }
    `;
  }
}
