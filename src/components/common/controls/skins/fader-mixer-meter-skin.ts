import { html } from "lit";
import type { ControlState, FaderSkin } from "./types";

const SVG_W = 20;
const TRACK_W = 14;
const TRACK_H = 100;
const PAD = 5;
const SVG_H = TRACK_H + 2 * PAD;
const LINE_W = SVG_W;

export class FaderMixerMeterSkin implements FaderSkin {
  render(state: ControlState) {
    const cx = SVG_W / 2;
    const trackX = cx - TRACK_W / 2;
    const gainY = PAD + (1 - state.value) * TRACK_H;

    return html`
      <svg
        class="fader-svg"
        viewBox="0 0 ${SVG_W} ${SVG_H}"
        shape-rendering="geometricPrecision"
      >
        <defs>
          <linearGradient id="meterGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="var(--mixer-meter-green, #6abf4b)" />
            <stop offset="60%" stop-color="var(--mixer-meter-green, #6abf4b)" />
            <stop offset="80%" stop-color="var(--mixer-meter-yellow, #d4c13a)" />
            <stop offset="100%" stop-color="var(--mixer-meter-red, #c44a3a)" />
          </linearGradient>
        </defs>

        <rect
          x=${trackX} y=${PAD}
          width=${TRACK_W} height=${TRACK_H}
          rx="2"
          style="fill: var(--mixer-meter-bg, #15202b)"
        />

        <rect
          x=${trackX} y=${PAD}
          width=${TRACK_W} height=${TRACK_H}
          rx="2"
          fill="url(#meterGrad)"
          style="transform-origin: ${cx}px ${PAD + TRACK_H}px; transform: scaleY(var(--meter-level, 0))"
        />

        <line
          x1=${cx - LINE_W / 2} y1=${gainY}
          x2=${cx + LINE_W / 2} y2=${gainY}
          style="stroke: var(--mixer-fader-thumb, #cbe2f3); stroke-width: 2; stroke-linecap: round"
        />
      </svg>
    `;
  }
}

export const faderMixerMeterSkin = new FaderMixerMeterSkin();
