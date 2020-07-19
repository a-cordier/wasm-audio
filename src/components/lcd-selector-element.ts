import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import "./lcd-element";
import { SelectOptions, SelectOption } from "../types/select-option";

@customElement("lcd-selector-element")
export class LCDSelector extends LitElement {
  @property({ type: Object })
  public options: SelectOptions;

  render() {
    return html`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">
          ${this.options.map(this.createOptionSelector.bind(this))}
        </div>
      </div>
    `;
  }

  createOptionSelector(_: never, index: number) {
    return html`
      <button
        @click=${this.createOptionHandler(index)}
        class="${this.computeButtonClasses(index)}"
      >
        ${index}
      </button>
    `;
  }

  computeButtonClasses(index: number) {
    return classMap({
      active: this.options.index === index,
    });
  }

  createOptionHandler(index) {
    return () => {
      this.options.index = index;
      this.requestUpdate();
      this.dispatchChange(this.options.getCurrent());
    };
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
        margin: auto;
      }

      .lcd-selector .options {
        display: flex;
        justify-content: space-between;
        margin: 0.5rem auto 0.5rem auto;

        width: 80%;
      }

      button {
        font-size: var(--button-font-size, 0.5em);

        background-color: var(--lighter-color);
        border: 1px solid var(--light-color, #ccc);
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
        box-shadow: none;

        cursor: auto;
      }
    `;
  }
}
