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
import { classMap } from "lit/directives/class-map.js";
import type { Plugin } from "../../../core/types";
import { getParamDirectory, AutomationTargetEntry } from "../../../control/param-directory";
import { AutomationController } from "../automation-controller";
import { AutomationState, SHAPES, DIVISIONS } from "../types/automation-state";
import { stepDivision } from "../../../core/divisions";
import { AutomationEvent } from "../types/automation-event";

import "../../../components/common/controls/knob-element";
import "../../../components/common/lcd/lcd-element";

/**
 * The MOTION panel: TARGET picks the automated address (device + param LCD
 * steppers over the ParamDirectory), SIGNAL shapes the motion. Synced (SYNC
 * in the header) the cycle follows the master clock — DIV is live, RATE/RUN
 * ghost; free-running it's the other way around.
 */
@customElement("automation-element")
export class AutomationElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @property({ attribute: false })
  transportSynced = false;

  @state() private signal: AutomationState["signal"] | null = null;
  @state() private steps: AutomationState["steps"] | null = null;
  @state() private target: AutomationState["target"] | null = null;
  @state() private targets: AutomationTargetEntry[] = [];

  /** True between lane pointer-down and up — one session save per gesture. */
  private painting = false;

  // rAF indicator (playhead + output meter) — mixer-meter idiom: direct,
  // value-quantized DOM writes outside Lit's render loop. The browser
  // already parks rAF while the tab is hidden, and disconnect cancels it.
  private rafId = 0;
  private lastMeterPct = -1;
  private lastPlayStep = -2; // -1 is the legal "no playhead" value
  /** Last painted bar — a fast drag hops bars between samples, so the gap
   * is filled by interpolating from here. */
  private lastPaint: { index: number; value: number } | null = null;

  private get controller(): AutomationController {
    return this.plugin as AutomationController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onSignal = (e: Event) => { this.signal = { ...(e as CustomEvent).detail }; };
  private onSteps = (e: Event) => { this.steps = (e as CustomEvent).detail; };
  private onTarget = (e: Event) => { this.target = { ...(e as CustomEvent).detail }; };
  private onDirectory = () => { this.targets = getParamDirectory().getTargets(); };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    const snapshot = this.controller.getState();
    this.signal = snapshot.signal;
    this.steps = snapshot.steps;
    this.target = snapshot.target;
    this.targets = getParamDirectory().getTargets();
    this.controller.addEventListener(AutomationEvent.SIGNAL, this.onSignal);
    this.controller.addEventListener(AutomationEvent.STEPS, this.onSteps);
    this.controller.addEventListener(AutomationEvent.TARGET, this.onTarget);
    getParamDirectory().addEventListener("directory-change", this.onDirectory);
    this.rafId = requestAnimationFrame(this.tickIndicator);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rafId);
    getParamDirectory().removeEventListener("directory-change", this.onDirectory);
    if (!this.plugin) return;
    this.controller.removeEventListener(AutomationEvent.SIGNAL, this.onSignal);
    this.controller.removeEventListener(AutomationEvent.STEPS, this.onSteps);
    this.controller.removeEventListener(AutomationEvent.TARGET, this.onTarget);
  }

  // Composed so the shell hears it and snapshots the session.
  private notifyChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  // A render rebuilds the meter fill and the bars, wiping direct writes —
  // forget the quantization so the next frame repaints them.
  protected updated() {
    this.lastMeterPct = -1;
    this.lastPlayStep = -2;
  }

  private tickIndicator = () => {
    this.rafId = requestAnimationFrame(this.tickIndicator);
    if (!this.plugin) return;
    const m = this.controller.getMotion();
    const pct = m.raw < 0 ? 0 : Math.round((m.raw / 127) * 100);
    if (pct !== this.lastMeterPct) {
      this.lastMeterPct = pct;
      const fill = this.shadowRoot?.querySelector<HTMLElement>(".out-fill");
      if (fill) fill.style.width = `${pct}%`;
    }
    const step = m.running ? m.step : -1;
    if (step !== this.lastPlayStep) {
      this.lastPlayStep = step;
      this.shadowRoot
        ?.querySelectorAll(".bar")
        .forEach((b, i) => b.classList.toggle("playing", i === step));
    }
  };

  // --- Target stepping (over the directory's mount-ordered entries) ---

  private get targetEntry(): AutomationTargetEntry | null {
    return this.targets.find((t) => t.slotId === this.target?.slotId) ?? null;
  }

  private stepDevice(delta: number) {
    if (this.targets.length === 0) return;
    const index = this.targets.findIndex((t) => t.slotId === this.target?.slotId);
    const next =
      index < 0
        ? delta > 0 ? 0 : this.targets.length - 1
        : (index + delta + this.targets.length) % this.targets.length;
    const entry = this.targets[next];
    this.controller.setTarget(entry.slotId, entry.params[0]?.id ?? -1);
    this.notifyChanged();
  }

  private stepParam(delta: number) {
    const entry = this.targetEntry;
    if (!entry || entry.params.length === 0) return;
    const index = entry.params.findIndex((p) => p.id === this.target?.controlId);
    const next =
      index < 0 ? 0 : (index + delta + entry.params.length) % entry.params.length;
    this.controller.setTarget(entry.slotId, entry.params[next].id);
    this.notifyChanged();
  }

  private get deviceLcd(): string {
    return this.targetEntry?.name ?? "—";
  }

  private get paramLcd(): string {
    const entry = this.targetEntry;
    if (!entry) return "—";
    return entry.params.find((p) => p.id === this.target?.controlId)?.name ?? "—";
  }

  // --- Signal controls ---

  private stepShape(delta: number) {
    if (!this.signal) return;
    const next = (this.signal.shape.value + delta + SHAPES.length) % SHAPES.length;
    this.controller.setShape(next);
    this.notifyChanged();
  }

  private stepDiv(delta: number) {
    if (!this.signal) return;
    // Through the musical order, not raw indices: DIVISIONS is append-only
    // (stored values are indices), so the dotted/triplet entries live at the
    // array's tail and only stepDivision visits them in sorted position.
    this.controller.setDiv(stepDivision(this.signal.div.value, delta));
    this.notifyChanged();
  }

  private onRunToggle() {
    if (!this.signal) return;
    this.controller.setRun(this.signal.run.value === 0);
    this.notifyChanged();
  }

  // --- Step lane (drag-bar editor: press draws, drag paints across) ---

  private get stepMode(): boolean {
    return this.signal !== null && SHAPES[this.signal.shape.value] === "STEP";
  }

  private onLaneDown(e: PointerEvent) {
    if (!this.stepMode) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.painting = true;
    this.lastPaint = null;
    this.paintStep(e);
  }

  private onLaneMove(e: PointerEvent) {
    if (this.painting) this.paintStep(e);
  }

  private onLaneUp(e: PointerEvent) {
    if (!this.painting) return;
    this.painting = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    this.notifyChanged();
  }

  // Index from x, value from y — both clamped, so a captured drag keeps
  // painting at the edges instead of falling off the lane.
  private paintStep(e: PointerEvent) {
    if (!this.steps) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const index = Math.max(0, Math.min(this.steps.count - 1,
      Math.floor(((e.clientX - rect.left) / rect.width) * this.steps.count)));
    const raw = 127 * (1 - (e.clientY - rect.top) / rect.height);
    const value = Math.max(0, Math.min(127, raw));
    const from = this.lastPaint;
    this.lastPaint = { index, value };
    if (from && Math.abs(index - from.index) > 1) {
      // Fill the hopped-over bars on a line between the two samples.
      const dir = index > from.index ? 1 : -1;
      const span = index - from.index;
      for (let i = from.index + dir; i !== index; i += dir) {
        this.controller.setStep(i, from.value + ((i - from.index) / span) * (value - from.value));
      }
    }
    this.controller.setStep(index, value);
  }

  private stepCount(delta: number) {
    if (!this.steps) return;
    this.controller.setStepCount(this.steps.count + delta);
    this.notifyChanged();
  }

  render() {
    if (!this.signal || !this.steps || !this.target) return html``;
    const synced = this.transportSynced;
    const stepMode = this.stepMode;
    const hasTargets = this.targets.length > 0;
    const running = this.signal.run.value === 1;
    return html`
      <div class="module">
        <div class="zone target-zone">
          <label class="zone-label">TARGET</label>
          ${this.stepper("DEVICE", this.deviceLcd, hasTargets, (d) => this.stepDevice(d))}
          ${this.stepper("PARAM", this.paramLcd, this.targetEntry !== null, (d) => this.stepParam(d))}
        </div>
        <div class="zone signal-zone">
          <label class="zone-label">SIGNAL</label>
          <div class="steppers">
            ${this.stepper("SHAPE", SHAPES[this.signal.shape.value], true, (d) => this.stepShape(d))}
            ${this.stepper(
              "DIV",
              DIVISIONS[this.signal.div.value].label,
              synced,
              (d) => this.stepDiv(d),
              "Cycle length — follows the master clock while SYNC is on"
            )}
          </div>
          <div class="knobs">
            ${this.knob("RATE", this.signal.rate.value, (v) => this.controller.setRate(v), synced, "Free-run speed — the master clock sets the cycle while SYNC is on")}
            ${this.knob("MIN", this.signal.min.value, (v) => this.controller.setMin(v))}
            ${this.knob("MAX", this.signal.max.value, (v) => this.controller.setMax(v))}
            ${this.knob("GLIDE", this.signal.glide.value, (v) => this.controller.setGlide(v))}
            <button
              class=${classMap({ "name-btn": true, active: running && !synced })}
              ?disabled=${synced}
              title=${synced ? "The master transport runs the cycle while SYNC is on" : "Run the cycle"}
              @click=${this.onRunToggle}
            >RUN</button>
          </div>
          <div class="out-meter" title="Output — the value sent to the target">
            <div class="out-fill"></div>
          </div>
        </div>
        <div class="zone steps-zone">
          <label class="zone-label">STEPS</label>
          ${this.stepper(
            "COUNT",
            String(this.steps.count),
            stepMode,
            (d) => this.stepCount(d),
            stepMode ? "" : "Steps play when SHAPE is STEP"
          )}
          <div
            class=${classMap({ lane: true, inactive: !stepMode })}
            title=${stepMode ? "Draw step values — drag paints across" : "Steps play when SHAPE is STEP"}
            @pointerdown=${this.onLaneDown}
            @pointermove=${this.onLaneMove}
            @pointerup=${this.onLaneUp}
            @pointercancel=${this.onLaneUp}
          >
            ${this.steps.values.slice(0, this.steps.count).map(
              (v) => html`
                <div class="bar">
                  <div class="fill" style="height: ${Math.round((v / 127) * 100)}%"></div>
                </div>
              `
            )}
          </div>
        </div>
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
          <button class="inc-btn" ?disabled=${!enabled} @click=${() => onStep(-1)}>-</button>
          <lcd-element .text=${text}></lcd-element>
          <button class="inc-btn" ?disabled=${!enabled} @click=${() => onStep(1)}>+</button>
        </div>
      </div>
    `;
  }

  private knob(
    label: string,
    value: number,
    onChange: (v: number) => void,
    disabled = false,
    title = ""
  ) {
    return html`
      <knob-element
        .value=${value}
        .range=${{ min: 0, max: 127 }}
        .step=${1}
        .label=${label}
        ?disabled=${disabled}
        title=${title}
        @change=${(e: CustomEvent) => { onChange(e.detail.value); this.notifyChanged(); }}
      ></knob-element>
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* One Pantone accent per device; tints the controls. */
      --control-cursor-color: var(--automation-accent, #f28c28);
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

    .target-zone {
      background: var(--automation-target-panel-color, #33302a);
    }

    .signal-zone {
      background: var(--automation-signal-panel-color, #322e28);
    }

    .steps-zone {
      background: var(--automation-steps-panel-color, #353028);
    }

    /* SIGNAL/STEPS LCDs hold ≤4 chars (STEP, 1/32, 16) — the 92px width
     * exists for TARGET's device/param names. */
    .signal-zone .stepper,
    .steps-zone .stepper {
      --lcd-screen-width: 56px;
    }

    /* Fixed lane, flex bars: the bars always tile the full hit area, so
     * pointer→index math lines up with the visuals at every COUNT. */
    .lane {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      width: 158px;
      height: 52px;
      cursor: crosshair;
      touch-action: none;
    }

    .lane.inactive {
      opacity: 0.4;
      cursor: default;
    }

    .bar {
      display: flex;
      align-items: flex-end;
      flex: 1 1 0;
      height: 100%;
      background: var(--dark-secondary);
      border-radius: 2px;
      overflow: hidden;
      pointer-events: none; /* the lane owns the gesture */
    }

    .bar .fill {
      width: 100%;
      min-height: 2px; /* a zeroed step still reads as a step */
      background: var(--automation-accent, #f28c28);
    }

    .bar.playing {
      background: var(--medium);
    }

    .out-meter {
      height: 3px;
      border-radius: 2px;
      background: var(--dark-secondary);
      overflow: hidden;
    }

    .out-fill {
      width: 0;
      height: 100%;
      background: var(--automation-accent, #f28c28);
    }

    .zone-label {
      align-self: flex-start;
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
    }

    .steppers {
      display: flex;
      gap: 1em;
    }

    .stepper-row {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
    }

    .stepper-label {
      font-size: 0.6em;
      font-weight: bold;
      letter-spacing: 0.06em;
      color: var(--light-secondary);
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
      --lcd-screen-width: 92px;
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

    .knobs {
      display: flex;
      align-items: center;
      gap: 0.8em;
      --knob-size: 34px;
      --control-label-font-size: 0.62em;
    }

    .name-btn {
      align-self: center;
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
      background: var(--automation-accent, #f28c28);
      border-color: var(--automation-accent, #f28c28);
      color: var(--darker);
    }
  `;
}
