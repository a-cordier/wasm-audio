/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import { MidiLearnOptions } from "../../../../types/midi-learn-options";
import { MidiChannelOptions } from "../../../../types/midi-channel-options";
import { MenuMode } from "../../../../types/menu-mode";
import { PresetOptions } from "../../../../core/presets/options";

import "../../../common/lcd/lcd-element";
@customElement("menu-element")
export class Menu extends LitElement {
  @property({ type: Number })
  private mode = MenuMode.PRESET;

  render() {
    return html`
      <div class="menu">
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.PRESET)}"
            @click=${this.createSwitchModeHandler(MenuMode.PRESET)}
          >
            PRESET
          </button>
        </div>
        <div class="button-wrapper channel">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_CHANNEL)}"
            @click=${this.createSwitchModeHandler(MenuMode.MIDI_CHANNEL)}
          >
            CHANNEL
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_LEARN)}"
            @click=${this.createSwitchModeHandler(MenuMode.MIDI_LEARN)}
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
        <div class="label">WASM POLY</div>
      </div>
    `;
  }

  computeButtonClasses(mode: MenuMode) {
    return classMap({
      active: this.mode === mode,
    });
  }

  createSwitchModeHandler(mode: MenuMode) {
    switch (mode) {
      case MenuMode.MIDI_CHANNEL:
        return () => {
          this.mode = MenuMode.MIDI_CHANNEL;
          this.dispatchChange();
        };
      case MenuMode.MIDI_LEARN:
        return () => {
          this.mode = MenuMode.MIDI_LEARN;
          this.dispatchChange();
        };
      case MenuMode.PRESET:
        return () => {
          this.mode = MenuMode.PRESET;
          this.dispatchChange();
        };
    }
  }

  nextOption() {
    this.options.next();
    this.dispatchChange(true);
    this.requestUpdate();
  }

  previousOption() {
    this.options.previous();
    this.dispatchChange(true);
    this.requestUpdate();
  }

  dispatchChange(shouldUpdate = false) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          type: this.mode,
          option: this.options.getCurrent(),
          shouldUpdate,
        },
      })
    );
  }

  get options() {
    switch (this.mode) {
      case MenuMode.PRESET:
        return PresetOptions;
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
        --lcd-screen-width: 130px;
      }

      .lcd-wrapper {
        margin: 0.3em 0.5em 0 0.5em;
      }

      .menu .button-wrapper button {
        font-size: var(--button-font-size, 0.5em);

        background-color: var(--button-disposed-background-color);
        border: var(--button-border);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        height: 100%;

        color: var(--button-disposed-label-color);
      }

      .menu .button-wrapper button:disabled {
        opacity: 0.5;
        color: white;
      }

      .menu .button-wrapper button:focus {
        outline: none;
      }

      .menu .button-wrapper button.active {
        background-color: var(--button-active-background-color);
        border: 1px solid transparent;
        color: var(--button-active-label-color);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;
        cursor: auto;
      }

      .menu .button-wrapper.channel {
        margin: 0 1px;
      }

      .menu .button-wrapper.select {
        margin: 0 1px;
      }

      .menu .button-wrapper.select button:active {
        transform: scale(0.99);
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);
      }

      .menu .label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 2.3em;
        font-weight: 700;
        line-height: 1em;
        color: var(--main-panel-label-color);
        font-family: var(--main-panel-label-font-family);
        margin-left: 0.5em;
        letter-spacing: 0.1em;
      }
    `;
  }
}
