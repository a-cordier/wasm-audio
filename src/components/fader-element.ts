import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { styleMap } from "lit-html/directives/style-map";

@customElement("fader-element")
export class Fader extends LitElement {
  @property({ type: String })
  public label = String();

  @property({ type: Number })
  public value = 127;

  private cursorElements = [];

  constructor() {
    super();
  }

  async onChange(event) {
    this.dispatchEvent(new CustomEvent("change", {}));
  }

  toggleActive(event) {
    const host = this.shadowRoot.host as HTMLElement;
    const offsetParent = host.offsetParent as HTMLElement;
    const cursorWrapper = this.shadowRoot.querySelector(
      ".cursor-wrapper"
    ) as HTMLElement;
    const height = cursorWrapper.offsetHeight;
    const position =
      event.pageY - (offsetParent.offsetTop + cursorWrapper.offsetTop);

    this.updateValue((1 - position / height) * 128);

    const drag = (event: DragEvent) => {
      event.preventDefault();
      this.updateValue(this.value - event.movementY);
    };

    const destroy = () => {
      document.removeEventListener("mouseup", destroy);
      document.removeEventListener("mousemove", drag);
    };

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", destroy);
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    this.updateValue(this.value + event.deltaY);
  }

  updateValue(value) {
    if (value <= 0 || value >= 127) {
      return;
    }
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value } })
    );
  }

  computeFaderCursorStyle() {
    return styleMap({
      height: `${(this.value / 128) * 100}%`,
    });
  }

  get cursor() {
    return html` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`;
  }

  render() {
    return html`
      <div class="fader">
        <div class="fader-wrapper">
          <div
            class="cursor-wrapper"
            @mousedown="${this.toggleActive}"
            @wheel="${this.onWheel}"
          >
            ${this.cursor}
          </div>
        </div>
        <label>${this.label}</label>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .fader {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .fader-wrapper {
        width: var(--fader-width, 25px);
        height: var(--fader-height, 100px);
        border: 1px solid var(--lighter-color, white);
        border-radius: 2px;
      }

      .cursor-wrapper {
        width: 85%;
        height: 99%;
        margin: 0 auto;

        position: relative;
      }

      .fader-cursor {
        display: block;
        width: 100%;

        background-color: var(--control-handle-color);

        position: absolute;
        bottom: 0;
      }

      label {
        display: block;
        color: white;
        font-size: 0.8em;
        margin-top: 0.2em;
      }
    `;
  }
}
