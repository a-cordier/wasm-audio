import { LitElement, html, css, customElement, property } from "lit-element";

import "./lcd-element";
import { SelectOptions, SelectOption } from "../types/select-option";

@customElement("lcd-selector-element")
export class LCDSelector extends LitElement {
  @property({ type: Object })
  public options: SelectOptions;

  render() {
    return html`
      <div class="lcd-selector">
        <button @click=${this.previousOption}>◀</button>
        <lcd-element .text=${this.options.getCurrent().value}></lcd-element>
        <button @click=${this.nextOption}>▶</button>
      </div>
    `;
  }

  nextOption() {
    this.options.next();
    this.requestUpdate();
    this.dispatchChange(this.options.getCurrent());
  }

  previousOption() {
    this.options.previous();
    this.requestUpdate();
    this.dispatchChange(this.options.getCurrent());
  }

  dispatchChange({ value }: SelectOption) {
    this.dispatchEvent(new CustomEvent("change", { detail: { value } }));
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .lcd-selector {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      button {
        width: var(--button-width, 20px);
        height: var(--button-height, 20px);

        font-size: var(--button-font-size, 0.5em);

        background-color: var(--lighter-color);
        border: 1px solid var(--light-color, #ccc);
        border-radius: 50%;
        box-shadow: 0px 1px 1px 1px var(--control-background-color, #ccc);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

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
