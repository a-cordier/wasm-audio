import { LitElement, html, css, customElement, property } from "lit-element";

import { chars } from "./lcd-chars";

import "./lcd-char-element";

@customElement("lcd-element")
export class LCD extends LitElement {
  @property({ type: String })
  public text;

  render() {
    return html`
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `;
  }

  createLcdChar(char: string) {
    const lcdChar = chars[char];
    return html`
      <lcd-char-element .char=${lcdChar} class="char"></lcd-char-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .lcd {
        width: var(--screen-width, 120px);
        height: var(--screen-height, 12px);

        display: grid;
        grid-template-columns: repeat(10, 1fr);
        grid-auto-flow: columns;

        border: 1px solid gray;

        padding: 5px;
      }

      .char {
        width: 85%;
        grid-row: 1;
      }
    `;
  }
}
