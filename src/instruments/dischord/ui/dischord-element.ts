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
import { TransportKeys } from "./transport-keys";
import {
  BANK_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  EmitOrder,
  MAX_STEPS,
  PATTERN_COUNT,
  Quality,
  Subdivision,
  SwitchMode,
  TransportState,
  Voicing,
} from "../types";
import { SCALE_NAMES } from "../chords";
import { ChordStepData } from "../pattern-buffer";
import { ControlID } from "../../../control/types";
import { ToolbarEvent } from "./panels/dischord-toolbar";
import { PatternEvent } from "./panels/chord-selector-panel";
import { HarmonyEvent } from "./panels/harmony-panel";
import { ChordBrush } from "./panels/chord-grid-panel";
import { SynthChangeEvent } from "../../../types/events";
import type { Plugin } from "../../../core/types";

import "./panels/dischord-toolbar";
import "./panels/chord-selector-panel";
import "./panels/harmony-panel";
import "./panels/chord-grid-panel";

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
  private currentStep = -1;

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
  private swing = DEFAULT_CONFIG.swing;

  @state()
  private gate = DEFAULT_CONFIG.gate;

  @state()
  private switchMode: number = DEFAULT_CONFIG.switchMode;

  @state()
  private keyRoot = DEFAULT_CONFIG.key;

  @state()
  private scale = DEFAULT_CONFIG.scale;

  @state()
  private voices = DEFAULT_CONFIG.voices;

  @state()
  private voicing: number = DEFAULT_CONFIG.voicing;

  @state()
  private order: number = DEFAULT_CONFIG.order;

  @state()
  private strum = DEFAULT_CONFIG.strum;

  @state()
  private steps = DEFAULT_PATTERN_STEPS;

  @state()
  private pattern: ChordStepData[] = emptyPattern();

  @state()
  private selectedPattern = 0;

  @state()
  private bank = 0;

  @state()
  private filled: boolean[] = new Array(PATTERN_COUNT).fill(false);

  /** The paint brush for the step grid. */
  @state()
  private brush: ChordBrush = { degree: 1, octave: 0, velocity: 100, quality: Quality.DIATONIC };

  /** Tie-paint arm state for the step grid. */
  @state()
  private tieMode = false;

  private clipboard: number | null = null;

  private readonly keys = new TransportKeys();

  private onPosition = (e: Event) => {
    this.currentStep = (e as CustomEvent).detail.step;
  };

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

  // --- Sync from controller ---

  private syncConfig() {
    const config = this.sequencer.getState().config;
    this.bpm = config.bpm;
    this.subdivision = config.subdivision;
    this.direction = config.direction;
    this.loop = config.loop;
    this.metronome = config.metronome;
    this.swing = config.swing;
    this.gate = config.gate;
    this.switchMode = config.switchMode;
    this.keyRoot = config.key;
    this.scale = config.scale;
    this.voices = config.voices;
    this.voicing = config.voicing;
    this.order = config.order;
    this.strum = config.strum;
    this.transport = this.sequencer.transportState;
  }

  /** Rebuilds the grid mirror from the shared buffer. */
  private syncPattern() {
    this.selectedPattern = this.sequencer.selectedPattern;
    this.bank = this.sequencer.bank;
    this.steps = this.sequencer.getPatternSteps();
    this.pattern = this.sequencer.readPattern();
    this.refreshFilled();
  }

  private refreshFilled() {
    const filled = new Array(PATTERN_COUNT);
    for (let i = 0; i < PATTERN_COUNT; i++) {
      filled[i] = this.sequencer.patternHasContent(i);
    }
    this.filled = filled;
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

  private selectPattern(index: number) {
    if (index < 0 || index >= PATTERN_COUNT) return;
    this.sequencer.selectPattern(index);
    this.syncPattern();
  }

  private selectBank(bank: number) {
    // The bank is a view: it changes which ten slots are on screen, and the
    // next digit press is what actually changes the playing pattern.
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
        <row-element label="Harmony">
          <harmony-panel
            .keyRoot=${this.keyRoot}
            .scale=${this.scale}
            .voices=${this.voices}
            .voicing=${this.voicing}
            .order=${this.order}
            .strum=${this.strum}
            @change=${this.onHarmonyChange}
          ></harmony-panel>
        </row-element>
        <row-element label="Patterns">
          <chord-selector-panel
            .bank=${this.bank}
            .selectedPattern=${this.selectedPattern}
            .switchMode=${this.switchMode}
            .filled=${this.filled}
            @change=${this.onPatternSelectorChange}
          ></chord-selector-panel>
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
              <control-learn-wrapper .controlID=${ControlID.DIS_SWING}>
                <knob-element
                  .value=${this.swing}
                  .range=${{ min: 0, max: 100 }}
                  .step=${1}
                  .label=${"SWING"}
                  label-position="left"
                  @change=${(e: CustomEvent) => this.setSwing(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
              <control-learn-wrapper .controlID=${ControlID.DIS_GATE}>
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
            <chord-grid-panel
              .steps=${this.steps}
              .currentStep=${this.currentStep}
              .pattern=${this.pattern}
              .brush=${this.brush}
              .tieMode=${this.tieMode}
              .keyRoot=${this.keyRoot}
              .scale=${this.scale}
              .voices=${this.voices}
              @step-toggle=${this.onStepToggle}
              @step-tie=${this.onStepTie}
              @tie-mode=${this.onTieMode}
              @brush-change=${this.onBrushChange}
            ></chord-grid-panel>
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

  private onHarmonyChange(e: SynthChangeEvent<HarmonyEvent>) {
    const { type, value } = e.detail;
    switch (type) {
      case HarmonyEvent.KEY:
        // Steppers wrap: stepping below C lands on B and vice versa.
        this.keyRoot = wrap(value as number, 12);
        this.sequencer.setKey(this.keyRoot);
        break;
      case HarmonyEvent.SCALE:
        this.scale = wrap(value as number, SCALE_NAMES.length);
        this.sequencer.setScale(this.scale);
        break;
      case HarmonyEvent.VOICES:
        this.voices = Math.max(3, Math.min(5, value as number));
        this.sequencer.setVoices(this.voices);
        break;
      case HarmonyEvent.VOICING:
        this.voicing = value as number;
        this.sequencer.setVoicing(this.voicing as Voicing);
        break;
      case HarmonyEvent.ORDER:
        this.order = value as number;
        this.sequencer.setOrder(this.order as EmitOrder);
        break;
      case HarmonyEvent.STRUM:
        this.strum = value as number;
        this.sequencer.setStrum(this.strum);
        break;
    }
  }

  private onPatternSelectorChange(e: SynthChangeEvent<PatternEvent>) {
    const { type, value } = e.detail;
    switch (type) {
      case PatternEvent.SELECT_SLOT:
        this.selectPattern(this.bank * BANK_SIZE + (value as number));
        break;
      case PatternEvent.SELECT_BANK:
        this.selectBank(value as number);
        break;
      case PatternEvent.SWITCH_MODE:
        this.switchMode = value as number;
        this.sequencer.setSwitchMode(this.switchMode as SwitchMode);
        break;
    }
  }

  private setSteps(value: number) {
    this.steps = value;
    this.sequencer.setPatternSteps(value);
  }

  private setSwing(value: number) {
    this.swing = value;
    this.sequencer.setSwing(this.swing);
  }

  private setGate(value: number) {
    this.gate = value;
    this.sequencer.setGate(this.gate);
  }

  private onStepToggle(e: CustomEvent) {
    const { index, degree, octave, velocity, quality, action, tie } = e.detail;
    const withTie = tie === true;
    const newPattern = [...this.pattern];
    if (action === "off") {
      this.sequencer.clearStep(index);
      newPattern[index] = { degree: 0, octave: 0, velocity: 0, tie: false, quality: Quality.DIATONIC };
    } else {
      this.sequencer.setStep(index, degree, octave, velocity, withTie, quality);
      newPattern[index] = { degree, octave, velocity, tie: withTie, quality };
    }
    this.pattern = newPattern;
    this.refreshFilled();
  }

  private onStepTie(e: CustomEvent) {
    const { index, tie } = e.detail;
    this.sequencer.setTie(index, tie);
    const newPattern = [...this.pattern];
    const step = newPattern[index];
    if (step) newPattern[index] = { ...step, tie };
    this.pattern = newPattern;
  }

  private onTieMode(e: CustomEvent) {
    this.tieMode = e.detail.tieMode === true;
  }

  private onBrushChange(e: CustomEvent) {
    this.brush = { ...(e.detail as ChordBrush) };
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

      .pattern-section {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        background: var(--dischord-steps-panel-color, var(--dischord-panel-color));
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

function emptyPattern(): ChordStepData[] {
  return Array.from({ length: MAX_STEPS }, () => ({
    degree: 0,
    octave: 0,
    velocity: 0,
    tie: false,
    quality: Quality.DIATONIC,
  }));
}

function wrap(v: number, n: number): number {
  return ((v % n) + n) % n;
}
