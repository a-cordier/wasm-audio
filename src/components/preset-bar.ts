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
import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { INIT_PRESET_ID, INIT_PRESET_NAME, PRESET_NAME_MAX } from "../core/preset-storage";

import "./common/lcd/lcd-element";

export interface PresetListEntry {
  id: string;
  name: string;
}

/** Stepping is a real open — debounced so tapping through doesn't thrash
 * full rack teardowns. */
const STEP_DEBOUNCE_MS = 300;
/** Stepping away from unsaved work needs a second press inside this window. */
const DISCARD_WINDOW_MS = 1500;
const FLASH_MS = 1500;
const HOLD_DELETE_MS = 600;

type EditMode = "save-as" | "rename";

/**
 * The app-level preset selector in the top transport strip: an LCD stepper
 * over INIT + the factory presets + the saved ones, SAVE / SAVE AS,
 * hold-to-delete. Pure view —
 * the shell (daw-element) owns the store and answers its events:
 * `preset-open {id}`, `preset-save`, `preset-save-as {name}`,
 * `preset-rename {id, name}`, `preset-delete {id}`.
 */
@customElement("preset-bar")
export class PresetBar extends LitElement {
  /** Saved presets, in stepping order (INIT and the factory ones are prepended here). */
  @property({ attribute: false })
  presets: PresetListEntry[] = [];

  /** Built-in presets: openable, never overwritten, renamed or deleted. */
  @property({ attribute: false })
  factory: PresetListEntry[] = [];

  @property({ attribute: false })
  currentId = INIT_PRESET_ID;

  @property({ type: Boolean })
  dirty = false;

  /** Index into [INIT, ...factory, ...presets] while a stepped open is pending. */
  @state()
  private pendingIndex: number | null = null;

  @state()
  private flashText: string | null = null;

  @state()
  private discardArmed = false;

  @state()
  private editMode: EditMode | null = null;

  @state()
  private editValue = "";

  @state()
  private deleting = false;

  @query(".lcd-input")
  private input?: HTMLInputElement;

