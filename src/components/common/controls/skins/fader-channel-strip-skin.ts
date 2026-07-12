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
import { html } from "lit";
import type { ControlState, FaderSkin } from "./types";

const TRACK_W = 14;
const THUMB_W = 30;
const THUMB_H = 16;
const SVG_W = THUMB_W + 20;
const TRACK_H = 120;
const SVG_H = TRACK_H + 20;

export class FaderChannelStripSkin implements FaderSkin {
  render(state: ControlState) {
    const travel = TRACK_H - THUMB_H;
    const thumbY = (1 - state.value) * travel;
    const cx = SVG_W / 2;

    return html`
      <svg
        class="fader-svg"
        viewBox="0 0 ${SVG_W} ${SVG_H}"
        shape-rendering="geometricPrecision"
      >
        <rect
          x=${cx - TRACK_W / 2}
          y="10"
          width=${TRACK_W}
          height=${TRACK_H}
          rx="3"
          style="fill: var(--control-handle-color, #192734); stroke: var(--control-top-color, #cbe2f3); stroke-width: 0.8; opacity: 0.6"
        />

        <rect
          x=${cx - TRACK_W / 2 + 1}
          y=${10 + thumbY + THUMB_H}
          width=${TRACK_W - 2}
          height=${Math.max(0, TRACK_H - thumbY - THUMB_H - 1)}
          rx="2"
          style="fill: var(--control-cursor-color, #fff); opacity: 0.12"
        />

        <rect
          x=${cx - THUMB_W / 2}
          y=${10 + thumbY}
          width=${THUMB_W}
          height=${THUMB_H}
          rx="3"
          style="fill: var(--control-top-color, #cbe2f3)"
        />
        <rect
          x=${cx - THUMB_W / 2 + 2}
          y=${10 + thumbY + 2}
          width=${THUMB_W - 4}
          height=${THUMB_H - 4}
          rx="2"
          style="fill: var(--control-handle-color, #192734)"
        />

        <line
          x1=${cx - 6}
          y1=${10 + thumbY + THUMB_H / 2}
          x2=${cx + 6}
          y2=${10 + thumbY + THUMB_H / 2}
          style="stroke: var(--control-cursor-color, #fff); stroke-width: 1.5; stroke-linecap: round"
        />
        <line
          x1=${cx - 5}
          y1=${10 + thumbY + THUMB_H / 2 - 3}
          x2=${cx + 5}
          y2=${10 + thumbY + THUMB_H / 2 - 3}
          style="stroke: var(--control-top-color, #cbe2f3); stroke-width: 0.8; stroke-linecap: round; opacity: 0.5"
        />
        <line
          x1=${cx - 5}
          y1=${10 + thumbY + THUMB_H / 2 + 3}
          x2=${cx + 5}
          y2=${10 + thumbY + THUMB_H / 2 + 3}
          style="stroke: var(--control-top-color, #cbe2f3); stroke-width: 0.8; stroke-linecap: round; opacity: 0.5"
        />
      </svg>
    `;
  }
}

export const faderChannelStripSkin = new FaderChannelStripSkin();
