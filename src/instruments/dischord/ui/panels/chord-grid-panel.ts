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
import { ChordStepData } from "../../pattern-buffer";
import { chordLabel, QUALITY_NAMES, QUALITY_TAGS } from "../../chords";
import { Quality } from "../../types";

export interface ChordBrush {
  degree: number;
  octave: number;
  velocity: number;
  quality: Quality;
}

/**
 * The chord step canvas. A cell shows its scale degree (the device's whole
 * vocabulary: a step IS a degree), with the quality tag beside it when the
 * step escapes the diatonic default, a small octave mark when shifted, and
 * the folded-corner tie mark shared with sequels' slide.
 */
@customElement("chord-grid-panel")
export class ChordGridPanel extends SynthPanel {
  @property({ type: Number })
  steps = 16;

  @property({ type: Number })
  currentStep = -1;

  @property({ type: Array })
  pattern: ChordStepData[] = [];

  /** The paint brush: what a click lays down on an empty step. */
  @property({ attribute: false })
  brush: ChordBrush = { degree: 1, octave: 0, velocity: 100, quality: Quality.DIATONIC };

  /** When on, clicking a step paints/toggles its tie instead of the chord. */
  @property({ type: Boolean })
  tieMode = false;

  /** Harmony context, only for the hover tooltip's chord name. */
  @property({ type: Number })
  keyRoot = 0;

  @property({ type: Number })
  scale = 0;

  @property({ type: Number })
  voices = 3;

  render() {
    return html`
      <div class="grid-container">
        <div class=${classMap({ "step-grid": true, "tie-paint": this.tieMode })}>
          ${Array.from({ length: this.steps }, (_, i) => this.renderStep(i))}
        </div>
        <div class="brush-bar">
          <button
            class=${classMap({ "note-btn": true, "tie-btn": true, active: this.tieMode })}
            title="Tie brush: empty steps get a chord that holds into the next step; existing steps toggle the tie (common tones sustain)"
            @click=${this.toggleTieMode}
          >
            TIE
          </button>
          ${this.brushStepper("DEG", String(this.brush.degree), (d) => this.adjustBrush({ degree: wrap(this.brush.degree - 1 + d, 7) + 1 }))}
          ${this.brushStepper("OCT", octaveLabel(this.brush.octave), (d) => this.adjustBrush({ octave: clamp(this.brush.octave + d, -2, 2) }))}
          ${this.brushStepper("QUAL", QUALITY_NAMES[this.brush.quality], (d) => this.adjustBrush({ quality: wrap(this.brush.quality + d, QUALITY_NAMES.length) as Quality }))}
          <div class="brush-group">
            <label class="brush-label">VEL</label>
            <div class="note-controls">
              <button class="note-btn" @click=${() => this.adjustBrush({ velocity: clamp(this.brush.velocity - 10, 1, 127) })}>-10</button>
              <button class="note-btn" @click=${() => this.adjustBrush({ velocity: clamp(this.brush.velocity - 1, 1, 127) })}>-</button>
              <lcd-element .text=${String(this.brush.velocity)}></lcd-element>
              <button class="note-btn" @click=${() => this.adjustBrush({ velocity: clamp(this.brush.velocity + 1, 1, 127) })}>+</button>
              <button class="note-btn" @click=${() => this.adjustBrush({ velocity: clamp(this.brush.velocity + 10, 1, 127) })}>+10</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private brushStepper(label: string, value: string, adjust: (delta: number) => void) {
    return html`
      <div class="brush-group">
        <label class="brush-label">${label}</label>
        <div class="note-controls">
          <button class="note-btn" @click=${() => adjust(-1)}>-</button>
          <lcd-element .text=${value}></lcd-element>
          <button class="note-btn" @click=${() => adjust(1)}>+</button>
        </div>
      </div>
    `;
  }

  private renderStep(index: number) {
    const step = this.pattern[index] ?? { degree: 0, octave: 0, velocity: 0, tie: false, quality: 0 };
    const active = step.degree > 0;
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
        title=${active
          ? `${chordLabel(step.degree, step.octave, step.quality, this.keyRoot, this.scale, this.voices)}${step.tie ? " (tie)" : ""}`
          : ""}
      >
        ${active && step.octave !== 0 ? html`<span class="oct-mark">${octaveLabel(step.octave)}</span>` : nothing}
        ${active
          ? html`<span class="step-degree">${step.degree}<span class="qual-tag">${QUALITY_TAGS[step.quality] ?? ""}</span></span>`
          : nothing}
        ${active && step.tie ? html`<span class="tie-mark"></span>` : nothing}
      </button>
    `;
  }

