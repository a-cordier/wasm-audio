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
import { ChangeDetail } from "../../../../types/events";
import { BANK_COUNT, BANK_SIZE, SwitchMode } from "../../types";
import { CONTOUR_NAMES, SCALES } from "../../scales";
import "../../../../components/common/controls/knob-element";

export const enum PatternEvent {
  SELECT_SLOT = "select-slot",
  SELECT_BANK = "select-bank",
  SWITCH_MODE = "switch-mode",
  PULSES = "pulses",
  GENERATE = "generate",
  SCALE = "scale",
  CONTOUR = "contour",
  ROTATION = "rotation",
  VELOCITY_RANDOM = "velocity-random",
}

const BANK_NAMES = ["A", "B", "C", "D"];

// Display order of the ten slots: 1-9 then 0, matching a keyboard number row.
// Each button still carries its own slot number (label, index and the number
// key that selects it), so this only changes on-screen position.
const SLOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

@customElement("pattern-selector-panel")
export class PatternSelectorPanel extends LitElement {
  /** Bank currently on screen — not necessarily the one being played. */
  @property({ type: Number })
  bank = 0;

  @property({ type: Number })
  selectedPattern = 0;

  @property({ type: Number })
  switchMode: number = SwitchMode.IMMEDIATE;

  /** One flag per pattern index; drives the "has content" dot. */
  @property({ type: Array })
  filled: boolean[] = [];

  /** Hits to distribute across the pattern when generating. */
  @property({ type: Number })
  pulses = 7;

  /** Length of the selected pattern — the ceiling for pulses. */
  @property({ type: Number })
  steps = 16;

  /** Index into SCALES; the brush note supplies the root. */
  @property({ type: Number })
  scale = 0;

  @property({ type: Number })
  contour = 0;

  @property({ type: Number })
  rotation = 0;

  /** Velocity humanize amount (0-100%): symmetric jitter added when generating. */
  @property({ type: Number })
  velocityRandom = 20;

