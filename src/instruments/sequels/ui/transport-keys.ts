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

import { BANK_COUNT } from "../types";

export interface TransportKeyHandlers {
  togglePlayPause(): void;
  stop(): void;
  /** Digit 0-9: selects a pattern within the displayed bank. */
  selectSlot(slot: number): void;
  selectBank(bank: number): void;
  toggleRecord(): void;
  clearPattern(): void;
  moveCursor(delta: number): void;
  copyPattern(): void;
  pastePattern(): void;
}

/**
 * Document-level shortcuts for the sequencer.
 *
 * Deliberately claims no letter keys: the whole letter block belongs to
 * KeyboardController's note map, and record mode depends on it staying that
 * way. Matching is on `event.code`, so the digit row works on AZERTY (where
 * `event.key` for an unshifted "1" is "&").
 *
 *   Space          play / pause
 *   Shift+Space    stop
 *   0-9            select pattern within the bank
 *   Shift+0-3      select bank
 *   Enter          arm / disarm record
 *   Backspace      clear the current pattern
 *   Left / Right   move the edit cursor
 *   Ctrl/Cmd+C,V   copy / paste pattern
 */
export class TransportKeys {
  private handlers: TransportKeyHandlers | null = null;

  attach(handlers: TransportKeyHandlers): void {
    this.handlers = handlers;
    document.addEventListener("keydown", this.onKeyDown);
  }

  detach(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    this.handlers = null;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const handlers = this.handlers;
    if (!handlers || e.repeat || e.altKey) return;
    if (isEditable(e.composedPath()[0] ?? e.target)) return;

    const accel = e.ctrlKey || e.metaKey;

    if (accel) {
      // No preventDefault: an unhandled copy/paste of an empty selection is a
      // no-op anyway, and hijacking it would break copying text on the page.
      if (e.code === "KeyC") handlers.copyPattern();
      else if (e.code === "KeyV") handlers.pastePattern();
      return;
    }

    const digit = digitFromCode(e.code);
    if (digit !== -1) {
      e.preventDefault();
      if (e.shiftKey) {
        if (digit < BANK_COUNT) handlers.selectBank(digit);
      } else {
        handlers.selectSlot(digit);
      }
      return;
    }

    switch (e.code) {
      case "Space":
        // Without this the page scrolls, and a focused transport button would
        // fire its own click — toggling the transport twice.
        e.preventDefault();
        if (e.shiftKey) handlers.stop();
        else handlers.togglePlayPause();
        break;
      case "Enter":
      case "NumpadEnter":
        e.preventDefault();
        handlers.toggleRecord();
        break;
      case "Backspace":
        e.preventDefault();
        handlers.clearPattern();
        break;
      case "ArrowLeft":
        e.preventDefault();
        handlers.moveCursor(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        handlers.moveCursor(1);
        break;
    }
  };
}

/** "Digit4" / "Numpad4" -> 4, anything else -> -1. */
function digitFromCode(code: string): number {
  if (code.length === 6 && code.startsWith("Digit")) return code.charCodeAt(5) - 48;
  if (code.length === 7 && code.startsWith("Numpad")) return code.charCodeAt(6) - 48;
  return -1;
}

function isEditable(node: EventTarget | null | undefined): boolean {
  const el = node as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable === true
  );
}
