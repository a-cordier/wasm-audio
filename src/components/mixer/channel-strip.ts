import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { faderMixerMeterSkin } from "../common/controls/skins/fader-mixer-meter-skin";
import {
  faderToGain,
  gainToFader,
  EqBand,
  EQ_GAIN_DB,
  EQ_MID_FREQ_MIN,
  EQ_MID_FREQ_MAX,
  EQ_MID_FREQ_DEFAULT,
} from "../../mixer";
import "../common/controls/fader-element";
import "../common/controls/knob-element";

const FADER_MAX = 127;
/** GR LED threshold: light once the limiter actually bites. */
const GR_LIT_DB = -0.5;

/** One SEND knob's worth of strip data (one per mounted effect loop). */
export interface StripSend {
  busId: string;
  label: string;
  /** The effect's accent — ties the knob to its return strip visually. */
  accent?: string;
  level: number;
  /** True on the loop's own return strip — that knob ghosts (feedback guard). */
  self: boolean;
}

// The FREQ knob sweeps the mid exponentially — equal throw per octave.
const FREQ_LOG_SPAN = Math.log(EQ_MID_FREQ_MAX / EQ_MID_FREQ_MIN);
const freqToKnob = (hz: number) => Math.log(hz / EQ_MID_FREQ_MIN) / FREQ_LOG_SPAN;
const knobToFreq = (v: number) => Math.round(EQ_MID_FREQ_MIN * Math.exp(v * FREQ_LOG_SPAN));

@customElement("channel-strip")
export class ChannelStrip extends LitElement {
  /** Channel identity — a slot id, or the reserved MASTER/CLICK bus ids. */
  @property({ type: String }) channelId = "";
  @property({ type: String }) label = "";
  /** Device accent (CSS color or var()) — tints the nameplate underline. */
  @property({ type: String }) accent = "";
  @property({ type: Number }) gain = 0.8;
  @property({ type: Number }) pan = 0;
  @property({ type: Boolean }) mute = false;
  @property({ type: Boolean }) solo = false;
  @property({ type: Number }) meterLevel = 0;
  @property({ type: Boolean }) master = false;
  /** MASTER only: show the limiter's gain-reduction LED. */
  @property({ type: Boolean }) limiter = false;
  /** Limiter gain reduction in dB (negative while limiting). */
  @property({ type: Number }) gainReduction = 0;
  /** 3-band EQ (dB gains + mid center Hz) — ghosted on the fixed buses. */
  @property({ type: Number }) eqLow = 0;
  @property({ type: Number }) eqMid = 0;
  @property({ type: Number }) eqMidFreq = EQ_MID_FREQ_DEFAULT;
  @property({ type: Number }) eqHigh = 0;
  /** Effect-loop sends, one knob each (fresh array per board render). */
  @property({ attribute: false }) sends: StripSend[] = [];
  /** True when this strip is an effect loop's return. */
  @property({ type: Boolean }) isReturn = false;

  private onFaderChange(e: CustomEvent) {
    // Fader THROW -> amplitude through the desk law (+6 dB up top).
    const value = faderToGain(e.detail.value / FADER_MAX);
    this.dispatchEvent(new CustomEvent("gain-change", { detail: { id: this.channelId, value } }));
  }

  private onPanInput(e: InputEvent) {
    const value = parseFloat((e.target as HTMLInputElement).value);
    this.dispatchEvent(new CustomEvent("pan-change", { detail: { id: this.channelId, value } }));
  }

  private onMuteClick() {
    this.dispatchEvent(new CustomEvent("mute-change", { detail: { id: this.channelId, value: !this.mute } }));
  }

  private onSoloClick() {
    this.dispatchEvent(new CustomEvent("solo-change", { detail: { id: this.channelId, value: !this.solo } }));
  }

  private onEqChange(band: EqBand, value: number) {
    this.dispatchEvent(new CustomEvent("eq-change", { detail: { id: this.channelId, band, value } }));
  }

  private onSendChange(busId: string, value: number) {
    this.dispatchEvent(new CustomEvent("send-change", { detail: { id: this.channelId, busId, value } }));
  }

  private renderSendKnob(send: StripSend) {
    const ghosted = this.master || this.isReturn || send.self;
    const title = this.master
      ? "not available on this bus"
      : this.isReturn || send.self
        ? "a return strip never sends (feedback guard)"
        : `send to ${send.label} — ${Math.round(send.level * 100)}%`;
    return html`
      <knob-element
        style=${send.accent ? `--control-cursor-color: ${send.accent}` : ""}
        .label=${send.label}
        .range=${{ min: 0, max: 1 }}
        .step=${0.02}
        .value=${ghosted ? 0 : send.level}
        ?disabled=${ghosted}
        title=${title}
        @change=${(e: CustomEvent) => this.onSendChange(send.busId, e.detail.value)}
      ></knob-element>
    `;
  }

  private renderEqKnob(label: string, band: EqBand, value: number, busTitle: string) {
    // The FREQ knob carries a normalized 0..1 value (log sweep); gain knobs
    // carry dB directly. Alt-drag is the fine adjust, as everywhere.
    const isFreq = band === "midFreq";
    return html`
      <knob-element
        .label=${label}
        .range=${isFreq ? { min: 0, max: 1 } : { min: -EQ_GAIN_DB, max: EQ_GAIN_DB }}
        .step=${isFreq ? 0.02 : 0.5}
        .value=${isFreq ? freqToKnob(value) : value}
        ?disabled=${this.master}
        title=${this.master ? busTitle : (isFreq ? `${Math.round(value)} Hz` : `${value.toFixed(1)} dB`)}
        @change=${(e: CustomEvent) =>
          this.onEqChange(band, isFreq ? knobToFreq(e.detail.value) : e.detail.value)}
      ></knob-element>
    `;
  }

