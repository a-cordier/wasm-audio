import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("lcd-char-element")
export class LCDChar extends LitElement {
  @property({ type: Array })
  public char: boolean[][];

  render() {
    return html`
      <div class="lcd-char">
        ${this.char.map((ledRow) => this.createLedRow(ledRow))}
      </div>
    `;
  }

  createLedRow(led: boolean[]) {
    return html`
      <div class="led-row">
        ${led.map((led) => this.createLed(led))}
      </div>
    `;
  }

  createLed(isOn: boolean) {
    return isOn
      ? html`<div class="led on"></div>`
      : html`<div class="led"></div>`;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .lcd-char {
        height: 95%;
        width: 95%;
        display: grid;
        grid-template-rows: repeat(7, 1fr);
      }

      .led-row {
        width: 95%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
      }

      .led {
        width: 60%;
        height: 60%;
        background-color: transparent;
      }

      .led.on {
        background-color: #b4d455;
      }
    `;
  }
}
