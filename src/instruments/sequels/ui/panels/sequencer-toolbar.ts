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

export const enum ToolbarEvent {
  PLAY = "play",
  STOP = "stop",
  BPM = "bpm",
  SUBDIVISION = "subdivision",
  DIRECTION = "direction",
  LOOP = "loop",
}

@customElement("sequencer-toolbar")
export class SequencerToolbar extends LitElement {
  @property({ type: Number })
  bpm = 120;

  @property({ type: Number })
  subdivision = 4;

  @property({ type: Boolean })
  playing = false;

  @property({ type: Number })
  direction = 0;

  @property({ type: Boolean })
  loop = true;

  render() {
    return html`
      <div class="toolbar">
        <div class="panel transport-panel">
          <button
            class=${classMap({ "round-btn": true, "play-btn": true, active: this.playing })}
            @click=${() => this.emit(this.playing ? ToolbarEvent.STOP : ToolbarEvent.PLAY, 0)}
          >
            ${this.playing ? "■" : "▶"}
          </button>
          <button
            class=${classMap({ "round-btn": true, "loop-btn": true, active: this.loop })}
            @click=${() => this.emit(ToolbarEvent.LOOP, this.loop ? 0 : 1)}
          >
            ⟳
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
        </div>
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
      </div>
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
      --control-label-color: var(--light-secondary);
    }

    .toolbar {
      display: grid;
      grid-template-columns: auto 1fr 1fr 1fr;
      gap: 0.4em;
      align-items: stretch;
    }

    .panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      padding: 0.5em 0.6em;
      background: var(--sequencer-panel-color);
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

    .play-btn {
      font-size: 0.7em;
      padding-left: 2px;
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
      padding: 0.25em 0.4em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.65em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .toggle-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
      border-color: var(--lcd-led-on-color);
    }
  `;
}
