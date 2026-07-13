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
import { Direction, Subdivision, DEFAULT_CONFIG } from "../types";
import { ControlID } from "../../../control/types";
import { ToolbarEvent } from "./panels/sequencer-toolbar";
import { StepData } from "./panels/step-grid-panel";
import { SynthChangeEvent } from "../../../types/events";

import "./panels/sequencer-toolbar";
import "./panels/step-grid-panel";

@customElement("sequencer-element")
export class SequencerElement extends LitElement {
  @property({ attribute: false })
  sequencer!: SequencerController;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @state()
  private playing = false;

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
  private steps = DEFAULT_CONFIG.steps;

  @state()
  private selectedNote = 60;

  @state()
  private selectedVelocity = 100;

  @state()
  private pattern: StepData[] = Array.from({ length: 64 }, () => ({ note: 0, velocity: 0 }));

  connectedCallback() {
    super.connectedCallback();
    if (!this.sequencer) return;

    this.sequencer.addEventListener("position", ((e: CustomEvent) => {
      this.currentStep = e.detail.step;
    }) as EventListener);

    this.sequencer.addEventListener("transport", ((e: CustomEvent) => {
      this.playing = e.detail.state === 1;
    }) as EventListener);
  }

  render() {
    return html`
      <div class="sequencer-layout">
        <row-element>
          <sequencer-toolbar
            .bpm=${this.bpm}
            .subdivision=${this.subdivision}
            .playing=${this.playing}
            .direction=${this.direction}
            .loop=${this.loop}
            @change=${this.onToolbarChange}
          ></sequencer-toolbar>
        </row-element>
        <row-element>
          <div class="pattern-section">
          <div class="pattern-header">
            <div class="pattern-controls">
              <div class="lcd-control">
                <label class="ctrl-label">STEPS</label>
                <div class="lcd-row">
                  <button class="inc-btn" @click=${() => this.setSteps(Math.max(1, this.steps - 1))}>-</button>
                  <lcd-element .text=${String(this.steps)}></lcd-element>
                  <button class="inc-btn" @click=${() => this.setSteps(Math.min(64, this.steps + 1))}>+</button>
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
      case ToolbarEvent.PLAY:
        this.audioContext.resume();
        this.sequencer.start();
        this.playing = true;
        break;
      case ToolbarEvent.STOP:
        this.sequencer.stop();
        this.playing = false;
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
    }
  }

  private setSteps(value: number) {
    this.steps = value;
    this.sequencer.setSteps(this.steps);
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
