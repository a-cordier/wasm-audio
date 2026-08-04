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

import { SequencerController } from "../sequencer-controller";
import { TransportKeys } from "./transport-keys";
import {
  BANK_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  MAX_STEPS,
  MAX_TRANSPOSE,
  PATTERN_COUNT,
  Subdivision,
  SwitchMode,
  TransportState,
} from "../types";
import { ControlID } from "../../../control/types";
import { ToolbarEvent } from "./panels/sequencer-toolbar";
import { PatternEvent } from "./panels/pattern-selector-panel";
import { StepData } from "./panels/step-grid-panel";
import { SynthChangeEvent } from "../../../types/events";
import type { Plugin } from "../../../core/types";

import "./panels/sequencer-toolbar";
import "./panels/pattern-selector-panel";
import "./panels/step-grid-panel";

@customElement("sequencer-element")
export class SequencerElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  private get sequencer(): SequencerController {
    return this.plugin as SequencerController;
  }

  @state()
  private transport: number = TransportState.STOPPED;

  @state()
  private recording = false;

  @state()
  private recordFlash = false;

  @state()
  private currentStep = -1;

  @state()
  private bpm = DEFAULT_CONFIG.bpm;

  @state()
  private swing = DEFAULT_CONFIG.swing;

  @state()
  private gate = DEFAULT_CONFIG.gate;

  @state()
  private subdivision: number = DEFAULT_CONFIG.subdivision;

  @state()
  private direction: number = DEFAULT_CONFIG.direction;

  @state()
  private loop = DEFAULT_CONFIG.loop;

  @state()
  private switchMode: number = DEFAULT_CONFIG.switchMode;

  @state()
  private steps = DEFAULT_PATTERN_STEPS;

  @state()
  private selectedNote = 60;

  @state()
  private selectedVelocity = 100;

  @state()
  private pattern: StepData[] = emptyPattern();

  @state()
  private selectedPattern = 0;

  @state()
  private bank = 0;

  @state()
  private filled: boolean[] = new Array(PATTERN_COUNT).fill(false);

  @state()
  private editCursor = -1;

  @state()
  private transpose = DEFAULT_CONFIG.transpose;

  @state()
  private pulses = 4;

  @state()
  private rotation = 0;

  @state()
  private metronome = DEFAULT_CONFIG.metronome;

  @state()
  private scale = 0;

  @state()
  private contour = 0;

  private clipboard: number | null = null;

  private readonly keys = new TransportKeys();
  private recordFlashTimer: ReturnType<typeof setTimeout> | null = null;

  private onPosition = (e: Event) => {
    this.currentStep = (e as CustomEvent).detail.step;
  };

  private onTransport = (e: Event) => {
    this.transport = (e as CustomEvent).detail.state;
    // Also covers transport changes we did not initiate — a preset load, or
    // the worklet self-stopping at the end of a non-looping sequence.
    this.syncCursor();
  };

  private onConfigChange = () => {
    this.syncConfig();
  };

  private onPatternChange = () => {
    this.syncPattern();
  };

  private onRecordState = (e: Event) => {
    this.recording = (e as CustomEvent).detail.recording;
    this.syncCursor();
  };

  private onCursor = () => {
    this.syncCursor();
  };

  private onRecorded = (e: Event) => {
    const { index, note, velocity } = (e as CustomEvent).detail;
    const next = [...this.pattern];
    next[index] = { note, velocity };
    this.pattern = next;
    // Mirror what was captured into the brush so the next manual step matches.
    this.selectedNote = note;
    this.selectedVelocity = velocity;
    this.refreshFilled();
    this.syncCursor();
    this.flashRecord();
  };

  /** Brief pulse on the REC button — confirms a note actually landed. */
  private flashRecord() {
    this.recordFlash = true;
    if (this.recordFlashTimer !== null) clearTimeout(this.recordFlashTimer);
    this.recordFlashTimer = setTimeout(() => {
      this.recordFlash = false;
      this.recordFlashTimer = null;
    }, 120);
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;

    this.sequencer.addEventListener("position", this.onPosition);
    this.sequencer.addEventListener("transport", this.onTransport);
    this.sequencer.addEventListener("config-change", this.onConfigChange);
    this.sequencer.addEventListener("pattern-change", this.onPatternChange);
    this.sequencer.addEventListener("record-state", this.onRecordState);
    this.sequencer.addEventListener("recorded", this.onRecorded);
    this.sequencer.addEventListener("cursor", this.onCursor);

    this.syncConfig();
    this.syncPattern();

    this.keys.attach({
      togglePlayPause: () => this.togglePlayPause(),
      stop: () => this.stop(),
      selectSlot: (slot) => this.selectPattern(this.bank * BANK_SIZE + slot),
      selectBank: (bank) => this.selectBank(bank),
      toggleRecord: () => this.setRecording(!this.recording),
      clearPattern: () => this.clearPattern(),
      moveCursor: (delta) => this.moveCursor(delta),
      copyPattern: () => this.copyPattern(),
      pastePattern: () => this.pastePattern(),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.keys.detach();
    if (this.recordFlashTimer !== null) clearTimeout(this.recordFlashTimer);

    if (!this.plugin) return;
    this.sequencer.removeEventListener("position", this.onPosition);
    this.sequencer.removeEventListener("transport", this.onTransport);
    this.sequencer.removeEventListener("config-change", this.onConfigChange);
    this.sequencer.removeEventListener("pattern-change", this.onPatternChange);
    this.sequencer.removeEventListener("record-state", this.onRecordState);
    this.sequencer.removeEventListener("recorded", this.onRecorded);
    this.sequencer.removeEventListener("cursor", this.onCursor);
  }

  // --- Sync from controller ---

  private syncConfig() {
    const config = this.sequencer.getState().config;
    this.bpm = config.bpm;
    this.swing = config.swing;
    this.gate = config.gate;
    this.subdivision = config.subdivision;
    this.direction = config.direction;
    this.loop = config.loop;
    this.switchMode = config.switchMode;
    this.transpose = config.transpose;
    this.metronome = config.metronome;
    this.scale = this.sequencer.scale;
    this.contour = this.sequencer.contour;
    this.transport = this.sequencer.transportState;
  }

  /** Rebuilds the grid mirror from the shared buffer. */
  private syncPattern() {
    this.selectedPattern = this.sequencer.selectedPattern;
    this.bank = this.sequencer.bank;
    this.steps = this.sequencer.getPatternSteps();
    this.pattern = this.sequencer.readPattern();
    this.refreshFilled();
    this.pulses = Math.min(this.pulses, this.steps);
    this.recording = this.sequencer.recording;
    this.syncCursor();
  }

  private refreshFilled() {
    const filled = new Array(PATTERN_COUNT);
    for (let i = 0; i < PATTERN_COUNT; i++) {
      filled[i] = this.sequencer.patternHasContent(i);
    }
    this.filled = filled;
  }

  private syncCursor() {
    this.editCursor = this.recording && !this.sequencer.isPlaying ? this.sequencer.editCursor : -1;
  }

  // --- Transport ---

  private togglePlayPause() {
    this.audioContext.resume();
    this.sequencer.togglePlayPause();
    this.syncCursor();
  }

  private stop() {
    this.sequencer.stop();
    this.syncCursor();
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

  private moveCursor(delta: number) {
    if (!this.recording || this.sequencer.isPlaying) return;
    this.sequencer.moveCursor(delta);
  }

  // --- Record ---

  private setRecording(on: boolean) {
    // device-slot owns the subscription now, filtered by the slot's IN channel
    // and DEVICE selectors — arming is just a flag on the controller.
    this.sequencer.recording = on;
  }

  render() {
    return html`
      <div class="sequencer-layout">
        <row-element label="Transport">
          <sequencer-toolbar
            .bpm=${this.bpm}
            .subdivision=${this.subdivision}
            .transport=${this.transport}
            .recording=${this.recording}
            .recordFlash=${this.recordFlash}
            .direction=${this.direction}
            .loop=${this.loop}
            .transpose=${this.transpose}
            .metronome=${this.metronome}
            .hasClipboard=${this.clipboard !== null}
            @change=${this.onToolbarChange}
          ></sequencer-toolbar>
        </row-element>
        <row-element label="Patterns">
          <pattern-selector-panel
            .bank=${this.bank}
            .selectedPattern=${this.selectedPattern}
            .switchMode=${this.switchMode}
            .filled=${this.filled}
            .pulses=${this.pulses}
            .steps=${this.steps}
            .scale=${this.scale}
            .contour=${this.contour}
            .rotation=${this.rotation}
            @change=${this.onPatternSelectorChange}
          ></pattern-selector-panel>
        </row-element>
        <row-element label="Pattern">
          <div class="pattern-section">
          <div class="pattern-header">
            <div class="pattern-controls">
              <div class="lcd-control">
                <label class="ctrl-label">STEPS</label>
                <div class="lcd-row">
                  <button class="inc-btn" @click=${() => this.setSteps(Math.max(1, this.steps - 1))}>-</button>
                  <lcd-element .text=${String(this.steps)}></lcd-element>
                  <button class="inc-btn" @click=${() => this.setSteps(Math.min(MAX_STEPS, this.steps + 1))}>+</button>
                </div>
              </div>
              <control-learn-wrapper .controlID=${ControlID.SEQ_SWING}>
                <knob-element
                  .value=${this.swing}
                  .range=${{ min: 0, max: 100 }}
                  .step=${1}
                  .label=${"SWING"}
                  label-position="left"
                  @change=${(e: CustomEvent) => this.setSwing(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
              <control-learn-wrapper .controlID=${ControlID.SEQ_GATE}>
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
          </div>
          <step-grid-panel
            .steps=${this.steps}
            .currentStep=${this.currentStep}
            .pattern=${this.pattern}
            .selectedNote=${this.selectedNote}
            .selectedVelocity=${this.selectedVelocity}
            .editCursor=${this.editCursor}
            @step-toggle=${this.onStepToggle}
            @note-select=${this.onNoteSelect}
            @velocity-select=${this.onVelocitySelect}
          ></step-grid-panel>
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
      case ToolbarEvent.RECORD:
        this.setRecording((value as number) === 1);
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
      case ToolbarEvent.TRANSPOSE:
        this.transpose = Math.max(-MAX_TRANSPOSE, Math.min(MAX_TRANSPOSE, value as number));
        this.sequencer.setTranspose(this.transpose);
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
      case PatternEvent.PULSES:
        this.pulses = Math.max(0, Math.min(this.steps, value as number));
        break;
      case PatternEvent.GENERATE:
        this.sequencer.generateEuclidean(this.pulses, this.selectedNote, this.selectedVelocity, this.rotation);
        this.syncPattern();
        break;
      case PatternEvent.SCALE:
        this.sequencer.scale = value as number;
        this.scale = this.sequencer.scale;
        break;
      case PatternEvent.CONTOUR:
        this.sequencer.contour = value as number;
        this.contour = this.sequencer.contour;
        break;
      case PatternEvent.ROTATION:
        this.rotation = value as number;
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
    const { index, note, velocity, action } = e.detail;
    const newPattern = [...this.pattern];
    if (action === "off") {
      this.sequencer.clearStep(index);
      newPattern[index] = { note: 0, velocity: 0 };
    } else {
      this.sequencer.setStep(index, note, velocity);
      newPattern[index] = { note, velocity };
    }
    this.pattern = newPattern;
    this.refreshFilled();
  }

  private onNoteSelect(e: CustomEvent) {
    this.selectedNote = e.detail.note;
  }

  private onVelocitySelect(e: CustomEvent) {
    this.selectedVelocity = e.detail.velocity;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        --knob-size: var(--control-size-sm);
        --control-label-color: var(--light-secondary);
      }

      .sequencer-layout {
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
        background: var(--sequencer-panel-color);
        border-radius: 0.4rem;
        padding: 0.8em 1em;
      }

      .pattern-header {
        display: flex;
        align-items: center;
        gap: 0.8em;
      }

      .pattern-controls {
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

function emptyPattern(): StepData[] {
  return Array.from({ length: MAX_STEPS }, () => ({ note: 0, velocity: 0 }));
}
