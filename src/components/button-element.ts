import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("button-element")
export class Button extends LitElement {
  @property({ type: String })
  public text = String();

  async onChange(event) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { active: event.currentTarget.checked },
      })
    );
  }

  render() {
    return html` <button><slot></slot></button> `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      button {
        width: var(--button-width, 30px);
        height: var(--button-height, 30px);
        font-size: var(--button-font-size, 1.5em);

        background-color: var(--lighter-color);
        border: 1px solid var(--light-color, #ccc);
        border-radius: 50%;
        box-shadow: 0px 1px 1px 1px var(--control-background-color, #ccc);
        transition: all 0.1s ease-in-out;
      }

      button:focus {
        outline: none;
      }
    `;
  }
}
