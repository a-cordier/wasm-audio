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
import { html, svg } from "lit";
import type { ControlState, FaderSkin } from "./types";

const TRACK_W = 28;
const SEG_COUNT = 16;
const SEG_GAP = 2;
const SVG_W = TRACK_W + 16;
const TRACK_H = 120;
const SVG_H = TRACK_H + 20;

export class FaderLedStripSkin implements FaderSkin {
  render(state: ControlState) {
    const segH = (TRACK_H - 8 - (SEG_COUNT - 1) * SEG_GAP) / SEG_COUNT;
    const litSegs = Math.round(state.value * SEG_COUNT);
    const posY = 10 + (1 - state.value) * (TRACK_H - 4) + 2;

    const segments = Array.from({ length: SEG_COUNT }, (_, i) => {
      const segIdx = SEG_COUNT - 1 - i;
      const isLit = segIdx < litSegs;
      const y = 10 + i * (segH + SEG_GAP) + 2;
      return svg`<rect
        x="10"
        y=${y}
        width=${TRACK_W - 4}
        height=${segH}
        rx="1"
        style="fill: var(${isLit ? "--lcd-led-on-color, #b4d455" : "--lcd-led-off-color, rgba(180, 212, 85, 0.08)"})"
      />`;
    });

    return html`
      <svg
        class="fader-svg"
        viewBox="0 0 ${SVG_W} ${SVG_H}"
        shape-rendering="geometricPrecision"
      >
        <rect
          x="6"
          y="8"
          width=${TRACK_W + 4}
          height=${TRACK_H + 4}
          rx="4"
          style="fill: var(--control-handle-color, #192734); stroke: var(--control-top-color, #cbe2f3); stroke-width: 0.6; opacity: 0.6"
        />

        ${segments}

        <line
          x1="6"
          y1=${posY}
          x2=${TRACK_W + 10}
          y2=${posY}
          style="stroke: var(--control-cursor-color, #fff); stroke-width: 2; stroke-linecap: round"
        />
      </svg>
    `;
  }
}

export const faderLedStripSkin = new FaderLedStripSkin();
