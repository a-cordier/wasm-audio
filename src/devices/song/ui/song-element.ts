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
import { SongScene, SongChain, SCENE_COUNT, CELL_MUTE, MIN_ENTRY_BARS, MAX_ENTRY_BARS } from "../types/song-state";
import { SongEvent } from "../types/song-event";

import "../../../components/common/lcd/lcd-element";
import type { LCD } from "../../../components/common/lcd/lcd-element";

/** Cell editing walks one ordered domain per COLUMN: — , M, then that
 * device's own patterns (ordinal -2 .. patternCount-1, labels from
 * `patternLabel` — each column speaks its device's dialect). */
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
  @state() private chain: SongChain | null = null;
  @state() private selectedScene = 0;
  @state() private targets: SceneTargetEntry[] = [];

  // rAF readout (POS LCD, pad playing/queued lights, chain playhead) —
  // mixer-meter idiom: value-quantized writes outside Lit's render loop;
  // rAF parks while the tab is hidden, and disconnect cancels it.
  private rafId = 0;
  private lastBarShown = "";
  private lastPlaying = -2;
  private lastQueued: number | null = -2 as number | null;
  private lastChainIndex = -2;
  private lastChainPct = -1;

  /** The in-flight cell drag; one composed change per gesture. A press that
   * never moves is a CLICK and opens the pattern picker on release. */
  private drag: { scene: number; target: SceneTargetEntry; startY: number; startOrd: number; edited: boolean } | null = null;
  /** The open pattern picker (anchored to its cell's rect at open time). */
  @state() private picker: { scene: number; target: SceneTargetEntry; left: number; top: number } | null = null;
  /** The in-flight chain-entry drag (scene or bars field). */
  private entryDrag: { index: number; field: "scene" | "bars"; startY: number; startVal: number; edited: boolean } | null = null;

  private get controller(): SongController {
    return this.plugin as SongController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onScenes = (e: Event) => { this.scenes = (e as CustomEvent).detail; };
  private onChain = (e: Event) => { this.chain = (e as CustomEvent).detail; };
  private onSelection = (e: Event) => { this.selectedScene = (e as CustomEvent).detail.selectedScene; };
  private onDirectory = () => {
    this.targets = this.controller.sceneTargets();
    this.picker = null; // its column may be gone
  };
  /** Any press outside this element closes the picker. */
  private onDocDown = (e: Event) => {
    if (this.picker && !e.composedPath().includes(this)) this.picker = null;
  };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    this.scenes = this.controller.getScenes();
    this.chain = this.controller.getChain();
    this.selectedScene = this.controller.getSelection().selectedScene;
    this.targets = this.controller.sceneTargets();
    this.controller.addEventListener(SongEvent.SCENES, this.onScenes);
    this.controller.addEventListener(SongEvent.CHAIN, this.onChain);
    this.controller.addEventListener(SongEvent.SELECTION, this.onSelection);
    getParamDirectory().addEventListener("directory-change", this.onDirectory);
    document.addEventListener("pointerdown", this.onDocDown);
    this.rafId = requestAnimationFrame(this.tickReadout);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("pointerdown", this.onDocDown);
    getParamDirectory().removeEventListener("directory-change", this.onDirectory);
    if (!this.plugin) return;
    this.controller.removeEventListener(SongEvent.SCENES, this.onScenes);
    this.controller.removeEventListener(SongEvent.CHAIN, this.onChain);
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
    this.lastChainIndex = -2;
    this.lastChainPct = -1;
  }

  private tickReadout = () => {
    this.rafId = requestAnimationFrame(this.tickReadout);
    if (!this.plugin) return;
    const p = this.controller.getPosition();
    const barText = !p.running || p.bar < 0
      ? "—"
      : p.chain
        ? `S${p.chain.scene + 1} ${p.chain.barInEntry + 1}/${p.chain.bars} · BAR ${p.bar + 1}`
        : `BAR ${p.bar + 1}`;
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
    // Chain playhead: active entry + a bar-granular progress fill.
    const chainIndex = p.chain?.index ?? -1;
    const chainPct = p.chain ? Math.round(((p.chain.barInEntry + 1) / p.chain.bars) * 100) : 0;
    if (chainIndex !== this.lastChainIndex || chainPct !== this.lastChainPct) {
      this.lastChainIndex = chainIndex;
      this.lastChainPct = chainPct;
      this.shadowRoot?.querySelectorAll(".entry").forEach((entry, i) => {
        entry.classList.toggle("active", i === chainIndex);
        const fill = entry.querySelector<HTMLElement>(".e-progress");
        if (fill) fill.style.width = i === chainIndex ? `${chainPct}%` : "0";
      });
    }
  };

  // --- Cell editing: per-column domain — click picks, drag/wheel steps ---

  private cellOrd(scene: number, slotId: string): number {
    const v = this.scenes?.[scene]?.cells[slotId];
    return v === undefined ? ORD_CLEAR : v;
  }

  private cellText(ord: number, target: SceneTargetEntry): string {
    if (ord === ORD_CLEAR) return "—";
    if (ord === CELL_MUTE) return "M";
    return target.plugin.patternLabel(ord);
  }

  private setCellOrd(scene: number, target: SceneTargetEntry, ord: number) {
    const clamped = Math.max(ORD_CLEAR, Math.min(target.plugin.patternCount - 1, ord));
    if (clamped === this.cellOrd(scene, target.slotId)) return false;
    this.controller.setCell(scene, target.slotId, clamped === ORD_CLEAR ? null : clamped);
    return true;
  }

  private onCellDown(e: PointerEvent, scene: number, target: SceneTargetEntry) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.drag = { scene, target, startY: e.clientY, startOrd: this.cellOrd(scene, target.slotId), edited: false };
  }

  private onCellMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    const ord = d.startOrd + Math.round((d.startY - e.clientY) / DRAG_PX);
    if (this.setCellOrd(d.scene, d.target, ord)) d.edited = true;
  }

  private onCellUp(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    this.drag = null;
    if (d.edited) {
      this.notifyChanged();
      return;
    }
    // A press that never stepped is a click: open the pattern picker.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 300));
    this.picker = { scene: d.scene, target: d.target, left, top: rect.bottom + 4 };
  }

  private onCellWheel(e: WheelEvent, scene: number, target: SceneTargetEntry) {
    e.preventDefault();
    if (this.setCellOrd(scene, target, this.cellOrd(scene, target.slotId) + (e.deltaY < 0 ? 1 : -1))) {
      this.notifyChanged();
    }
  }

  private pickOrd(ord: number) {
    const p = this.picker;
    if (!p) return;
    if (this.setCellOrd(p.scene, p.target, ord)) this.notifyChanged();
    this.picker = null;
  }

  private onPad(scene: number) {
    this.controller.launchScene(scene);
    this.notifyChanged();
  }

  // --- Chain editing: per-field drag/wheel on the entry tiles ---

  private entryVal(index: number, field: "scene" | "bars"): number {
    const entry = this.chain?.entries[index];
    return entry ? (field === "scene" ? entry.scene : entry.bars) : 0;
  }

  private setEntryVal(index: number, field: "scene" | "bars", value: number): boolean {
    const lo = field === "scene" ? 0 : MIN_ENTRY_BARS;
    const hi = field === "scene" ? SCENE_COUNT - 1 : MAX_ENTRY_BARS;
    const clamped = Math.max(lo, Math.min(hi, value));
    if (clamped === this.entryVal(index, field)) return false;
    this.controller.setChainEntry(index, { [field]: clamped });
    return true;
  }

  private onEntryDown(e: PointerEvent, index: number, field: "scene" | "bars") {
    if (!this.transportSynced) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.entryDrag = { index, field, startY: e.clientY, startVal: this.entryVal(index, field), edited: false };
  }

  private onEntryMove(e: PointerEvent) {
    const d = this.entryDrag;
    if (!d) return;
    const val = d.startVal + Math.round((d.startY - e.clientY) / DRAG_PX);
    if (this.setEntryVal(d.index, d.field, val)) d.edited = true;
  }

  private onEntryUp(e: PointerEvent) {
    if (!this.entryDrag) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (this.entryDrag.edited) this.notifyChanged();
    this.entryDrag = null;
  }

  private onEntryWheel(e: WheelEvent, index: number, field: "scene" | "bars") {
    if (!this.transportSynced) return;
    e.preventDefault();
    if (this.setEntryVal(index, field, this.entryVal(index, field) + (e.deltaY < 0 ? 1 : -1))) {
      this.notifyChanged();
    }
  }

  private stepChainCount(delta: number) {
    if (!this.chain) return;
    this.controller.setChainCount(this.chain.count + delta);
    this.notifyChanged();
  }

  private onChainToggle() {
    if (!this.chain) return;
    this.controller.setChainOn(this.chain.on === 0);
    this.notifyChanged();
  }

  private onLoopToggle() {
    if (!this.chain) return;
    this.controller.setChainLoop(this.chain.loop === 0);
    this.notifyChanged();
  }

  render() {
    if (!this.scenes || !this.chain) return html``;
    const targets = this.targets;
    const hasTargets = targets.length > 0;
    const synced = this.transportSynced;
    const chainTitle = synced ? "" : "Follows the master transport — SYNC the module";
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
        </div>
        <div class=${classMap({ zone: true, "chain-zone": true, ghosted: !synced })} title=${chainTitle}>
          <label class="zone-label">CHAIN</label>
          ${this.stepper("COUNT", String(this.chain.count), synced, (d) => this.stepChainCount(d), chainTitle)}
          <div class="lane">
            ${this.chain.entries.slice(0, this.chain.count).map((e, i) => this.renderEntry(e, i, synced))}
          </div>
          <div class="chain-btns">
            <button
              class=${classMap({ "name-btn": true, active: synced && this.chain.on === 1 })}
              ?disabled=${!synced}
              title=${synced ? "Play the scenes in order, N bars each" : chainTitle}
              @click=${this.onChainToggle}
            >CHAIN</button>
            <button
              class=${classMap({ "name-btn": true, active: synced && this.chain.loop === 1 })}
              ?disabled=${!synced}
              title=${synced ? "Wrap at the end — off holds the last scene" : chainTitle}
              @click=${this.onLoopToggle}
            >LOOP</button>
          </div>
          <div class="pos-lcd" title=${synced ? "Song position — scene, bar in entry, master bar" : chainTitle}>
            <label class="stepper-label">POS</label>
            <lcd-element .text=${"—"}></lcd-element>
          </div>
        </div>
        ${this.renderPicker()}
      </div>
    `;
  }

  private renderEntry(entry: { scene: number; bars: number }, index: number, synced: boolean) {
    return html`
      <div class="entry" title=${synced ? "Drag or wheel: scene × bars" : ""}>
        <span
          class="e-field e-scene"
          @pointerdown=${(e: PointerEvent) => this.onEntryDown(e, index, "scene")}
          @pointermove=${this.onEntryMove}
          @pointerup=${this.onEntryUp}
          @pointercancel=${this.onEntryUp}
          @wheel=${(e: WheelEvent) => this.onEntryWheel(e, index, "scene")}
        >${entry.scene + 1}</span>
        <span class="e-x">×</span>
        <span
          class="e-field e-bars"
          @pointerdown=${(e: PointerEvent) => this.onEntryDown(e, index, "bars")}
          @pointermove=${this.onEntryMove}
          @pointerup=${this.onEntryUp}
          @pointercancel=${this.onEntryUp}
          @wheel=${(e: WheelEvent) => this.onEntryWheel(e, index, "bars")}
        >${entry.bars}</span>
        <div class="e-progress"></div>
      </div>
    `;
  }

  private stepper(
    label: string,
    text: string,
    enabled: boolean,
    onStep: (delta: number) => void,
    title = ""
  ) {
    return html`
      <div class="stepper-row" title=${title}>
        <label class="stepper-label">${label}</label>
        <div class="stepper">
          <button class="inc-btn" ?disabled=${!enabled} @click=${() => { onStep(-1); }}>-</button>
          <lcd-element .text=${text}></lcd-element>
          <button class="inc-btn" ?disabled=${!enabled} @click=${() => { onStep(1); }}>+</button>
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
        title="Click to pick — drag or wheel steps — (no change), M (mute), then ${target.name}'s patterns"
        @pointerdown=${(e: PointerEvent) => this.onCellDown(e, scene, target)}
        @pointermove=${this.onCellMove}
        @pointerup=${this.onCellUp}
        @pointercancel=${this.onCellUp}
        @wheel=${(e: WheelEvent) => this.onCellWheel(e, scene, target)}
      >
        <span class="cell-text">${this.cellText(ord, target)}</span>
        ${hasNotes ? html`<span class="dot"></span>` : nothing}
      </div>
    `;
  }

  /** The pattern picker: the column's device vocabulary as a pad grid —
   * — / M, then every pattern by its own label, content-dotted. */
  private renderPicker() {
    const p = this.picker;
    if (!p) return nothing;
    const current = this.cellOrd(p.scene, p.target.slotId);
    const count = p.target.plugin.patternCount;
    const tiles = [];
    for (let i = 0; i < count; i++) tiles.push(i);
    return html`
      <div class="picker" style="left: ${p.left}px; top: ${p.top}px">
        <div class="picker-head">${p.target.name} · SCENE ${p.scene + 1}</div>
        <div class="picker-row">
          <button
            class=${classMap({ tile: true, wide: true, active: current === ORD_CLEAR })}
            title="No change — the scene leaves this sequencer as it was"
            @click=${() => this.pickOrd(ORD_CLEAR)}
          >—</button>
          <button
            class=${classMap({ tile: true, wide: true, mute: true, active: current === CELL_MUTE })}
            title="Muted in this scene"
            @click=${() => this.pickOrd(CELL_MUTE)}
          >M</button>
        </div>
        <div class="picker-grid">
          ${tiles.map(
            (i) => html`
              <button
                class=${classMap({ tile: true, active: current === i, filled: p.target.plugin.patternHasContent(i) })}
                @click=${() => this.pickOrd(i)}
              >${p.target.plugin.patternLabel(i)}</button>
            `
          )}
        </div>
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

    .chain-zone {
      background: var(--song-chain-panel-color, #292e33);
      min-width: 150px;
    }

    .chain-zone.ghosted .lane,
    .chain-zone.ghosted .pos-lcd {
      opacity: 0.4;
    }

    .chain-zone.ghosted .e-field {
      cursor: default;
    }

    /* The song lane: entry tiles reading scene × bars, playhead fill. */
    .lane {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      max-width: 150px;
    }

    .entry {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1px;
      padding: 2px 5px 4px;
      border-radius: 3px;
      background: var(--lcd-screen-background, var(--darker));
      color: var(--lcd-text-color, var(--song-accent, #6fb3e0));
      font-family: monospace;
      font-size: 0.62em;
      overflow: hidden;
    }

    .entry.active {
      outline: 1px solid var(--song-accent, #6fb3e0);
    }

    .e-field {
      cursor: ns-resize;
      touch-action: none;
      user-select: none;
      padding: 0 1px;
    }

    .e-x {
      opacity: 0.5;
    }

    .e-progress {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 0;
      height: 2px;
      background: var(--song-accent, #6fb3e0);
    }

    .chain-btns {
      display: flex;
      gap: 0.4em;
    }

    .name-btn {
      padding: 0.35em 0.9em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.62em;
      font-weight: bold;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .name-btn:hover:not(:disabled) { background: var(--medium); }

    .name-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .name-btn.active {
      background: var(--song-accent, #6fb3e0);
      border-color: var(--song-accent, #6fb3e0);
      color: var(--darker);
    }

    .pos-lcd {
      display: flex;
      align-items: center;
      gap: 0.4em;
      --lcd-screen-width: 110px;
      --lcd-font-size: 9px;
    }

    /* The pattern picker: a floating pad grid in the column device's own
     * vocabulary (for sequels, rows read as banks A–D × pads 0–9). */
    .picker {
      position: fixed;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border-radius: 4px;
      border: 1px solid var(--medium);
      background: var(--browser-menu-bg, #141414);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    }

    .picker-head {
      font-size: 0.55em;
      font-weight: bold;
      letter-spacing: 0.06em;
      color: var(--light-secondary);
    }

    .picker-row {
      display: flex;
      gap: 3px;
    }

    .picker-grid {
      display: grid;
      grid-template-columns: repeat(10, 26px);
      gap: 3px;
    }

    .tile {
      height: 20px;
      padding: 0;
      border: 1px solid var(--medium);
      border-radius: 3px;
      background: var(--lcd-screen-background, var(--darker));
      color: var(--lcd-text-color, var(--song-accent, #6fb3e0));
      font-family: monospace;
      font-size: 9px;
      cursor: pointer;
      opacity: 0.55;
    }

    .tile.filled { opacity: 1; }

    .tile.wide { width: 55px; }

    .tile.mute { color: var(--mixer-mute-active, #c44a3a); }

    .tile:hover { border-color: var(--light-secondary); opacity: 1; }

    .tile.active {
      border-color: var(--song-accent, #6fb3e0);
      opacity: 1;
    }

    .stepper-row {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
      --lcd-screen-width: 36px;
      --lcd-font-size: 9px;
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
    }

    .inc-btn:hover:not(:disabled) { background: var(--medium); }

    .inc-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .stepper-label {
      font-size: 0.6em;
      font-weight: bold;
      letter-spacing: 0.06em;
      color: var(--light-secondary);
    }
  `;
}
