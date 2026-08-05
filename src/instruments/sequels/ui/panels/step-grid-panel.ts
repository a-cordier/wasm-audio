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
import { SynthPanel } from "../../../../components/common/synth-panel";

export const enum StepGridEvent {
  TOGGLE_STEP = "toggle-step",
  SET_NOTE = "set-note",
}

export interface StepData {
  note: number;
  velocity: number;
  slide: boolean;
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

  /** Step-record write position; -1 hides the cursor. */
  @property({ type: Number })
  editCursor = -1;

  /** When on, clicking a step paints its slide tie instead of toggling it. */
  @property({ type: Boolean })
  slideMode = false;

  render() {
    return html`
      <div class="grid-container">
        <div class=${classMap({ "step-grid": true, "slide-paint": this.slideMode })}>
          ${Array.from({ length: this.steps }, (_, i) => this.renderStep(i))}
        </div>
        <div class="brush-bar">
          <button
            class=${classMap({ "note-btn": true, "slide-btn": true, active: this.slideMode })}
            title="Slide brush: empty steps get a note that slides; existing steps toggle the tie (glides on a legato monolog)"
            @click=${this.toggleSlideMode}
          >
            SLIDE
          </button>
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
    const step = this.pattern[index] ?? { note: 0, velocity: 0, slide: false };
    const active = step.note > 0;
    const isPlayhead = index === this.currentStep;
    const isBeat = index % 4 === 0;
    const isCursor = index === this.editCursor;

    return html`
      <button
        class=${classMap({
          step: true,
          active,
          slide: active && step.slide,
          playhead: isPlayhead,
          cursor: isCursor,
          beat: isBeat,
        })}
        @click=${() => this.onStepClick(index)}
        title=${active ? `${this.noteName(step.note)}${step.slide ? " (slide)" : ""}` : ""}
      >
        ${active ? html`<span class="step-note">${this.noteName(step.note)}</span>` : nothing}
        ${active && step.slide ? html`<span class="slide-mark"></span>` : nothing}
      </button>
    `;
  }

  private toggleSlideMode() {
    this.dispatchEvent(
      new CustomEvent("slide-mode", {
        detail: { slideMode: !this.slideMode },
        bubbles: true,
        composed: true,
      })
    );
  }

  private onStepClick(index: number) {
    const step = this.pattern[index] ?? { note: 0, velocity: 0, slide: false };
    const active = step.note > 0;

    // Slide is a brush modifier, not a separate mode: on an empty step it lays
    // a note that already slides (paint a sliding note on the fly); on an
    // existing step it toggles the tie, leaving the pitch alone.
    if (this.slideMode) {
      if (active) {
        this.dispatchEvent(
          new CustomEvent("step-slide", {
            detail: { index, slide: !step.slide },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        this.dispatchEvent(
          new CustomEvent("step-toggle", {
            detail: { index, note: this.selectedNote, velocity: this.selectedVelocity, action: "on", slide: true },
            bubbles: true,
            composed: true,
          })
        );
      }
      return;
    }

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

      /* Always 16 columns so a step keeps the same size whatever the pattern
         length: a short pattern fills fewer cells, a long one wraps onto
         further rows of 16. */
      .step-grid {
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        gap: 3px;
        width: 100%;
      }

      .step {
        position: relative;
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

      /* Slide paint mode: hint that clicks tie steps rather than toggle them. */
      .step-grid.slide-paint .step {
        cursor: crosshair;
      }

      /* The tie shows as a folded corner in the bottom-right, its diagonal
         rising toward the next step. Neutral dark shade so it reads on the
         bright active pad without competing with the accent. */
      .slide-mark {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 10px;
        height: 10px;
        background: var(--darker);
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
        border-bottom-right-radius: 3px;
        pointer-events: none;
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

      /* Step-record write position — deliberately distinct from the playhead. */
      .step.cursor {
        border-color: var(--lighter);
        border-style: dashed;
        border-width: 2px;
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

      /* Slide paint toggle — reads as armed when active, like the brush it is. */
      .slide-btn {
        font-weight: bold;
        letter-spacing: 0.05em;
      }

      .slide-btn.active {
        background: var(--lcd-led-on-color);
        border-color: var(--lcd-led-on-color);
        color: var(--darker);
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