  private stepTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private discardTimer: ReturnType<typeof setTimeout> | null = null;
  private deleteTimer: ReturnType<typeof setTimeout> | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of [this.stepTimer, this.flashTimer, this.discardTimer, this.deleteTimer]) {
      if (t !== null) clearTimeout(t);
    }
  }

  private get entries(): PresetListEntry[] {
    return [{ id: INIT_PRESET_ID, name: INIT_PRESET_NAME }, ...this.factory, ...this.presets];
  }

  private get currentIndex(): number {
    return Math.max(0, this.entries.findIndex((e) => e.id === this.currentId));
  }

  /** INIT or a factory preset: SAVE means save-as, no rename, no delete. */
  private get readOnly(): boolean {
    return this.currentId === INIT_PRESET_ID || this.factory.some((p) => p.id === this.currentId);
  }

  /** Shell feedback: a status word on the LCD (e.g. "FULL" on a refused write). */
  flash(text: string) {
    if (this.flashTimer !== null) clearTimeout(this.flashTimer);
    this.flashText = text;
    this.flashTimer = setTimeout(() => {
      this.flashTimer = null;
      this.flashText = null;
    }, FLASH_MS);
  }

  protected updated(changed: PropertyValues) {
    // The open landed (or the list moved under us): drop the pending view.
    if (changed.has("currentId") && this.pendingIndex !== null && this.stepTimer === null) {
      this.pendingIndex = null;
    }
    if (changed.has("editMode") && this.editMode) {
      this.input?.focus();
      this.input?.select();
    }
  }

  private dispatch(type: string, detail: Record<string, unknown> = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  // --- Stepping ---

  private step(delta: number) {
    if (this.editMode) return;
    // Unsaved work: the first press only warns; a second inside the window
    // proceeds (and the whole stepped run counts as one decision).
    if (this.dirty && this.pendingIndex === null && !this.discardArmed) {
      this.discardArmed = true;
      this.flash("UNSAVED");
      if (this.discardTimer !== null) clearTimeout(this.discardTimer);
      this.discardTimer = setTimeout(() => {
        this.discardTimer = null;
        this.discardArmed = false;
      }, DISCARD_WINDOW_MS);
      return;
    }
    const from = this.pendingIndex ?? this.currentIndex;
    const next = Math.max(0, Math.min(this.entries.length - 1, from + delta));
    if (next === from) return;
    this.flashText = null;
    this.pendingIndex = next;
    if (this.stepTimer !== null) clearTimeout(this.stepTimer);
    this.stepTimer = setTimeout(() => {
      this.stepTimer = null;
      this.discardArmed = false;
      const target = this.pendingIndex === null ? undefined : this.entries[this.pendingIndex];
      if (!target || target.id === this.currentId) {
        this.pendingIndex = null;
        return;
      }
      this.dispatch("preset-open", { id: target.id });
    }, STEP_DEBOUNCE_MS);
  }

  // --- Save / name editing ---

  private defaultName(): string {
    const names = new Set(this.presets.map((p) => p.name));
    let n = this.presets.length + 1;
    while (names.has(`PRESET ${n}`)) n++;
    return `PRESET ${n}`;
  }

  private onSave = () => {
    if (this.readOnly) {
      this.beginEdit("save-as");
      return;
    }
    this.dispatch("preset-save");
  };

  private beginEdit(mode: EditMode) {
    if (this.pendingIndex !== null) return;
    this.editMode = mode;
    this.editValue =
      mode === "rename" ? this.entries[this.currentIndex].name : this.defaultName();
  }

  private commitEdit() {
    const name = this.editValue.replace(/\s+/g, " ").trim().toUpperCase();
    const mode = this.editMode;
    this.editMode = null;
    if (!name || !mode) return;
    if (mode === "save-as") this.dispatch("preset-save-as", { name });
    else this.dispatch("preset-rename", { id: this.currentId, name });
  }

  private onInputKey = (e: KeyboardEvent) => {
    // Typing a name must never reach armed devices or transport shortcuts.
    e.stopPropagation();
    if (e.key === "Enter") this.commitEdit();
    else if (e.key === "Escape") this.editMode = null;
  };

  private onInputKeyUp = (e: KeyboardEvent) => e.stopPropagation();

  private onInput = (e: Event) => {
    this.editValue = (e.target as HTMLInputElement).value.toUpperCase();
  };

  private onLcdDblClick = () => {
    if (!this.readOnly) this.beginEdit("rename");
  };

  // --- Hold-to-delete (the rack's hold-to-eject idiom) ---

  private onDeleteDown = () => {
    if (this.readOnly) return;
    this.deleting = true;
    this.deleteTimer = setTimeout(() => {
      this.deleteTimer = null;
      this.deleting = false;
      this.dispatch("preset-delete", { id: this.currentId });
    }, HOLD_DELETE_MS);
  };

  private onDeleteCancel = () => {
    if (this.deleteTimer !== null) {
      clearTimeout(this.deleteTimer);
      this.deleteTimer = null;
    }
    this.deleting = false;
  };

  private lcdText(): string {
    if (this.flashText) return this.flashText;
    if (this.pendingIndex !== null) return this.entries[this.pendingIndex]?.name ?? "";
    const name = this.entries[this.currentIndex].name;
    return this.dirty ? `${name}*` : name;
  }

  render() {
    const index = this.pendingIndex ?? this.currentIndex;
    const last = this.entries.length - 1;
    const saveTitle = this.readOnly
      ? "Save as a new preset (built-in presets are never overwritten)"
      : this.dirty
        ? "Save the current preset"
        : "No unsaved changes";
    return html`
      <div class="presets">
        <button
          class="inc-btn"
          title="Previous preset"
          ?disabled=${index <= 0 || this.editMode !== null}
          @click=${() => this.step(-1)}
        >-</button>
        ${this.editMode
          ? html`<input
              class="lcd-input"
              .value=${this.editValue}
              maxlength=${PRESET_NAME_MAX}
              spellcheck="false"
              @input=${this.onInput}
              @keydown=${this.onInputKey}
              @keyup=${this.onInputKeyUp}
              @blur=${() => (this.editMode = null)}
            />`
          : html`<lcd-element
              class=${classMap({ pending: this.pendingIndex !== null, warn: this.flashText !== null })}
              title=${this.readOnly ? "Preset" : "Preset — double-click to rename"}
              .text=${this.lcdText()}
              @dblclick=${this.onLcdDblClick}
            ></lcd-element>`}
        <button
          class="inc-btn"
          title="Next preset"
          ?disabled=${index >= last || this.editMode !== null}
          @click=${() => this.step(1)}
        >+</button>
        <button
          class=${classMap({ "text-btn": true, pulse: this.discardArmed })}
          title=${saveTitle}
          ?disabled=${!this.dirty || this.editMode !== null}
          @click=${this.onSave}
        >SAVE</button>
        <button
          class="text-btn"
          title="Save as a new preset"
          ?disabled=${this.editMode !== null}
          @click=${() => this.beginEdit("save-as")}
        >SAVE AS</button>
        ${this.readOnly
          ? html`<button class="text-btn del-btn" disabled title="Built-in presets can't be deleted">DEL</button>`
          : html`<button
              class=${classMap({ "text-btn": true, "del-btn": true, holding: this.deleting })}
              title="Hold to delete this preset"
              ?disabled=${this.editMode !== null}
              @pointerdown=${this.onDeleteDown}
              @pointerup=${this.onDeleteCancel}
              @pointerleave=${this.onDeleteCancel}
            >DEL</button>`}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --lcd-screen-width: var(--preset-lcd-width, 124px);
      --lcd-font-size: var(--preset-lcd-font-size, 11px);
    }

    .presets {
      display: flex;
      align-items: center;
      gap: var(--preset-bar-gap, 4px);
      height: var(--preset-bar-height, 24px);
    }

    lcd-element {
      height: 100%;
      cursor: default;
    }

    lcd-element.pending {
      opacity: var(--preset-pending-opacity, 0.6);
    }

    lcd-element.warn {
      --lcd-text-color: var(--preset-warn-color, #d4554e);
    }

    .lcd-input {
      width: var(--lcd-screen-width);
      height: 100%;
      box-sizing: border-box;
      padding: 4px 6px;
      border: 1px solid var(--preset-edit-border-color, var(--lcd-text-color, #b4d455));
      border-radius: var(--lcd-screen-border-radius, 0);
      background: var(--lcd-screen-background, darkslategray);
      color: var(--lcd-text-color, #b4d455);
      font-family: "Silkscreen", monospace;
      font-size: var(--lcd-font-size);
      letter-spacing: 0.5px;
      text-align: center;
      text-transform: uppercase;
      outline: none;
    }

    .inc-btn,
    .text-btn {
      position: relative;
      overflow: hidden;
      height: 100%;
      padding: 0 8px;
      font-size: 0.6em;
      font-weight: 700;
      background: var(--dark-secondary, #192734);
      color: var(--lighter, #fff);
      border: 1px solid var(--light-secondary, #cbe2f3);
      border-radius: 3px;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    .inc-btn:disabled,
    .text-btn:disabled {
      opacity: var(--preset-ghost-opacity, 0.35);
      cursor: default;
    }

    .text-btn.pulse {
      animation: preset-pulse 0.5s ease-in-out infinite alternate;
    }

    @keyframes preset-pulse {
      from { border-color: var(--light-secondary, #cbe2f3); }
      to { border-color: var(--preset-warn-color, #d4554e); color: var(--preset-warn-color, #d4554e); }
    }

    /* Hold-to-delete fill: the rack's hold-to-eject sweep. */
    .del-btn::after {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--eject-fill-color, #d4554e);
      transform: scaleX(0);
      transform-origin: left;
      opacity: 0.85;
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    .del-btn.holding::after {
      animation: preset-del-fill 600ms linear forwards; /* = HOLD_DELETE_MS */
    }

    @keyframes preset-del-fill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
  `;
}
