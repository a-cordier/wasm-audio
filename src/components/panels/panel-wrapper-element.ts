import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("panel-wrapper-element")
export class PanelWrapper extends LitElement {
  @property({ type: String })
  private label = String();

  render() {
    return html`
      <div class="wrapper">
          <label>${this.label}</label>
          <div class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .wrapper {
        position: relative;

        width: var(--panel-wrapper-width, 100%);
        height: var(--panel-wrapper-width, 100%);

        background-color: var(--panel-wrapper-background-color, transparent);

        border-radius: 0.5rem;

        padding: 0.25em;

        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      label {
        display: block;
        color: var(--panel-wrapper-label-color, white);
        margin: 0.25em auto 1em auto;
        text-align: center;
        text-transform: uppercase;
      }
    `;
  }
}
