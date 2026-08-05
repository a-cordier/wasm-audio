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
import { ControlID } from "../../../../control/types";
import { ChangeDetail } from "../../../../types/events";
import { TransportState } from "../../types";

export const enum ToolbarEvent {
  PLAY_PAUSE = "play-pause",
  STOP = "stop",
  RECORD = "record",
  BPM = "bpm",
  SUBDIVISION = "subdivision",
  DIRECTION = "direction",
  LOOP = "loop",
  TRANSPOSE = "transpose",
  METRONOME = "metronome",
  COPY = "copy",
  PASTE = "paste",
  CLEAR = "clear",
}

/** Taps further apart than this start a new count. */
const TAP_TIMEOUT_MS = 2000;
/** Number of intervals averaged together. */
const TAP_AVERAGE = 4;

@customElement("sequencer-toolbar")
export class SequencerToolbar extends LitElement {
  @property({ type: Number })
  bpm = 120;

  @property({ type: Number })
  subdivision = 4;

  @property({ type: Number })
  transport: number = TransportState.STOPPED;

  @property({ type: Boolean })
  recording = false;

  /** Momentary pulse confirming a note was captured. */
  @property({ type: Boolean })
  recordFlash = false;

  @property({ type: Number })
  direction = 0;

  @property({ type: Boolean })
  loop = true;

  @property({ type: Number })
  transpose = 0;

  @property({ type: Boolean })
  metronome = false;

  @property({ type: Boolean })
  hasClipboard = false;

  private taps: number[] = [];

  private get playing(): boolean {
    return this.transport === TransportState.PLAYING;
  }

  render() {
    return html`
      <div class="toolbar">
        <div class="toolbar-row">
        <div class="panel transport-panel">
          <button
            class=${classMap({ "round-btn": true, "play-btn": true, active: this.playing })}
            title=${this.playing ? "Pause (Space)" : "Play (Space)"}
            @click=${() => this.emit(ToolbarEvent.PLAY_PAUSE, 0)}
          >
            ${this.playing ? "❚❚" : "▶"}
          </button>
          <button
            class=${classMap({ "round-btn": true, "stop-btn": true })}
            title="Stop (Shift+Space)"
            ?disabled=${this.transport === TransportState.STOPPED}
            @click=${() => this.emit(ToolbarEvent.STOP, 0)}
          >
            ■
          </button>
          <button
            class=${classMap({ "round-btn": true, "rec-btn": true, active: this.recording, flash: this.recordFlash })}
            title="Record (Enter)"
            @click=${() => this.emit(ToolbarEvent.RECORD, this.recording ? 0 : 1)}
          >
            ●
          </button>
          <button
            class=${classMap({ "round-btn": true, "loop-btn": true, active: this.loop })}
            title="Loop"
            @click=${() => this.emit(ToolbarEvent.LOOP, this.loop ? 0 : 1)}
          >
            ⟳
          </button>
        </div>
        <div class="panel click-panel">
          <button
            class=${classMap({ "toggle-btn": true, active: this.metronome })}
            title="Metronome — also gives a one-bar count-in when starting with record armed"
            @click=${() => this.emit(ToolbarEvent.METRONOME, this.metronome ? 0 : 1)}
          >
            CLICK
          </button>
        </div>
        <div class="panel bpm-panel">
          <control-learn-wrapper .controlID=${ControlID.SEQ_BPM}>
            <div class="lcd-row">
              <button class="inc-btn" @click=${() => this.emit(ToolbarEvent.BPM, Math.max(20, this.bpm - 1))}>-</button>
              <lcd-element .text=${String(this.bpm)}></lcd-element>
              <button class="inc-btn" @click=${() => this.emit(ToolbarEvent.BPM, Math.min(300, this.bpm + 1))}>+</button>
            </div>
          </control-learn-wrapper>
          <button class="toggle-btn tap-btn" title="Tap tempo" @click=${this.onTap}>TAP</button>
          <button class="toggle-btn" title="Halve the tempo" @click=${() => this.setBpm(this.bpm / 2)}>÷2</button>
          <button class="toggle-btn" title="Double the tempo" @click=${() => this.setBpm(this.bpm * 2)}>×2</button>
        </div>
        </div>
        <div class="toolbar-row">
        <div class="panel subdiv-panel">
          ${[1, 2, 4, 8].map(
            (sub) => html`
              <button
                class=${classMap({ "toggle-btn": true, active: this.subdivision === sub })}
                @click=${() => this.emit(ToolbarEvent.SUBDIVISION, sub)}
              >
                ${this.subdivisionName(sub)}
              </button>
            `
          )}
        </div>
        <div class="panel direction-panel">
          ${["FWD", "REV", "P-P", "RND"].map(
            (name, i) => html`
              <button
                class=${classMap({ "toggle-btn": true, active: this.direction === i })}
                @click=${() => this.emit(ToolbarEvent.DIRECTION, i)}
              >
                ${name}
              </button>
            `
          )}
        </div>
        <div class="panel transpose-panel">
          <label class="ctrl-label" title="Transpose playback in semitones">TR</label>
          <div class="lcd-row">
            <button class="inc-btn" @click=${() => this.emit(ToolbarEvent.TRANSPOSE, this.transpose - 1)}>-</button>
            <lcd-element .text=${this.transposeLabel}></lcd-element>
            <button class="inc-btn" @click=${() => this.emit(ToolbarEvent.TRANSPOSE, this.transpose + 1)}>+</button>
          </div>
        </div>
        <div class="panel edit-panel">
          <button class="toggle-btn" title="Copy this pattern (Ctrl/Cmd+C)" @click=${() => this.emit(ToolbarEvent.COPY, 0)}>
            COPY
          </button>
          <button
            class="toggle-btn"
            title="Paste over this pattern (Ctrl/Cmd+V)"
            ?disabled=${!this.hasClipboard}
            @click=${() => this.emit(ToolbarEvent.PASTE, 0)}
          >
            PASTE
          </button>
          <button class="toggle-btn" title="Clear this pattern (Backspace)" @click=${() => this.emit(ToolbarEvent.CLEAR, 0)}>
            CLR
          </button>
        </div>
        </div>
      </div>
    `;
  }