  private toggleTieMode() {
    this.dispatchEvent(
      new CustomEvent("tie-mode", {
        detail: { tieMode: !this.tieMode },
        bubbles: true,
        composed: true,
      })
    );
  }

  private onStepClick(index: number) {
    const step = this.pattern[index] ?? { degree: 0, octave: 0, velocity: 0, tie: false, quality: 0 };
    const active = step.degree > 0;
    const b = this.brush;

    // Tie is a brush modifier, not a separate mode: on an empty step it lays
    // the brush chord already tied (paint a held chord on the fly); on an
    // existing step it toggles the tie, leaving the chord alone.
    if (this.tieMode) {
      if (active) {
        this.dispatchEvent(
          new CustomEvent("step-tie", {
            detail: { index, tie: !step.tie },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        this.dispatchEvent(
          new CustomEvent("step-toggle", {
            detail: { index, ...b, action: "on", tie: true },
            bubbles: true,
            composed: true,
          })
        );
      }
      return;
    }

    const sameAsBrush =
      active && step.degree === b.degree && step.octave === b.octave && step.quality === b.quality;

    this.dispatchEvent(
      new CustomEvent("step-toggle", {
        detail: { index, ...b, action: sameAsBrush ? "off" : "on" },
        bubbles: true,
        composed: true,
      })
    );
  }

  private adjustBrush(patch: Partial<ChordBrush>) {
    this.dispatchEvent(
      new CustomEvent("brush-change", {
        detail: { ...this.brush, ...patch },
        bubbles: true,
        composed: true,
      })
    );
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

      /* Tie paint mode: hint that clicks tie steps rather than toggle them. */
      .step-grid.tie-paint .step {
        cursor: crosshair;
      }

      /* The tie shows as a folded corner in the bottom-right, its diagonal
         rising toward the next step — the same mark as sequels' slide. */
      .tie-mark {
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
        background: var(--dischord-accent);
        border-color: var(--dischord-accent);
      }

      .step.playhead {
        box-shadow: 0 0 6px 2px var(--dischord-accent);
        border-color: var(--lighter);
      }

      .step.playhead:not(.active) {
        background: color-mix(in srgb, var(--dischord-accent) 30%, transparent);
      }

      .step-degree {
        font-size: 0.7em;
        font-weight: bold;
        color: var(--darker);
        pointer-events: none;
        line-height: 1;
        text-align: center;
        user-select: none;
      }

      .qual-tag {
        font-size: 0.7em;
        font-weight: bold;
        vertical-align: super;
      }

      .oct-mark {
        position: absolute;
        top: 1px;
        left: 2px;
        font-size: 0.45em;
        font-weight: bold;
        color: var(--darker);
        pointer-events: none;
        user-select: none;
      }

      .step:hover {
        opacity: 0.8;
      }

      .brush-bar {
        display: flex;
        align-items: center;
        gap: 1.2em;
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
        min-width: 2em;
      }

      .note-controls {
        display: flex;
        align-items: center;
        gap: 0.3em;
        --lcd-screen-width: 3.2em;
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

      /* Tie paint toggle — reads as armed when active, like the brush it is. */
      .tie-btn {
        font-weight: bold;
        letter-spacing: 0.05em;
      }

      .tie-btn.active {
        background: var(--dischord-accent);
        border-color: var(--dischord-accent);
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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function wrap(v: number, n: number): number {
  return ((v % n) + n) % n;
}

function octaveLabel(octave: number): string {
  return octave > 0 ? `+${octave}` : String(octave);
}
