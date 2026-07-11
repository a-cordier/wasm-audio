import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { VoiceConfigEvent } from "../../../types/voice-config-event";
import { VoiceConfigState } from "../../../types/voice";
import { VoiceMode } from "../../../types/voice-mode";
import { ControlID } from "../../../../../control/types";
import { SynthPanel } from "../../../../../components/common/synth-panel";

@customElement("voice-config-element")
export class VoiceConfigElement extends SynthPanel {
  @property({ type: Object })
  state: VoiceConfigState;

  private onModeSelect(mode: VoiceMode) {
    this.dispatchChange(VoiceConfigEvent.VOICE_MODE, mode);
  }

  private onRetriggerToggle() {
    const current = this.state.retrigger.value as number;
    this.dispatchChange(VoiceConfigEvent.RETRIGGER, current >= 0.5 ? 0 : 1);
  }

  render() {
    const isMono = (this.state.voiceMode.value as number) >= 0.5;
    const isRetrigger = (this.state.retrigger.value as number) >= 0.5;

    return html`
      <panel-wrapper-element label="Voice">
        <div class="voice-config">
          <div class="mode-selector">
            <button
              class=${classMap({ active: !isMono })}
              @click=${() => this.onModeSelect(VoiceMode.POLY)}
            >POLY</button>
            <button
              class=${classMap({ active: isMono })}
              @click=${() => this.onModeSelect(VoiceMode.MONO)}
            >MONO</button>
          </div>
          <div class="mono-controls ${classMap({ hidden: !isMono })}">
            <div class="glide-control">
              <control-learn-wrapper controlID=${ControlID.GLIDE_TIME}>
                <knob-element label="glide" .value=${this.state.glideTime.value as number * 127}
                  @change=${(e: CustomEvent) => this.dispatchChange(VoiceConfigEvent.GLIDE_TIME, e.detail.value / 127)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <button
              class="retrigger-btn ${classMap({ active: isRetrigger })}"
              @click=${this.onRetriggerToggle}
            >RTG</button>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        --panel-wrapper-background-color: var(--voice-config-panel-color, var(--filter-mod-panel-color));
        --knob-size: var(--control-size-sm, 30px);
        container-type: inline-size;
        height: 100%;
      }

      .voice-config {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75em;
        height: 100%;
        padding: 0.5em 0;
        width: 100%;
        box-sizing: border-box;
      }

      .mode-selector {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
        max-width: 100%;
      }

      .mode-selector button,
      .retrigger-btn {
        padding: 0.2em 0.4em;
        font-size: 0.7em;
        font-weight: bold;
        background-color: var(--button-disposed-background-color);
        color: var(--button-disposed-label-color);
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.1s ease-in-out;
      }

      .mode-selector button:focus,
      .retrigger-btn:focus {
        outline: none;
      }

      .mode-selector button.active,
      .retrigger-btn.active {
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);
        border-color: white;
      }

      .mono-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5em;
        width: 100%;
        transition: opacity 0.15s ease;
      }

      .mono-controls.hidden {
        opacity: 0.3;
        pointer-events: none;
      }

      @container (min-width: 100px) {
        .mono-controls {
          flex-direction: row;
          justify-content: space-evenly;
          gap: 1em;
        }
        :host { --knob-size: var(--control-size-md, 40px); }
      }
    `;
  }
}
