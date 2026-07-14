import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { MixerEngine, CHANNEL_COUNT } from "../../mixer";
import "./channel-strip";

@customElement("mixer-element")
export class MixerElement extends LitElement {
  @property({ attribute: false })
  engine?: MixerEngine;

  @state() private meterLevels: number[] = new Array(CHANNEL_COUNT + 1).fill(0);

  private rafId = 0;

  connectedCallback(): void {
    super.connectedCallback();
    this.startMetering();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.rafId);
  }

  private startMetering(): void {
    const update = () => {
      if (this.engine) {
        const levels = new Array(CHANNEL_COUNT + 1);
        for (let i = 0; i < CHANNEL_COUNT; i++) {
          const [l, r] = this.engine.getMeterLevel(i);
          levels[i] = Math.max(l, r);
        }
        const [ml, mr] = this.engine.getMasterMeterLevel();
        levels[CHANNEL_COUNT] = Math.max(ml, mr);
        this.meterLevels = levels;
      }
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  private onGainChange(e: CustomEvent) {
    const { index, value } = e.detail;
    if (index === -1) {
      this.engine?.setMasterGain(value);
    } else {
      this.engine?.setGain(index, value);
    }
    this.requestUpdate();
  }

  private onPanChange(e: CustomEvent) {
    const { index, value } = e.detail;
    this.engine?.setPan(index, value);
    this.requestUpdate();
  }

  private onMuteChange(e: CustomEvent) {
    const { index, value } = e.detail;
    this.engine?.setMute(index, value);
    this.requestUpdate();
  }

  private onSoloChange(e: CustomEvent) {
    const { index, value } = e.detail;
    this.engine?.setSolo(index, value);
    this.requestUpdate();
  }

  render() {
    const state = this.engine?.state;
    if (!state) return html``;

    return html`
      <div class="mixer-panel">
        <div class="mixer-header">
          <span class="mixer-label">MIXER</span>
        </div>
        <div class="mixer-body">
          <div class="channels-scroll">
            ${state.channels.map(
              (ch, i) => html`
                <channel-strip
                  .channelIndex=${i}
                  .label=${ch.label}
                  .gain=${ch.gain}
                  .pan=${ch.pan}
                  .mute=${ch.mute}
                  .solo=${ch.solo}
                  .meterLevel=${this.meterLevels[i] ?? 0}
                  @gain-change=${this.onGainChange}
                  @pan-change=${this.onPanChange}
                  @mute-change=${this.onMuteChange}
                  @solo-change=${this.onSoloChange}
                ></channel-strip>
              `
            )}
          </div>
          <div class="master-section">
            <channel-strip
              .channelIndex=${-1}
              .master=${true}
              .gain=${state.masterGain}
              .pan=${0}
              .mute=${false}
              .solo=${false}
              .meterLevel=${this.meterLevels[CHANNEL_COUNT] ?? 0}
              @gain-change=${this.onGainChange}
            ></channel-strip>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: calc(650px + 3em);
      max-width: 100%;
      margin: 0 auto;
    }

    .mixer-panel {
      display: flex;
      flex-direction: column;
    }

    .mixer-header {
      display: flex;
      align-items: center;
      padding: 8px 1.5em;
      background: var(--main-panel-color, #181818);
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .mixer-label {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 1.1em;
      font-weight: 700;
      color: var(--main-panel-label-color, #fff);
      letter-spacing: 0.08em;
    }

    .mixer-body {
      display: flex;
      background: var(--mixer-bg, #141414);
      padding: 8px;
      gap: 6px;
      border-radius: 0 0 0.5rem 0.5rem;
      overflow: hidden;
    }

    .channels-scroll {
      display: flex;
      gap: 3px;
      overflow-x: auto;
      overflow-y: hidden;
      flex: 1;
      scrollbar-width: thin;
      scrollbar-color: var(--mixer-fader-track, #2b3844) transparent;
    }

    .channels-scroll::-webkit-scrollbar {
      height: 4px;
    }

    .channels-scroll::-webkit-scrollbar-thumb {
      background: var(--mixer-fader-track, #2b3844);
      border-radius: 2px;
    }

    .master-section {
      border-left: 1px solid var(--mixer-fader-track, #2b3844);
      padding-left: 6px;
      flex-shrink: 0;
    }
  `;
}