  render() {
    return html`
      <div class="selector">
        <div class="panel bank-panel">
          <label class="ctrl-label">BANK</label>
          ${Array.from({ length: BANK_COUNT }, (_, i) => this.renderBank(i))}
        </div>
        <div class="panel slot-panel">
          ${SLOT_ORDER.map((slot) => this.renderSlot(slot))}
        </div>
        <div class="panel mode-panel">
          <button
            class=${classMap({ "toggle-btn": true, active: this.switchMode === SwitchMode.IMMEDIATE })}
            title="Switch pattern at the next step"
            @click=${() => this.emit(PatternEvent.SWITCH_MODE, SwitchMode.IMMEDIATE)}
          >
            IMM
          </button>
          <button
            class=${classMap({ "toggle-btn": true, active: this.switchMode === SwitchMode.CYCLE })}
            title="Switch pattern at the end of the cycle"
            @click=${() => this.emit(PatternEvent.SWITCH_MODE, SwitchMode.CYCLE)}
          >
            CYC
          </button>
        </div>
        <div class="panel euclid-panel">
          <div class="gen-row">
            ${this.stepper("EUCL", `${this.pulses}/${this.steps}`, PatternEvent.PULSES, this.pulses - 1, this.pulses + 1)}
            ${this.stepper("ROT", String(this.rotation), PatternEvent.ROTATION, this.rotation - 1, this.rotation + 1)}
            <button
              class="toggle-btn gen-btn"
              title=${`Spread ${this.pulses} hits over ${this.steps} steps, rotated ${this.rotation}, pitched in ${SCALES[this.scale].name} along ${CONTOUR_NAMES[this.contour]}`}
              @click=${() => this.emit(PatternEvent.GENERATE, this.pulses)}
            >
              GEN
            </button>
          </div>
          <div class="gen-row">
            ${this.stepper("SCALE", SCALES[this.scale].name, PatternEvent.SCALE, this.scale - 1, this.scale + 1)}
            ${this.stepper("SHAPE", CONTOUR_NAMES[this.contour], PatternEvent.CONTOUR, this.contour - 1, this.contour + 1)}
            <div class="humanize">
              <knob-element
                .value=${this.velocityRandom}
                .range=${{ min: 0, max: 100 }}
                .step=${1}
                .label=${"HUMAN"}
                label-position="left"
                title="Velocity humanize: spread applied to each hit's velocity when generating"
                @change=${(e: CustomEvent) => this.emit(PatternEvent.VELOCITY_RANDOM, e.detail.value)}
              ></knob-element>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Label + [-] value [+]; every setting stays visible instead of click-to-cycle. */
  private stepper(label: string, value: string, event: PatternEvent, prev: number, next: number) {
    return html`
      <div class="stepper">
        <label class="ctrl-label">${label}</label>
        <div class="lcd-row">
          <button class="inc-btn" @click=${() => this.emit(event, prev)}>-</button>
          <lcd-element .text=${value}></lcd-element>
          <button class="inc-btn" @click=${() => this.emit(event, next)}>+</button>
        </div>
      </div>
    `;
  }

  private renderBank(index: number) {
    const holdsSelection = Math.floor(this.selectedPattern / BANK_SIZE) === index;
    return html`
      <button
        class=${classMap({ "toggle-btn": true, active: this.bank === index, playing: holdsSelection })}
        title=${`Bank ${BANK_NAMES[index]} (Shift+${index})`}
        @click=${() => this.emit(PatternEvent.SELECT_BANK, index)}
      >
        ${BANK_NAMES[index]}
      </button>
    `;
  }

  private renderSlot(slot: number) {
    const index = this.bank * BANK_SIZE + slot;
    return html`
      <button
        class=${classMap({
          "slot-btn": true,
          active: this.selectedPattern === index,
          filled: this.filled[index] === true,
        })}
        title=${`Pattern ${index} (key ${slot})`}
        @click=${() => this.emit(PatternEvent.SELECT_SLOT, slot)}
      >
        ${slot}
      </button>
    `;
  }

  private emit<T extends string>(type: T, value: number | string) {
    this.dispatchEvent(
      new CustomEvent<ChangeDetail<T>>("change", {
        detail: { type, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      --control-label-color: var(--light-secondary);
    }

    /* Bank / mode / edit share the top row; the ten pattern slots get a full
       row to themselves so they stay large enough to hit. */
    .selector {
      display: grid;
      grid-template-columns: auto auto minmax(0, 1fr);
      grid-template-areas:
        "bank  mode  euclid"
        "slots slots slots";
      gap: 0.4em;
      align-items: stretch;
    }

    .euclid-panel {
      grid-area: euclid;
      flex-direction: column;
      gap: 0.35em;
    }

    .gen-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6em;
      flex-wrap: wrap;
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0.3em;
    }

    /* Humanize is the one continuous amount in this row of discrete selectors,
       so it gets a knob (like GATE/SWING) rather than a stepper. */
    .humanize {
      display: flex;
      align-items: center;
      --knob-size: 26px;
      --control-label-font-size: 0.65em;
    }

    .gen-btn {
      min-width: 2.6em;
    }

    .lcd-row {
      display: flex;
      align-items: center;
      gap: 0.2em;
      --lcd-screen-width: 3.2em;
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

    .bank-panel {
      grid-area: bank;
    }

    .mode-panel {
      grid-area: mode;
    }

    .slot-panel {
      grid-area: slots;
    }

    .panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3em;
      padding: 0.5em 0.6em;
      background: var(--seq-pattern-panel-color, var(--sequencer-panel-color));
      border-radius: 0.4rem;
    }

    /* The generator is its own function, so it carries the teal zone tint;
       compound selector so it wins over .panel whatever the rule order. */
    .panel.euclid-panel {
      background: var(--seq-generate-panel-color, var(--sequencer-panel-color));
    }

    .slot-panel {
      gap: 0.25em;
    }

    .ctrl-label {
      font-size: var(--control-label-font-size);
      color: var(--light-secondary);
      margin-right: 0.2em;
    }

    .toggle-btn {
      padding: 0.25em 0.4em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.65em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .toggle-btn:hover:not(:disabled) {
      background: var(--medium);
    }

    .toggle-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
      border-color: var(--lcd-led-on-color);
    }

    /* Marks the bank holding the selected pattern while another is on screen. */
    .toggle-btn.playing:not(.active) {
      border-color: var(--lcd-led-on-color);
    }

    .toggle-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .slot-btn {
      flex: 1;
      min-width: 22px;
      padding: 0.3em 0;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.7em;
      font-weight: bold;
      cursor: pointer;
      position: relative;
      transition: background var(--ui-transition-time);
    }

    .slot-btn:hover {
      background: var(--medium);
    }

    .slot-btn.filled::after {
      content: "";
      position: absolute;
      bottom: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--lcd-led-on-color);
    }

    .slot-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
      border-color: var(--lcd-led-on-color);
    }

    .slot-btn.active.filled::after {
      background: var(--darker);
    }

    @container (max-width: 560px) {
      .selector {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          "bank"
          "mode"
          "euclid"
          "slots";
      }
    }
  `;
}