  private get dbDisplay(): string {
    if (this.gain <= 0) return "-∞";
    const db = 20 * Math.log10(this.gain);
    return db >= 0.05 ? `+${db.toFixed(1)}` : db.toFixed(1);
  }

  render() {
    const muteClasses = { "ctrl-btn": true, mute: true, active: this.mute };
    const soloClasses = { "ctrl-btn": true, solo: true, active: this.solo };
    const faderValue = Math.round(gainToFader(this.gain) * FADER_MAX);
    // Conditional relevance: the fixed buses have no pan/mute/solo — the
    // controls stay in place and ghost rather than leave the layout.
    const busTitle = this.master ? "not available on this bus" : "";

    return html`
      <div class="strip ${this.master ? "master" : ""}">
        <div
          class="label"
          style=${this.accent ? `border-bottom-color: ${this.accent}` : ""}
        >${this.isReturn ? "⏎ " : ""}${this.master ? (this.label || "MASTER") : this.label}</div>
        <div class="eq-zone">
          ${this.renderEqKnob("HI", "high", this.eqHigh, busTitle)}
          ${this.renderEqKnob("MID", "mid", this.eqMid, busTitle)}
          ${this.renderEqKnob("FREQ", "midFreq", this.eqMidFreq, busTitle)}
          ${this.renderEqKnob("LO", "low", this.eqLow, busTitle)}
        </div>
        ${this.sends.length > 0
          ? html`<div class="send-zone">
              <div class="zone-caption">SENDS</div>
              ${this.sends.map((s) => this.renderSendKnob(s))}
            </div>`
          : nothing}
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
            ?disabled=${this.master}
            title=${busTitle}
            @input=${this.onPanInput}
          />
        </div>
        <div class="btn-row">
          <button class=${classMap(muteClasses)} ?disabled=${this.master} title=${busTitle} @click=${this.onMuteClick}>M</button>
          <button class=${classMap(soloClasses)} ?disabled=${this.master} title=${busTitle} @click=${this.onSoloClick}>S</button>
          ${this.limiter
            ? html`<span
                class=${classMap({ "gr-led": true, lit: this.gainReduction < GR_LIT_DB })}
                title="limiter gain reduction"
              ></span>`
            : nothing}
        </div>
        <div class="db-readout">${this.dbDisplay} dB</div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      user-select: none;
      height: 100%;
    }

    /* Hardware-desk strips: contiguous cells divided by hairlines — the
     * strip fills whatever width its console cell gives it. */
    .strip {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100%;
      background: var(--mixer-strip-bg, #192734);
      border-right: var(--mixer-strip-border, 1px solid #2b3844);
      padding: 4px 2px;
      gap: 4px;
      box-sizing: border-box;
    }

    .strip.master {
      background: color-mix(in srgb, var(--mixer-strip-bg, #192734) 80%, var(--mixer-fader-thumb, #cbe2f3) 6%);
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
      border-bottom: 2px solid transparent;
      box-sizing: border-box;
    }

    /* EQ zone: the strip's insert section, tinted by function (camaïeu) —
     * a vertical knob column, as on a hardware desk. */
    .eq-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: 100%;
      padding: 4px 0 2px;
      background: var(--mixer-eq-zone-bg, #1c2a38);
      border-radius: 2px;
      --knob-size: 22px;
      --control-label-font-size: 7px;
      --control-label-color: var(--mixer-label-color, #cbe2f3);
      --control-cursor-color: var(--mixer-fader-thumb, #cbe2f3);
    }

    /* Send zone: one knob per effect loop, its own functional tint. */
    .send-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: 100%;
      padding: 4px 0 2px;
      background: var(--mixer-send-zone-bg, #22303c);
      border-radius: 2px;
      --knob-size: 22px;
      --control-label-font-size: 7px;
      --control-label-color: var(--mixer-label-color, #cbe2f3);
      --control-cursor-color: var(--mixer-fader-thumb, #cbe2f3);
    }

    .send-zone .label,
    .send-zone knob-element {
      max-width: 100%;
    }

    .zone-caption {
      font-family: "Space Mono", monospace;
      font-size: 6px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: var(--mixer-label-color, #cbe2f3);
      opacity: 0.55;
      line-height: 1;
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

    .pan-slider:disabled {
      opacity: 0.3;
      cursor: default;
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

    .ctrl-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }

    .ctrl-btn.mute.active {
      background: var(--mixer-mute-active, #c44a3a);
      color: #fff;
    }

    .ctrl-btn.solo.active {
      background: var(--mixer-solo-active, #b4d455);
      color: #111;
    }

    .gr-led {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      align-self: center;
      background: var(--mixer-meter-bg, #0d1117);
      border: 1px solid var(--mixer-btn-bg, #2b3844);
      box-sizing: border-box;
    }

    .gr-led.lit {
      background: var(--mixer-limiter-led, #d4913a);
      border-color: var(--mixer-limiter-led, #d4913a);
      box-shadow: 0 0 4px var(--mixer-limiter-led, #d4913a);
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
