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

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { Plugin } from "../../../core/types";
import { getParamDirectory } from "../../../control/param-directory";
import { SongController, SceneTargetEntry } from "../song-controller";
import { SongScene, SCENE_COUNT, CELL_MUTE } from "../types/song-state";
import { SongEvent } from "../types/song-event";

import "../../../components/common/lcd/lcd-element";
import type { LCD } from "../../../components/common/lcd/lcd-element";

const BANK_NAMES = ["A", "B", "C", "D"];
/** Cell editing walks one ordered domain: — , M, A0..D9 (ordinal -2..39). */
const ORD_CLEAR = -2;
/** Vertical pixels per cell increment (the knob-drag feel, grid-coarse). */
const DRAG_PX = 5;

/**
 * The SONG panel: a groovebox song row. SCENES is the grid — launch pads
 * down the left (quantized to the bar while the master runs, instant recall
 * otherwise), one LCD cell per mounted sequencer reading its pattern (A0..D9
 * in sequels' own bank language), M (mute) or — (leave it alone); drag a
 * cell vertically or wheel it to step the domain. The playing pad lights in
 * the accent, a queued pad blinks until its bar. CHAIN (batch 3) plays
 * scenes in order.
 */
@customElement("song-element")
export class SongElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @property({ attribute: false })
  transportSynced = false;

  @state() private scenes: SongScene[] | null = null;
  @state() private selectedScene = 0;
  @state() private targets: SceneTargetEntry[] = [];

  // rAF readout (POS LCD + pad playing/queued lights) — mixer-meter idiom:
  // value-quantized writes outside Lit's render loop; rAF parks while the
  // tab is hidden, and disconnect cancels it.
  private rafId = 0;
  private lastBarShown = "";
  private lastPlaying = -2;
  private lastQueued: number | null = -2 as number | null;

  /** The in-flight cell drag; one composed change per gesture. */
  private drag: { scene: number; slotId: string; startY: number; startOrd: number; edited: boolean } | null = null;

  private get controller(): SongController {
    return this.plugin as SongController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onScenes = (e: Event) => { this.scenes = (e as CustomEvent).detail; };
  private onSelection = (e: Event) => { this.selectedScene = (e as CustomEvent).detail.selectedScene; };
  private onDirectory = () => { this.targets = this.controller.sceneTargets(); };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    this.scenes = this.controller.getScenes();
    this.selectedScene = this.controller.getSelection().selectedScene;
    this.targets = this.controller.sceneTargets();
    this.controller.addEventListener(SongEvent.SCENES, this.onScenes);
    this.controller.addEventListener(SongEvent.SELECTION, this.onSelection);
    getParamDirectory().addEventListener("directory-change", this.onDirectory);
    this.rafId = requestAnimationFrame(this.tickReadout);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rafId);
    getParamDirectory().removeEventListener("directory-change", this.onDirectory);
    if (!this.plugin) return;
    this.controller.removeEventListener(SongEvent.SCENES, this.onScenes);
    this.controller.removeEventListener(SongEvent.SELECTION, this.onSelection);
  }

  // Composed so the shell hears it and snapshots the session.
  private notifyChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  // A render rebuilds pads and the LCD, wiping direct writes — forget the
  // quantization so the next frame repaints them.
  protected updated() {
    this.lastBarShown = "";
    this.lastPlaying = -2;
    this.lastQueued = -2;
  }

  private tickReadout = () => {
    this.rafId = requestAnimationFrame(this.tickReadout);
    if (!this.plugin) return;
    const p = this.controller.getPosition();
    const barText = p.running && p.bar >= 0 ? `BAR ${p.bar + 1}` : "—";
    if (barText !== this.lastBarShown) {
      this.lastBarShown = barText;
      const lcd = this.shadowRoot?.querySelector<LCD>(".pos-lcd lcd-element");
      if (lcd) lcd.text = barText;
    }
    if (p.playingScene !== this.lastPlaying || p.queuedScene !== this.lastQueued) {
      this.lastPlaying = p.playingScene;
      this.lastQueued = p.queuedScene;
      this.shadowRoot?.querySelectorAll(".pad").forEach((pad, i) => {
        pad.classList.toggle("playing", i === p.playingScene);
        pad.classList.toggle("queued", i === p.queuedScene);
      });
    }
  };

  // --- Cell editing: one ordered domain, drag or wheel ---

  private cellOrd(scene: number, slotId: string): number {
    const v = this.scenes?.[scene]?.cells[slotId];
    return v === undefined ? ORD_CLEAR : v;
  }

  private static cellText(ord: number): string {
    if (ord === ORD_CLEAR) return "—";
    if (ord === CELL_MUTE) return "M";
    return `${BANK_NAMES[Math.floor(ord / 10)]}${ord % 10}`;
  }

  private setCellOrd(scene: number, slotId: string, ord: number) {
    const clamped = Math.max(ORD_CLEAR, Math.min(39, ord));
    if (clamped === this.cellOrd(scene, slotId)) return false;
    this.controller.setCell(scene, slotId, clamped === ORD_CLEAR ? null : clamped);
    return true;
  }

  private onCellDown(e: PointerEvent, scene: number, slotId: string) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.drag = { scene, slotId, startY: e.clientY, startOrd: this.cellOrd(scene, slotId), edited: false };
  }

  private onCellMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    const ord = d.startOrd + Math.round((d.startY - e.clientY) / DRAG_PX);
    if (this.setCellOrd(d.scene, d.slotId, ord)) d.edited = true;
  }

  private onCellUp(e: PointerEvent) {
    if (!this.drag) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (this.drag.edited) this.notifyChanged();
    this.drag = null;
  }

  private onCellWheel(e: WheelEvent, scene: number, slotId: string) {
    e.preventDefault();
    if (this.setCellOrd(scene, slotId, this.cellOrd(scene, slotId) + (e.deltaY < 0 ? 1 : -1))) {
      this.notifyChanged();
    }
  }

  private onPad(scene: number) {
    this.controller.launchScene(scene);
    this.notifyChanged();
  }

  render() {
    if (!this.scenes) return html``;
    const targets = this.targets;
    const hasTargets = targets.length > 0;
    return html`
      <div class="module">
        <div class="zone scenes-zone">
          <label class="zone-label">SCENES</label>
          <div class="grid" style="--cols: ${Math.max(1, targets.length)}">
            <span class="corner"></span>
            ${targets.map(
              (t) => html`<span class="col-label" title=${t.name}>${t.name.length > 7 ? `${t.name.slice(0, 6)}…` : t.name}</span>`
            )}
            ${this.scenes.map((_, scene) => this.renderRow(scene, targets, hasTargets))}
          </div>
          <div class="pos-lcd" title="Master bar — runs while SYNC is on and the master plays">
            <label class="stepper-label">POS</label>
            <lcd-element .text=${"—"}></lcd-element>
          </div>
        </div>
      </div>
    `;
  }

  private renderRow(scene: number, targets: SceneTargetEntry[], hasTargets: boolean) {
    const selected = scene === this.selectedScene;
    return html`
      <button
        class=${classMap({ pad: true, selected })}
        ?disabled=${!hasTargets}
        title=${hasTargets
          ? this.transportSynced
            ? "Launch — on the next bar while the master runs"
            : "Launch — applies immediately (SYNC to quantize to the bar)"
          : "Mount a sequencer"}
        @click=${() => this.onPad(scene)}
      >${scene + 1}</button>
      ${targets.map((t) => this.renderCell(scene, t))}
    `;
  }

  private renderCell(scene: number, target: SceneTargetEntry) {
    const ord = this.cellOrd(scene, target.slotId);
    const hasNotes = ord >= 0 && target.plugin.patternHasContent(ord);
    return html`
      <div
        class=${classMap({ cell: true, empty: ord === ORD_CLEAR, mute: ord === CELL_MUTE })}
        title="Drag or wheel: — (no change), M (mute), A0–D9 (pattern)"
        @pointerdown=${(e: PointerEvent) => this.onCellDown(e, scene, target.slotId)}
        @pointermove=${this.onCellMove}
        @pointerup=${this.onCellUp}
        @pointercancel=${this.onCellUp}
        @wheel=${(e: WheelEvent) => this.onCellWheel(e, scene, target.slotId)}
      >
        <span class="cell-text">${SongElement.cellText(ord)}</span>
        ${hasNotes ? html`<span class="dot"></span>` : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* One Pantone accent per device; tints the controls. */
      --control-cursor-color: var(--song-accent, #6fb3e0);
      --control-label-color: var(--light-secondary);
    }

    .module {
      display: flex;
      justify-content: center;
      gap: 0.6em;
      background: var(--main-panel-color);
      border-radius: 0 0 0.5rem 0.5rem;
      padding: 1em;
      box-sizing: border-box;
    }

    /* Neutral charcoal zones, nudged toward the device hue — the camaïeu. */
    .zone {
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      padding: 0.7em 1em;
      border-radius: 0.4rem;
    }

    .scenes-zone {
      background: var(--song-scenes-panel-color, #2a2f35);
    }

    .zone-label {
      align-self: flex-start;
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
    }

    .grid {
      display: grid;
      grid-template-columns: auto repeat(var(--cols), minmax(34px, auto));
      gap: 3px 4px;
      align-items: stretch;
    }

    .corner {
      width: 20px;
    }

    .col-label {
      font-size: 0.55em;
      font-weight: bold;
      letter-spacing: 0.05em;
      color: var(--light-secondary);
      text-align: center;
      align-self: end;
      overflow: hidden;
      white-space: nowrap;
    }

    /* Launch pads: the groovebox scene row. */
    .pad {
      width: 20px;
      height: 20px;
      padding: 0;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.6em;
      font-weight: bold;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .pad:hover:not(:disabled) { background: var(--medium); }

    .pad:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .pad.selected {
      border-color: var(--song-accent, #6fb3e0);
    }

    .pad.playing {
      background: var(--song-accent, #6fb3e0);
      border-color: var(--song-accent, #6fb3e0);
      color: var(--darker);
    }

    .pad.queued {
      animation: queued-blink 0.5s steps(1) infinite;
    }

    @keyframes queued-blink {
      50% { outline: 1px solid var(--song-accent, #6fb3e0); outline-offset: 1px; }
    }

    /* Cells: LCD tiles in the device's own pattern language. */
    .cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 20px;
      border-radius: 3px;
      background: var(--lcd-screen-background, var(--darker));
      color: var(--lcd-text-color, var(--song-accent, #6fb3e0));
      font-family: monospace;
      font-size: 0.62em;
      cursor: ns-resize;
      touch-action: none;
      user-select: none;
    }

    .cell.empty .cell-text { opacity: 0.35; }

    .cell.mute .cell-text {
      color: var(--mixer-mute-active, #c44a3a);
      font-weight: bold;
    }

    .cell .dot {
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.7;
    }

    .pos-lcd {
      display: flex;
      align-items: center;
      gap: 0.4em;
      --lcd-screen-width: 72px;
      --lcd-font-size: 9px;
    }

    .stepper-label {
      font-size: 0.6em;
      font-weight: bold;
      letter-spacing: 0.06em;
      color: var(--light-secondary);
    }
  `;
}
