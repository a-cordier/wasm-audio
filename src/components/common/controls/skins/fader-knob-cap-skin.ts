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

const GROOVE_W = 8;
const THUMB_R = 14;
const SVG_W = THUMB_R * 2 + 16;
const TRACK_H = 120;
const SVG_H = TRACK_H + 20;

export class FaderKnobCapSkin implements FaderSkin {
  render(state: ControlState) {
    const travel = TRACK_H - THUMB_R * 2;
    const thumbY = THUMB_R + (1 - state.value) * travel;
    const cx = SVG_W / 2;
    const grooveTop = 10 + THUMB_R;
    const grooveH = TRACK_H - THUMB_R * 2;

    return html`
      <svg
        class="fader-svg"
        viewBox="0 0 ${SVG_W} ${SVG_H}"
        shape-rendering="geometricPrecision"
      >
        <defs>
          <clipPath id="groove-clip">
            <rect x=${cx - GROOVE_W / 2} y=${grooveTop} width=${GROOVE_W} height=${grooveH} rx="3" />
          </clipPath>
        </defs>

        <rect
          x=${cx - GROOVE_W / 2}
          y=${grooveTop}
          width=${GROOVE_W}
          height=${grooveH}
          rx="3"
          style="fill: var(--control-handle-color, #192734); stroke: var(--control-top-color, #cbe2f3); stroke-width: 0.6; opacity: 0.5"
        />

        <g clip-path="url(#groove-clip)">
          <rect
            x=${cx - GROOVE_W / 2}
            y=${10 + thumbY}
            width=${GROOVE_W}
            height=${grooveH - (thumbY - THUMB_R) + THUMB_R}
            style="fill: var(--control-cursor-color, #fff); opacity: 0.15"
          />
        </g>

        <circle
          cx=${cx}
          cy=${10 + thumbY}
          r=${THUMB_R}
          style="fill: var(--control-top-color, #cbe2f3)"
        />
        <circle
          cx=${cx}
          cy=${10 + thumbY}
          r=${THUMB_R - 3}
          style="fill: var(--control-handle-color, #192734)"
        />

        <line
          x1=${cx}
          y1=${10 + thumbY - THUMB_R + 5}
          x2=${cx}
          y2=${10 + thumbY - 2}
          style="stroke: var(--control-cursor-color, #fff); stroke-width: 2; stroke-linecap: round"
        />
      </svg>
    `;
  }
}

export const faderKnobCapSkin = new FaderKnobCapSkin();
