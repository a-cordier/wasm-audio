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
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { SynthPanel } from "../../common/synth-panel";

export const enum StepGridEvent {
  TOGGLE_STEP = "toggle-step",
  SET_NOTE = "set-note",
}

export interface StepData {
  note: number;
  velocity: number;
}

@customElement("step-grid-panel")
export class StepGridPanel extends SynthPanel {
  @property({ type: Number })
  steps = 16;

  @property({ type: Number })
  currentStep = -1;

  @property({ type: Array })
  pattern: StepData[] = [];

  @property({ type: Number })
  selectedNote = 60;

  @property({ type: Number })
  selectedVelocity = 100;

  render() {
    return html`
      <div class="grid-container">
        <div class="step-grid">
          ${Array.from({ length: this.steps }, (_, i) => this.renderStep(i))}
        </div>
        <div class="brush-bar">
          <div class="brush-group">
            <label class="brush-label">NOTE</label>
            <div class="note-controls">
              <button class="note-btn" @click=${() => this.adjustNote(-12)}>-12</button>
              <button class="note-btn" @click=${() => this.adjustNote(-1)}>-</button>
              <lcd-element .text=${this.noteName(this.selectedNote)}></lcd-element>
              <button class="note-btn" @click=${() => this.adjustNote(1)}>+</button>
              <button class="note-btn" @click=${() => this.adjustNote(12)}>+12</button>
            </div>
          </div>
          <div class="brush-group">
            <label class="brush-label">VEL</label>
            <div class="note-controls">
              <button class="note-btn" @click=${() => this.adjustVelocity(-10)}>-10</button>
              <button class="note-btn" @click=${() => this.adjustVelocity(-1)}>-</button>
              <lcd-element .text=${String(this.selectedVelocity)}></lcd-element>
              <button class="note-btn" @click=${() => this.adjustVelocity(1)}>+</button>
              <button class="note-btn" @click=${() => this.adjustVelocity(10)}>+10</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderStep(index: number) {
    const step = this.pattern[index] ?? { note: 0, velocity: 0 };
    const active = step.note > 0;
    const isPlayhead = index === this.currentStep;
    const isBeat = index % 4 === 0;

    return html`
      <button
        class=${classMap({
          step: true,
          active,
          playhead: isPlayhead,
          beat: isBeat,
        })}
        @click=${() => this.onStepClick(index)}
        title=${active ? this.noteName(step.note) : ""}
      >
        ${active ? html`<span class="step-note">${this.noteName(step.note)}</span>` : nothing}
      </button>
    `;
  }

  private onStepClick(index: number) {
    const step = this.pattern[index] ?? { note: 0, velocity: 0 };
    const active = step.note > 0;

    if (active && step.note === this.selectedNote) {
      this.dispatchEvent(
        new CustomEvent("step-toggle", {
          detail: { index, note: this.selectedNote, velocity: this.selectedVelocity, action: "off" },
          bubbles: true,
          composed: true,
        })
      );
    } else {
      this.dispatchEvent(
        new CustomEvent("step-toggle", {
          detail: { index, note: this.selectedNote, velocity: this.selectedVelocity, action: "on" },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private adjustNote(delta: number) {
    const newNote = Math.max(0, Math.min(127, this.selectedNote + delta));
    this.dispatchEvent(
      new CustomEvent("note-select", {
        detail: { note: newNote },
        bubbles: true,
        composed: true,
      })
    );
  }

  private adjustVelocity(delta: number) {
    const newVel = Math.max(1, Math.min(127, this.selectedVelocity + delta));
    this.dispatchEvent(
      new CustomEvent("velocity-select", {
        detail: { velocity: newVel },
        bubbles: true,
        composed: true,
      })
    );
  }

  private noteName(midi: number): string {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midi / 12) - 1;
    return `${names[midi % 12]}${octave}`;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        --control-label-color: var(--light-secondary);
        container-type: inline-size;
      }

      .grid-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        gap: 0.4em;
        padding: 0.25em;
      }

      .step-grid {
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        gap: 3px;
        width: 100%;
      }

      .step {
        aspect-ratio: 1;
        min-width: 20px;
        min-height: 20px;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        cursor: pointer;
        transition: background 0.1s, box-shadow 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .step.beat {
        border-color: var(--lighter);
      }

      .step.active {
        background: var(--lcd-led-on-color);
        border-color: var(--lcd-led-on-color);
      }

      .step.playhead {
        box-shadow: 0 0 6px 2px var(--lcd-led-on-color);
        border-color: var(--lighter);
      }

      .step.playhead:not(.active) {
        background: rgba(180, 212, 85, 0.3);
      }

      .step-note {
        font-size: 0.55em;
        font-weight: bold;
        color: var(--darker);
        pointer-events: none;
        line-height: 1;
        text-align: center;
        user-select: none;
      }

      .step:hover {
        opacity: 0.8;
      }

      .brush-bar {
        display: flex;
        align-items: center;
        gap: 1.5em;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }

      .brush-group {
        display: flex;
        align-items: center;
        gap: 0.4em;
      }

      .brush-label {
        color: var(--light-secondary);
        font-size: 0.7em;
        font-weight: bold;
        min-width: 2.5em;
      }

      .note-controls {
        display: flex;
        align-items: center;
        gap: 0.3em;
      }

      .note-btn {
        padding: 0.2em 0.5em;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        color: var(--lighter);
        font-size: 0.75em;
        cursor: pointer;
        transition: background var(--ui-transition-time);
      }

      .note-btn:hover {
        background: var(--medium);
      }

      @container (max-width: 320px) {
        .step-grid {
          grid-template-columns: repeat(8, 1fr);
        }
      }

      @container (max-width: 160px) {
        .step-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    `;
  }
}
