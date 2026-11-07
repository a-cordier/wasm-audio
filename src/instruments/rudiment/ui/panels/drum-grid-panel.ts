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
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { VELOCITY_LEVELS } from "../../types";

/** Steps on screen at once; longer patterns page through. */
export const PAGE_STEPS = 16;

/**
 * The lanes × steps canvas. Click paints a hit at the brush level; clicking a
 * hit already AT that level erases it; dragging along a lane carries the
 * first cell's action (paint or erase). Each lane draws its own playhead —
 * grid mod its own length — and ghosts the cells past that length.
 */
@customElement("drum-grid-panel")
export class DrumGridPanel extends LitElement {
  /** LANE_COUNT rows of MAX_STEPS velocities. */
  @property({ attribute: false })
  pattern: number[][] = [];

  @property({ attribute: false })
  laneNames: string[] = [];

  /** Effective cycle length per lane. */
  @property({ attribute: false })
  laneLengths: number[] = [];

  @property({ attribute: false })
  laneMutes: boolean[] = [];

  @property({ type: Number })
  selectedLane = 0;

  /** Steps since the pattern origin; −1 = stopped. */
  @property({ type: Number })
  grid = -1;

  @property({ type: Number })
  page = 0;

  /** Velocity the brush paints. */
  @property({ type: Number })
  brush: number = VELOCITY_LEVELS[1];

  private drag: { lane: number; velocity: number; lastStep: number } | null = null;

  private onPointerUp = () => {
    this.drag = null;
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }

  render() {
    const first = this.page * PAGE_STEPS;
    return html`
      <div class="grid" @pointermove=${this.onPointerMove}>
        ${this.pattern.map((row, lane) => this.renderLane(row, lane, first))}
      </div>
    `;
  }

  private renderLane(row: number[], lane: number, first: number) {
    const length = this.laneLengths[lane] || PAGE_STEPS;
    const muted = this.laneMutes[lane] === true;
    const head = this.grid >= 0 ? this.grid % length : -1;
    const cells = [];
    for (let i = 0; i < PAGE_STEPS; i++) {
      const step = first + i;
      const velocity = row[step] ?? 0;
      cells.push(html`
        <div
          data-lane=${lane}
          data-step=${step}
          class=${classMap({
            cell: true,
            alt: Math.floor(step / 4) % 2 === 1,
            ghost: step >= length,
            head: step === head,
            soft: velocity > 0 && velocity < VELOCITY_LEVELS[1],
            mid: velocity >= VELOCITY_LEVELS[1] && velocity < VELOCITY_LEVELS[2],
            acc: velocity >= VELOCITY_LEVELS[2],
          })}
          @pointerdown=${(e: PointerEvent) => this.onCellDown(e, lane, step, velocity)}
        ></div>
      `);
    }
    return html`
      <div class=${classMap({ lane: true, muted, selected: lane === this.selectedLane })}>
        <button
          class="lane-name"
          title="edit this lane"
          @click=${() => this.emit("lane-select", { lane })}
        >${this.laneNames[lane] ?? ""}</button>
        <button
          class=${classMap({ "mute-btn": true, active: muted })}
          title=${muted ? "unmute lane" : "mute lane"}
          @click=${() => this.emit("lane-mute", { lane, muted: !muted })}
        >M</button>
        ${cells}
      </div>
    `;
  }

  private onCellDown(e: PointerEvent, lane: number, step: number, velocity: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    const next = velocity === this.brush ? 0 : this.brush;
    this.drag = { lane, velocity: next, lastStep: step };
    this.setHit(lane, step, next);
  }

  /**
   * Drag-paint by hit-testing the pointer, not by cell pointerenter: touch
   * pointers are implicitly captured by the cell they went down on, so enter
   * events never reach the neighbours. Fast drags may skip cells between two
   * moves — the run is filled in between, along the dragged lane only.
   */
  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag || (e.buttons & 1) === 0) return;
    const hit = this.shadowRoot?.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!hit?.dataset.step || Number(hit.dataset.lane) !== this.drag.lane) return;
    const step = Number(hit.dataset.step);
    const from = this.drag.lastStep;
    const dir = step >= from ? 1 : -1;
    for (let i = from + dir; dir > 0 ? i <= step : i >= step; i += dir) {
      this.setHit(this.drag.lane, i, this.drag.velocity);
    }
    this.drag.lastStep = step;
  };

  private setHit(lane: number, step: number, velocity: number) {
    if ((this.pattern[lane]?.[step] ?? 0) === velocity) return;
    this.emit("hit-change", { lane, step, velocity });
  }

  private emit(type: string, detail: object) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  static styles = css`
    :host {
      display: block;
      --cell-height: var(--rudiment-cell-height, 16px);
      --cell-gap: 2px;
    }

    .grid {
      display: flex;
      flex-direction: column;
      gap: var(--cell-gap);
      touch-action: none;
      user-select: none;
    }

    .lane {
      display: grid;
      grid-template-columns:
        var(--rudiment-lane-label-width, 3.6em)
        var(--cell-height)
        repeat(16, minmax(0, 1fr));
      gap: var(--cell-gap);
      align-items: stretch;
      height: var(--cell-height);
    }

    .lane-name,
    .mute-btn {
      padding: 0;
      border: 1px solid transparent;
      border-radius: 2px;
      background: var(--dark-secondary);
      color: var(--light-secondary);
      font-size: 0.6em;
      letter-spacing: 0.04em;
      cursor: pointer;
      line-height: 1;
    }

    .lane-name {
      text-align: left;
      padding-left: 0.4em;
    }

    .lane.selected .lane-name {
      color: var(--rudiment-accent);
      border-color: var(--rudiment-accent);
    }

    .mute-btn.active {
      background: var(--rudiment-mute-color, var(--light-secondary));
      color: var(--darker);
    }

    .cell {
      border-radius: 2px;
      background: var(--rudiment-cell-color, var(--dark-secondary));
      cursor: pointer;
      position: relative;
    }

    .cell.alt {
      background: var(--rudiment-cell-alt-color, var(--medium));
    }

    .cell.soft {
      background: color-mix(in srgb, var(--rudiment-accent) 40%, var(--dark-secondary));
    }

    .cell.mid {
      background: color-mix(in srgb, var(--rudiment-accent) 72%, var(--dark-secondary));
    }

    .cell.acc {
      background: var(--rudiment-accent);
    }

    .cell.ghost {
      opacity: 0.25;
    }

    .cell.head {
      outline: 1px solid var(--lighter);
      outline-offset: -1px;
    }

    .lane.muted .cell {
      filter: grayscale(1);
      opacity: 0.5;
    }

    .lane.muted .cell.ghost {
      opacity: 0.15;
    }
  `;
}
