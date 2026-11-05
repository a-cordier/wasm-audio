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

import { DischordController } from "../dischord-controller";
import {
  DEFAULT_CONFIG,
  Direction,
  Subdivision,
  TransportState,
} from "../types";
import { ToolbarEvent } from "./panels/dischord-toolbar";
import { SynthChangeEvent } from "../../../types/events";
import type { Plugin } from "../../../core/types";

import "./panels/dischord-toolbar";

@customElement("dischord-element")
export class DischordElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  // Set by device-slot from the KB arming state: the computer keyboard only
  // addresses armed devices, transport/pattern shortcuts included.
  @property({ attribute: false })
  kbArmed = false;

  // Set by device-slot from the slot's SYNC flag: tempo follows the master.
  @property({ attribute: false })
  transportSynced = false;

  private get sequencer(): DischordController {
    return this.plugin as DischordController;
  }

  @state()
  private transport: number = TransportState.STOPPED;

  @state()
  private bpm = DEFAULT_CONFIG.bpm;

  @state()
  private subdivision: number = DEFAULT_CONFIG.subdivision;

  @state()
  private direction: number = DEFAULT_CONFIG.direction;

  @state()
  private loop = DEFAULT_CONFIG.loop;

  @state()
  private metronome = DEFAULT_CONFIG.metronome;

  @state()
  private selectedPattern = 0;

  private clipboard: number | null = null;

  private onTransport = (e: Event) => {
    this.transport = (e as CustomEvent).detail.state;
  };

  private onConfigChange = () => {
    this.syncConfig();
  };

  private onPatternChange = () => {
    this.syncPattern();
  };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;

    this.sequencer.addEventListener("transport", this.onTransport);
    this.sequencer.addEventListener("config-change", this.onConfigChange);
    this.sequencer.addEventListener("pattern-change", this.onPatternChange);

    this.syncConfig();
    this.syncPattern();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!this.plugin) return;
    this.sequencer.removeEventListener("transport", this.onTransport);
    this.sequencer.removeEventListener("config-change", this.onConfigChange);
    this.sequencer.removeEventListener("pattern-change", this.onPatternChange);
  }

  // --- Sync from controller ---

  private syncConfig() {
    const config = this.sequencer.getState().config;
    this.bpm = config.bpm;
    this.subdivision = config.subdivision;
    this.direction = config.direction;
    this.loop = config.loop;
    this.metronome = config.metronome;
    this.transport = this.sequencer.transportState;
  }

  private syncPattern() {
    this.selectedPattern = this.sequencer.selectedPattern;
  }

  // --- Transport ---

  private togglePlayPause() {
    // SYNC on: the master transport owns start/stop (conditional-relevance
    // rule — the toolbar buttons are ghosted, and Space lands here too).
    if (this.transportSynced) return;
    this.audioContext.resume();
    this.sequencer.togglePlayPause();
  }

  private stop() {
    if (this.transportSynced) return;
    this.sequencer.stop();
  }

  // --- Patterns ---

  private copyPattern() {
    this.clipboard = this.selectedPattern;
    this.requestUpdate();
  }

  private pastePattern() {
    if (this.clipboard === null || this.clipboard === this.selectedPattern) return;
    this.sequencer.copyPattern(this.clipboard, this.selectedPattern);
    this.syncPattern();
  }

  private clearPattern() {
    this.sequencer.clearPattern();
  }

  render() {
    return html`
      <div class="dischord-layout">
        <row-element label="Transport">
          <dischord-toolbar
            .bpm=${this.bpm}
            .synced=${this.transportSynced}
            .subdivision=${this.subdivision}
            .transport=${this.transport}
            .direction=${this.direction}
            .loop=${this.loop}
            .metronome=${this.metronome}
            .hasClipboard=${this.clipboard !== null}
            @change=${this.onToolbarChange}
          ></dischord-toolbar>
        </row-element>
      </div>
    `;
  }

  private onToolbarChange(e: SynthChangeEvent<ToolbarEvent>) {
    const { type, value } = e.detail;
    switch (type) {
      case ToolbarEvent.PLAY_PAUSE:
        this.togglePlayPause();
        break;
      case ToolbarEvent.STOP:
        this.stop();
        break;
      case ToolbarEvent.BPM:
        this.bpm = value as number;
        this.sequencer.setBpm(this.bpm);
        break;
      case ToolbarEvent.SUBDIVISION:
        this.subdivision = value as number;
        this.sequencer.setSubdivision(this.subdivision as Subdivision);
        break;
      case ToolbarEvent.DIRECTION:
        this.direction = value as number;
        this.sequencer.setDirection(this.direction as Direction);
        break;
      case ToolbarEvent.LOOP:
        this.loop = (value as number) === 1;
        this.sequencer.setLoop(this.loop);
        break;
      case ToolbarEvent.METRONOME:
        this.metronome = (value as number) === 1;
        this.sequencer.setMetronome(this.metronome);
        break;
      case ToolbarEvent.COPY:
        this.copyPattern();
        break;
      case ToolbarEvent.PASTE:
        this.pastePattern();
        break;
      case ToolbarEvent.CLEAR:
        this.clearPattern();
        break;
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        --knob-size: var(--control-size-sm);
        --control-label-color: var(--light-secondary);
      }

      .dischord-layout {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1em;
        box-sizing: border-box;
      }
    `;
  }
}
