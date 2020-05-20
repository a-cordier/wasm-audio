import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("wrapper-element")
export class Wrapper extends LitElement {
  @property({ type: String })
  private label = "Osc 1";

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return html`
      <div class="wrapper">
        <label>${this.label}</label>
          <slot></slot>
          <div class="top-left-corner"></div>
          <div class="top-right-corner"></div>
          <div class="bottom-right-corner"></div>
          <div class="bottom-left-corner"></div>
        </div>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .wrapper {
        position: relative;

        width: var(--element-width, 180px);
        height: var(--element-width, 150px);
      }

      label {
        display: block;
        color: white;
        margin: 0 0 0.5em 0.25em;
      }

      .top-left-corner {
        position: absolute;

        top: -5px;
        left: -5px;

        height: 10%;
        width: 10%;

        border-left: 3px solid var(--control-handle-color);
        border-top: 3px solid var(--control-handle-color);
      }

      .top-right-corner {
        position: absolute;
        top: -5px;
        right: -5px;

        height: 10%;
        width: 10%;

        border-right: 3px solid var(--control-handle-color);
        border-top: 3px solid var(--control-handle-color);
      }

      .bottom-right-corner {
        position: absolute;
        bottom: -5px;
        right: -5px;

        height: 10%;
        width: 10%;

        border-right: 3px solid var(--control-handle-color);
        border-bottom: 3px solid var(--control-handle-color);
      }

      .bottom-left-corner {
        position: absolute;
        bottom: -5px;
        left: -5px;

        height: 10%;
        width: 10%;

        border-left: 3px solid var(--control-handle-color);
        border-bottom: 3px solid var(--control-handle-color);
      }
    `;
  }
}
