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
import {
  createMidiOctaves,
  computeOctave,
  computePitchClassIndex,
} from "../../../core/midi/midi-note";

const octaves = createMidiOctaves(440).map(mapKeys);

function mapKeys(octave) {
  return octave.map((note) => {
    const isSharp = note.pitchClass.endsWith("#");
    const pitch = isSharp
      ? note.pitchClass.replace("#", "--sharp")
      : note.pitchClass;

    return {
      ...note,
      classes: {
        [pitch]: true,
        "key--sharp": isSharp,
        "key--whole": !isSharp,
        key: true,
      },
    };
  });
}

@customElement("keys-element")
export class Keys extends LitElement {
  @property({ type: Number })
  public lowerKey = 36;

  @property({ type: Number })
  public higherKey = 61;

  @property({ type: Object })
  private pressedKeys;

  private mouseControlledKey = null;

  get octaves() {
    return octaves.slice(
      computeOctave(this.lowerKey),
      computeOctave(this.higherKey) + 1
    );
  }

  async connectedCallback() {
    super.connectedCallback();
    this.registerMouseUpHandler();
  }

  registerMouseUpHandler() {
    document.addEventListener("mouseup", this.mouseUp.bind(this));
  }

  mouseUp() {
    if (!!this.mouseControlledKey) {
      this.keyOff(this.mouseControlledKey);
      this.mouseControlledKey = null;
    }
  }

  mouseDown(key) {
    return async (event) => {
      if (event.button !== 0) {
        return;
      }
      this.mouseControlledKey = key;
      await this.keyOn(key);
    };
  }

  mouseEnter(key) {
    return async () => {
      if (!!this.mouseControlledKey) {
        await this.keyOff(this.mouseControlledKey);
        this.mouseControlledKey = key;
        await this.keyOn(key);
      }
    };
  }

  findKey(midiValue) {
    return octaves[computeOctave(midiValue)][computePitchClassIndex(midiValue)];
  }

  async keyOn(key) {
    this.pressedKeys.add(key.midiValue);
    this.dispatchEvent(
      new CustomEvent("keyOn", {
        detail: key,
      })
    );
    await this.requestUpdate();
  }

  async keyOff(key) {
    this.pressedKeys.delete(key.midiValue);
    this.dispatchEvent(
      new CustomEvent("keyOff", {
        detail: key,
      })
    );
    await this.requestUpdate();
  }

  createOctaveElement(keys) {
    return html`
      <div class="octave">
        ${keys.map(this.createKeyElement.bind(this))}
      </div>
    `;
  }

  createKeyElement(key) {
    return html`
      <div
        @mousedown=${this.mouseDown(key)}
        @mouseenter=${this.mouseEnter(key)}
        id="${key.midiValue}"
        class="${this.computeKeyClasses(key)}"
      ></div>
    `;
  }

  computeKeyClasses(key) {
    return classMap({
      ...key.classes,
      "key--pressed": this.pressedKeys && this.pressedKeys.has(key.midiValue),
    });
  }

  render() {
    return html`
      <div class="octaves">
        ${this.octaves.map(this.createOctaveElement.bind(this))}
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        user-select: none;
        outline: none;
        width: 100%;
      }

      .octaves {
        display: flex;
        justify-content: flex-start;
        height: var(--key-height, 100%);
      }

      .octave {
        flex-grow: 1;

        display: grid;
        grid-template-columns: repeat(84, 1fr);

        margin-left: -7px;
      }

      .key {
        border: 1px solid white;
      }

      .key--sharp {
        background-color: var(--key-sharp-color, #999);
        z-index: 1;
        height: 60%;
      }

      .key--whole {
        background-color: var(--key-whole-color, #ccc);
        height: 100%;
      }

      .key--pressed {
        filter: brightness(2);
      }

      .C {
        grid-row: 1;
        grid-column: 1 / span 12;
      }

      .C--sharp {
        grid-row: 1;
        grid-column: 8 / span 8;
      }

      .D {
        grid-row: 1;
        grid-column: 12 / span 12;
      }

      .D--sharp {
        grid-row: 1;
        grid-column: 20 / span 8;
      }

      .E {
        grid-row: 1;
        grid-column: 24 / span 12;
      }

      .F {
        grid-row: 1;
        grid-column: 36 / span 12;
      }

      .F--sharp {
        grid-row: 1;
        grid-column: 44 / span 8;
      }

      .G {
        grid-row: 1;
        grid-column: 48 / span 12;
      }

      .G--sharp {
        grid-row: 1;
        grid-column: 56 / span 8;
      }

      .A {
        grid-row: 1;
        grid-column: 60 / span 12;
      }

      .A--sharp {
        grid-row: 1;
        grid-column: 68 / span 8;
      }

      .B {
        grid-row: 1;
        grid-column: 72 / span 12;
      }

      .key--white {
        fill: var(--control-background-color, #ccc);
        stroke: var(--primary-color, #ccc);
      }

      .key--black {
        fill: var(--primary-color, #ccc);
      }
    `;
  }
}
