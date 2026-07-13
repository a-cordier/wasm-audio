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
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import {
  createMidiOctaves,
  computeOctave,
  computePitchClassIndex,
} from "../../../midi/codec/notes";
import { MidiBus } from "../../../midi/bus/bus";
import { Status, Channel } from "../../../midi/types";

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

const DEFAULT_VELOCITY = 100;

@customElement("keys-element")
export class Keys extends LitElement {
  @property({ type: Number })
  public lowerKey = 36;

  @property({ type: Number })
  public higherKey = 61;

  @property({ type: Object })
  private pressedKeys;

  @property({ attribute: false })
  bus?: MidiBus;

  @property({ type: Number })
  channel: Channel = 0 as Channel;

  @state()
  private effectiveLower = this.lowerKey;

  @state()
  private effectiveHigher = this.higherKey;

  private mouseControlledKey = null;
  private resizeObserver: ResizeObserver | null = null;

  get octaves() {
    return octaves.slice(
      computeOctave(this.effectiveLower),
      computeOctave(this.effectiveHigher) + 1
    );
  }

  private computeKeyRange() {
    const width = this.clientWidth;
    if (width === 0) return;

    const octaveMinWidth = 250;
    const maxOctaves = Math.max(1, Math.floor(width / octaveMinWidth));
    const requestedOctaves = computeOctave(this.higherKey) - computeOctave(this.lowerKey) + 1;

    if (maxOctaves >= requestedOctaves) {
      if (this.effectiveLower !== this.lowerKey || this.effectiveHigher !== this.higherKey) {
        this.effectiveLower = this.lowerKey;
        this.effectiveHigher = this.higherKey;
      }
      return;
    }

    const centerMidi = Math.round((this.lowerKey + this.higherKey) / 2);
    const centerOctave = computeOctave(centerMidi);
    const halfBelow = Math.floor(maxOctaves / 2);
    const startOctave = Math.max(0, centerOctave - halfBelow);
    const newLower = (startOctave + 1) * 12;
    const newHigher = (startOctave + maxOctaves + 1) * 12 - 1;
    if (this.effectiveLower !== newLower || this.effectiveHigher !== newHigher) {
      this.effectiveLower = newLower;
      this.effectiveHigher = newHigher;
    }
  }

  private onResize = () => this.computeKeyRange();

  async connectedCallback() {
    super.connectedCallback();
    this.registerMouseUpHandler();

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this);
  }

  protected firstUpdated() {
    this.computeKeyRange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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
    if (this.bus) {
      this.bus.send(Status.NOTE_ON, this.channel, key.midiValue, DEFAULT_VELOCITY);
    } else {
      this.pressedKeys?.add(key.midiValue);
      this.dispatchEvent(new CustomEvent("keyOn", { detail: key }));
    }
    await this.requestUpdate();
  }

  async keyOff(key) {
    if (this.bus) {
      this.bus.send(Status.NOTE_OFF, this.channel, key.midiValue, 0);
    } else {
      this.pressedKeys?.delete(key.midiValue);
      this.dispatchEvent(new CustomEvent("keyOff", { detail: key }));
    }
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
        display: block;
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
      }

      .octave + .octave {
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
