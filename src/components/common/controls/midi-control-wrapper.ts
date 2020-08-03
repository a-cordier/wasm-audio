import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { MidiControlID } from "../../../types/midi-learn-options";

@customElement("midi-control-wrapper")
export class MidiControlWrapper extends LitElement {
  @property({ type: Number })
  private controlID: MidiControlID;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

  get hasFocus() {
    return this.currentLearnerID === this.controlID;
  }

  render() {
    return html`
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `;
  }

  computeClassMap() {
    return classMap({
      wrapper: true,
      focus: this.hasFocus,
    });
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);
          --control-label-color: var(--control-hander-color-focused);
        }
      }
    `;
  }
}
