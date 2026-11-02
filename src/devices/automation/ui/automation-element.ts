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
  @state() private target: AutomationState["target"] | null = null;
  @state() private targets: AutomationTargetEntry[] = [];

  private get controller(): AutomationController {
    return this.plugin as AutomationController;
  }

  // Stable handler identity — symmetric add/remove, as everywhere.
  private onSignal = (e: Event) => { this.signal = { ...(e as CustomEvent).detail }; };
  private onTarget = (e: Event) => { this.target = { ...(e as CustomEvent).detail }; };
  private onDirectory = () => { this.targets = getParamDirectory().getTargets(); };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    const snapshot = this.controller.getState();
    this.signal = snapshot.signal;
    this.target = snapshot.target;
    this.targets = getParamDirectory().getTargets();
    this.controller.addEventListener(AutomationEvent.SIGNAL, this.onSignal);
    this.controller.addEventListener(AutomationEvent.TARGET, this.onTarget);
    getParamDirectory().addEventListener("directory-change", this.onDirectory);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    getParamDirectory().removeEventListener("directory-change", this.onDirectory);
    if (!this.plugin) return;
    this.controller.removeEventListener(AutomationEvent.SIGNAL, this.onSignal);
    this.controller.removeEventListener(AutomationEvent.TARGET, this.onTarget);
  }

  // Composed so the shell hears it and snapshots the session.
  private notifyChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

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
    const next = Math.max(0, Math.min(DIVISIONS.length - 1, this.signal.div.value + delta));
    this.controller.setDiv(next);
    this.notifyChanged();
  }

  private onRunToggle() {
    if (!this.signal) return;
    this.controller.setRun(this.signal.run.value === 0);
    this.notifyChanged();
  }

  render() {
    if (!this.signal || !this.target) return html``;
    const synced = this.transportSynced;
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