  private get transposeLabel(): string {
    return this.transpose > 0 ? `+${this.transpose}` : String(this.transpose);
  }

  private setBpm(value: number) {
    this.emit(ToolbarEvent.BPM, Math.max(20, Math.min(300, Math.round(value))));
  }

  /**
   * Averages the gaps between the last few taps. A gap over TAP_TIMEOUT_MS
   * is treated as the start of a new count rather than a very slow tempo.
   */
  private onTap = () => {
    const now = performance.now();
    const last = this.taps[this.taps.length - 1];
    if (last !== undefined && now - last > TAP_TIMEOUT_MS) this.taps = [];

    this.taps.push(now);
    if (this.taps.length > TAP_AVERAGE + 1) this.taps.shift();
    if (this.taps.length < 2) return;

    let total = 0;
    for (let i = 1; i < this.taps.length; i++) total += this.taps[i] - this.taps[i - 1];
    this.setBpm(60000 / (total / (this.taps.length - 1)));
  };

  private emit<T extends string>(type: T, value: number | string) {
    this.dispatchEvent(
      new CustomEvent<ChangeDetail<T>>("change", {
        detail: { type, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private subdivisionName(sub: number): string {
    switch (sub) {
      case 1: return "1/4";
      case 2: return "1/8";
      case 4: return "1/16";
      case 8: return "1/32";
      default: return "1/16";
    }
  }

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      --control-label-color: var(--light-secondary);
    }

    /* Two independent rows rather than one grid: a shared grid would force the
       CLICK panel to the width of the DIRECTION panel sitting below it. */
    .toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.4em;
    }

    .toolbar-row {
      display: flex;
      align-items: stretch;
      gap: 0.3em;
      flex-wrap: wrap;
    }

    .bpm-panel,
    .direction-panel {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ctrl-label {
      font-size: var(--control-label-font-size);
      color: var(--light-secondary);
    }

    .tap-btn {
      min-width: 2.6em;
    }

    /* The default 120px LCD would crowd the direction buttons beside it. */
    .transpose-panel .lcd-row {
      --lcd-screen-width: 2.8em;
    }

    .panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35em;
      padding: 0.5em 0.45em;
      background: var(--seq-transport-panel-color, var(--sequencer-panel-color));
      border-radius: 0.4rem;
    }

    .round-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid var(--light-secondary);
      background: var(--dark-secondary);
      color: var(--lighter);
      cursor: pointer;
      transition: background var(--ui-transition-time);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .round-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
    }

    .round-btn:disabled {
      opacity: 0.35;
      cursor: default;
    }

    .play-btn {
      font-size: 0.7em;
      padding-left: 2px;
    }

    .stop-btn {
      font-size: 0.7em;
    }

    /* No red in the theme tokens — the record indicator brings its own. */
    .rec-btn {
      font-size: 0.7em;
      --rec-color: #d64545;
    }

    .rec-btn.active {
      background: var(--rec-color);
      border-color: var(--rec-color);
      color: var(--lighter);
    }

    .rec-btn.flash {
      background: var(--lighter);
      border-color: var(--lighter);
      color: var(--rec-color);
    }

    .loop-btn {
      font-size: 1em;
    }

    .lcd-row {
      display: flex;
      align-items: center;
      gap: 0.2em;
      outline: 1px solid var(--learn-outline-color, transparent);
      outline-offset: 2px;
      border-radius: 4px;
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

    .toggle-btn {
      padding: 0.25em 0.32em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.65em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .toggle-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .toggle-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
      border-color: var(--lcd-led-on-color);
    }
  `;
}
