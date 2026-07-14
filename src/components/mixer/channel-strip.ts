import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { faderMixerMeterSkin } from "../common/controls/skins/fader-mixer-meter-skin";
import "../common/controls/fader-element";

const FADER_MAX = 127;

@customElement("channel-strip")
export class ChannelStrip extends LitElement {
  @property({ type: Number }) channelIndex = 0;
  @property({ type: String }) label = "";
  @property({ type: Number }) gain = 0.8;
  @property({ type: Number }) pan = 0;
  @property({ type: Boolean }) mute = false;
  @property({ type: Boolean }) solo = false;
  @property({ type: Number }) meterLevel = 0;
  @property({ type: Boolean }) master = false;

  private onFaderChange(e: CustomEvent) {
    const value = e.detail.value / FADER_MAX;
    this.dispatchEvent(new CustomEvent("gain-change", { detail: { index: this.channelIndex, value } }));
  }

  private onPanInput(e: InputEvent) {
    const value = parseFloat((e.target as HTMLInputElement).value);
    this.dispatchEvent(new CustomEvent("pan-change", { detail: { index: this.channelIndex, value } }));
  }

  private onMuteClick() {
    this.dispatchEvent(new CustomEvent("mute-change", { detail: { index: this.channelIndex, value: !this.mute } }));
  }

  private onSoloClick() {
    this.dispatchEvent(new CustomEvent("solo-change", { detail: { index: this.channelIndex, value: !this.solo } }));
  }

  private get dbDisplay(): string {
    if (this.gain <= 0) return "-\u221E";
    const db = 20 * Math.log10(this.gain);
    return db.toFixed(1);
  }

  render() {
    const muteClasses = { "ctrl-btn": true, mute: true, active: this.mute };
    const soloClasses = { "ctrl-btn": true, solo: true, active: this.solo };
    const faderValue = Math.round(this.gain * FADER_MAX);

    return html`
      <div class="strip ${this.master ? "master" : ""}">
        <div class="label">${this.master ? "MASTER" : this.label || `CH ${this.channelIndex + 1}`}</div>
        <fader-element
          style="--meter-level: ${this.meterLevel}"
          .value=${faderValue}
          .skin=${faderMixerMeterSkin}
          @change=${this.onFaderChange}
        ></fader-element>
        <div class="pan-row">
          <input type="range" class="pan-slider"
            min="-1" max="1" step="0.01"
            .value=${String(this.pan)}
            @input=${this.onPanInput}
          />
        </div>
        <div class="btn-row">
          <button class=${classMap(muteClasses)} @click=${this.onMuteClick}>M</button>
          <button class=${classMap(soloClasses)} @click=${this.onSoloClick}>S</button>
        </div>
        <div class="db-readout">${this.dbDisplay} dB</div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .strip {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 50px;
      background: var(--mixer-strip-bg, #192734);
      border: var(--mixer-strip-border, 1px solid #2b3844);
      border-radius: 3px;
      padding: 4px 2px;
      gap: 4px;
      box-sizing: border-box;
    }

    .strip.master {
      width: 60px;
      border-color: var(--mixer-fader-thumb, #cbe2f3);
    }

    .label {
      font-family: "Space Mono", monospace;
      font-size: 8px;
      color: var(--mixer-label-color, #cbe2f3);
      text-transform: uppercase;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      line-height: 1.2;
      min-height: 12px;
    }

    fader-element {
      --fader-width: 20px;
      --fader-height: 110px;
    }

    .pan-row {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .pan-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 40px;
      height: 10px;
      background: var(--mixer-fader-track, #2b3844);
      border-radius: 3px;
      outline: none;
    }

    .pan-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 8px;
      height: 12px;
      background: var(--mixer-fader-thumb, #cbe2f3);
      border-radius: 2px;
      cursor: pointer;
    }

    .pan-slider::-moz-range-thumb {
      width: 8px;
      height: 12px;
      background: var(--mixer-fader-thumb, #cbe2f3);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }

    .btn-row {
      display: flex;
      gap: 2px;
    }

    .ctrl-btn {
      font-family: "Space Mono", monospace;
      font-size: 9px;
      font-weight: bold;
      width: 20px;
      height: 18px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background: var(--mixer-btn-bg, #2b3844);
      color: var(--mixer-btn-color, #cbe2f3);
      padding: 0;
      line-height: 18px;
      text-align: center;
    }

    .ctrl-btn.mute.active {
      background: var(--mixer-mute-active, #c44a3a);
      color: #fff;
    }

    .ctrl-btn.solo.active {
      background: var(--mixer-solo-active, #b4d455);
      color: #111;
    }

    .db-readout {
      font-family: "Space Mono", monospace;
      font-size: 8px;
      color: var(--mixer-db-color, #cbe2f3);
      text-align: center;
      white-space: nowrap;
    }
  `;
}
