import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import { MidiLearnOptions } from "../../../types/midi-learn-options";
import { MidiChannelOptions } from "../../../types/midi-channel-options";
import { MenuMode } from "../../../types/menu-mode";

import "../../common/lcd/lcd-element";
import "../../visualizer-element";
@customElement("menu-element")
export class Menu extends LitElement {
  @property({ type: Number })
  private mode = MenuMode.MIDI_CHANNEL;

  render() {
    return html`
      <div class="menu">
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.PRESET)}"
            @click=${this.switchModeHandler(MenuMode.MIDI_CHANNEL)}
          >
            PRESET
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_CHANNEL)}"
            @click=${this.switchModeHandler(MenuMode.MIDI_CHANNEL)}
          >
            CHANNEL
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_LEARN)}"
            @click=${this.switchModeHandler(MenuMode.MIDI_LEARN)}
          >
            LEARN
          </button>
        </div>
        <div class="lcd-wrapper">
          <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        </div>
        <div class="button-wrapper select">
          <button @click=${this.previousOption}>PREV</button>
        </div>
        <div class="button-wrapper select">
          <button @click=${this.nextOption}>NEXT</button>
        </div>
      </div>
    `;
  }

  computeButtonClasses(mode: MenuMode) {
    return classMap({
      active: this.mode === mode,
    });
  }

  switchModeHandler(mode: MenuMode) {
    switch (mode) {
      case MenuMode.MIDI_CHANNEL:
        return () => {
          this.mode = MenuMode.MIDI_CHANNEL;
          this.requestUpdate();
        };
      case MenuMode.MIDI_LEARN:
        return () => {
          this.mode = MenuMode.MIDI_LEARN;
          this.requestUpdate();
        };
    }
  }

  nextOption() {
    this.options.next();
    this.requestUpdate();
  }

  previousOption() {
    this.options.previous();
    this.requestUpdate();
  }

  get options() {
    switch (this.mode) {
      case MenuMode.MIDI_CHANNEL:
        return MidiChannelOptions;
      case MenuMode.MIDI_LEARN:
      default:
        return MidiLearnOptions;
    }
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .menu {
        display: flex;
        --lcd-screen-height: 15px;
      }

      .lcd-wrapper {
        margin: 0.1em 0.5em 0 0.5em;
      }

      .menu .button-wrapper button {
        font-size: var(--button-font-size, 0.5em);

        background-color: var(--lighter-color);
        border: 1px solid var(--light-color, #ccc);
        box-shadow: 0px 1px 1px 1px var(--control-background-color, #ccc);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        height: 100%;

        color: black;
      }

      .menu .button-wrapper button:focus {
        outline: none;
      }

      .menu .button-wrapper button.active {
        background-color: var(--control-handle-color);
        color: white;
        box-shadow: 0px 1px 1px 1px var(--control-background-color, #ccc);
        transition: all 0.1s ease-in-out;
        cursor: auto;
      }

      .menu .button-wrapper.select button:active {
        transform: scale(0.999);
      }
    `;
  }
}
