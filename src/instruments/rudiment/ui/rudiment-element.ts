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

import { RudimentController } from "../rudiment-controller";
import { TransportKeys } from "./transport-keys";
import {
  BANK_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_LANES,
  DEFAULT_PATTERN_STEPS,
  LANE_COUNT,
  MAX_STEPS,
  PATTERN_COUNT,
  Subdivision,
  TransportState,
  VELOCITY_LEVELS,
} from "../types";
import { ControlID } from "../../../control/types";
import { ToolbarEvent } from "./panels/rudiment-toolbar";
import { SynthChangeEvent } from "../../../types/events";
import type { Plugin } from "../../../core/types";

import "./panels/rudiment-toolbar";
import "./panels/drum-grid-panel";

@customElement("rudiment-element")
export class RudimentElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  // Set by device-slot from the KB arming state.
  @property({ attribute: false })
  kbArmed = false;

  // Set by device-slot from the slot's SYNC flag.
  @property({ attribute: false })
  transportSynced = false;

  private get sequencer(): RudimentController {
    return this.plugin as RudimentController;
  }

  @state() private transport: number = TransportState.STOPPED;
  @state() private grid = -1;
  @state() private bpm = DEFAULT_CONFIG.bpm;
  @state() private subdivision: number = DEFAULT_CONFIG.subdivision;
  @state() private metronome = DEFAULT_CONFIG.metronome;
  @state() private swing = DEFAULT_CONFIG.swing;
  @state() private gate = DEFAULT_CONFIG.gate;
  @state() private steps = DEFAULT_PATTERN_STEPS;
  @state() private pattern: number[][] = emptyPattern();
  @state() private laneLengths: number[] = new Array(LANE_COUNT).fill(DEFAULT_PATTERN_STEPS);
  @state() private laneMutes: boolean[] = new Array(LANE_COUNT).fill(false);
  @state() private selectedLane = 0;
  @state() private selectedPattern = 0;
  @state() private bank = 0;
  @state() private brush: number = VELOCITY_LEVELS[1];

  private clipboard: number | null = null;
  private readonly keys = new TransportKeys();

  private onPosition = (e: Event) => {
    this.grid = (e as CustomEvent).detail.grid;
  };

  private onTransport = (e: Event) => {
    this.transport = (e as CustomEvent).detail.state;
  };

  private onConfigChange = () => this.syncConfig();
  private onPatternChange = () => this.syncPattern();

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;

    this.sequencer.addEventListener("position", this.onPosition);
    this.sequencer.addEventListener("transport", this.onTransport);
    this.sequencer.addEventListener("config-change", this.onConfigChange);
    this.sequencer.addEventListener("pattern-change", this.onPatternChange);

    this.syncConfig();
    this.syncPattern();

    this.keys.attach({
      togglePlayPause: () => this.togglePlayPause(),
      stop: () => this.stop(),
      selectSlot: (slot) => this.selectPattern(this.bank * BANK_SIZE + slot),
      selectBank: (bank) => this.selectBank(bank),
      clearPattern: () => this.clearPattern(),
      copyPattern: () => this.copyPattern(),
      pastePattern: () => this.pastePattern(),
    }, () => this.kbArmed);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.keys.detach();

    if (!this.plugin) return;
    this.sequencer.removeEventListener("position", this.onPosition);
    this.sequencer.removeEventListener("transport", this.onTransport);
    this.sequencer.removeEventListener("config-change", this.onConfigChange);
    this.sequencer.removeEventListener("pattern-change", this.onPatternChange);
  }

  // --- Sync from controller (the controller is the source of truth) ---

  private syncConfig() {
    const config = this.sequencer.getState().config;
    this.bpm = config.bpm;
    this.subdivision = config.subdivision;
    this.metronome = config.metronome;
    this.swing = config.swing;
    this.gate = config.gate;
    this.laneMutes = [...config.laneMutes];
    this.transport = this.sequencer.transportState;
  }

  private syncPattern() {
    this.selectedPattern = this.sequencer.selectedPattern;
    this.bank = this.sequencer.bank;
    this.steps = this.sequencer.getPatternSteps();
    this.pattern = this.sequencer.readPattern();
    this.laneLengths = Array.from({ length: LANE_COUNT }, (_, lane) => this.sequencer.getLaneLength(lane) || this.steps);
  }

  // --- Transport ---

  private togglePlayPause() {
    // SYNC on: the master transport owns start/stop (toolbar ghosted; Space
    // lands here too).
    if (this.transportSynced) return;
    this.audioContext.resume();
    this.sequencer.togglePlayPause();
  }

  private stop() {
    if (this.transportSynced) return;
    this.sequencer.stop();
  }

  // --- Patterns ---

  private selectPattern(index: number) {
    if (index < 0 || index >= PATTERN_COUNT) return;
    this.sequencer.selectPattern(index);
    this.syncPattern();
  }

  private selectBank(bank: number) {
    this.sequencer.bank = bank;
    this.bank = this.sequencer.bank;
  }

  private clearPattern() {
    this.sequencer.clearPattern();
    this.syncPattern();
  }

  private copyPattern() {
    this.clipboard = this.selectedPattern;
    this.requestUpdate();
  }

  private pastePattern() {
    if (this.clipboard === null || this.clipboard === this.selectedPattern) return;
    this.sequencer.copyPattern(this.clipboard, this.selectedPattern);
    this.syncPattern();
  }

  render() {
    return html`
      <div class="rudiment-layout">
        <row-element label="Transport">
          <rudiment-toolbar
            .bpm=${this.bpm}
            .synced=${this.transportSynced}
            .subdivision=${this.subdivision}
            .transport=${this.transport}
            .metronome=${this.metronome}
            .hasClipboard=${this.clipboard !== null}
            @change=${this.onToolbarChange}
          ></rudiment-toolbar>
        </row-element>
        <row-element label="Pattern">
          <div class="pattern-section">
            <div class="pattern-header">
              <div class="lcd-control">
                <label class="ctrl-label">STEPS</label>
                <div class="lcd-row">
                  <button class="inc-btn" @click=${() => this.setSteps(Math.max(1, this.steps - 1))}>-</button>
                  <lcd-element .text=${String(this.steps)}></lcd-element>
                  <button class="inc-btn" @click=${() => this.setSteps(Math.min(MAX_STEPS, this.steps + 1))}>+</button>
                </div>
              </div>
              <control-learn-wrapper .controlID=${ControlID.RUD_SWING}>
                <knob-element
                  .value=${this.swing}
                  .range=${{ min: 0, max: 100 }}
                  .step=${1}
                  .label=${"SWING"}
                  label-position="left"
                  @change=${(e: CustomEvent) => this.setSwing(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
              <control-learn-wrapper .controlID=${ControlID.RUD_GATE}>
                <knob-element
                  .value=${this.gate}
                  .range=${{ min: 5, max: 100 }}
                  .step=${1}
                  .label=${"GATE"}
                  label-position="left"
                  @change=${(e: CustomEvent) => this.setGate(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <drum-grid-panel
              .pattern=${this.pattern}
              .laneNames=${DEFAULT_LANES.map((l) => l.name)}
              .laneLengths=${this.laneLengths}
              .laneMutes=${this.laneMutes}
              .selectedLane=${this.selectedLane}
              .grid=${this.grid}
              .page=${0}
              .brush=${this.brush}
              @hit-change=${this.onHitChange}
              @lane-select=${(e: CustomEvent) => (this.selectedLane = e.detail.lane)}
              @lane-mute=${this.onLaneMute}
            ></drum-grid-panel>
          </div>
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

  private onHitChange(e: CustomEvent) {
    const { lane, step, velocity } = e.detail;
    this.sequencer.setHit(lane, step, velocity);
    const next = [...this.pattern];
    next[lane] = [...next[lane]];
    next[lane][step] = velocity;
    this.pattern = next;
  }

  private onLaneMute(e: CustomEvent) {
    const { lane, muted } = e.detail;
    this.sequencer.setLaneMute(lane, muted);
  }

  private setSteps(value: number) {
    this.sequencer.setPatternSteps(value);
  }

  private setSwing(value: number) {
    this.swing = value;
    this.sequencer.setSwing(value);
  }

  private setGate(value: number) {
    this.gate = value;
    this.sequencer.setGate(value);
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        --knob-size: var(--control-size-sm);
        --control-label-color: var(--light-secondary);
      }

      .rudiment-layout {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1em;
        box-sizing: border-box;
      }

      .pattern-section {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        background: var(--rudiment-grid-panel-color, var(--rudiment-panel-color));
        border-radius: 0.4rem;
        padding: 0.8em 1em;
      }

      .pattern-header {
        display: flex;
        align-items: center;
        gap: 0.8em;
      }

      .lcd-control {
        display: flex;
        align-items: center;
        gap: 0.4em;
        --lcd-screen-width: 3em;
      }

      .ctrl-label {
        font-size: var(--control-label-font-size);
        color: var(--light-secondary);
      }

      .lcd-row {
        display: flex;
        align-items: center;
        gap: 0.2em;
      }

      .inc-btn {
        width: 20px;
        height: 20px;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        color: var(--lighter);
        font-size: 0.8em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .inc-btn:hover {
        background: var(--medium);
      }
    `;
  }
}

function emptyPattern(): number[][] {
  return Array.from({ length: LANE_COUNT }, () => new Array(MAX_STEPS).fill(0));
}
