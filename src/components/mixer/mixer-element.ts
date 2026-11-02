import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { MixerEngine, CHANNEL_COUNT } from "../../mixer";
import "./channel-strip";

@customElement("mixer-element")
export class MixerElement extends LitElement {
  @property({ attribute: false })
  engine?: MixerEngine;

  /** Dock fold state — owned by the shell (persisted with the session). */
  @property({ type: Boolean })
  collapsed = false;


  @state() private meterLevels: number[] = new Array(CHANNEL_COUNT + 2).fill(0);

  private rafId = 0;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    if (!this.collapsed) this.startMetering();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    cancelAnimationFrame(this.rafId);
  }

  private onVisibilityChange = () => {
    cancelAnimationFrame(this.rafId);
    if (!document.hidden && !this.collapsed) this.startMetering();
  };

  // Meters only draw while the dock is open — a folded mixer keeps playing
  // but spends no frames on analysers.
  protected updated(changed: PropertyValues): void {
    if (changed.has("collapsed")) {
      cancelAnimationFrame(this.rafId);
      if (!this.collapsed && !document.hidden) this.startMetering();
    }
  }

  private onFoldToggle = () => {
    this.dispatchEvent(new CustomEvent("mixer-collapse-changed", {
      detail: { collapsed: !this.collapsed },
      bubbles: true,
      composed: true,
    }));
  };

  private startMetering(): void {
    const update = () => {
      if (this.engine) {
        // Only routed channels carry signal, so the rest report 0 without an
        // analyser read; and when no level moved, skip the state write so a
        // silent mixer does not re-render its strips every frame.
        const active = this.engine.getActiveChannels();
        const levels = new Array(CHANNEL_COUNT + 2).fill(0);
        for (const i of active) {
          const [l, r] = this.engine.getMeterLevel(i);
          levels[i] = Math.max(l, r);
        }
        const [ml, mr] = this.engine.getMasterMeterLevel();
        levels[CHANNEL_COUNT] = Math.max(ml, mr);
        const [cl, cr] = this.engine.getClickMeterLevel();
        levels[CHANNEL_COUNT + 1] = Math.max(cl, cr);
        if (levels.some((v, i) => v !== this.meterLevels[i])) {
          this.meterLevels = levels;
        }
      }
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  private onGainChange(e: CustomEvent) {
    const { index, value } = e.detail;
    if (index === -1) {
      this.engine?.setMasterGain(value);
    } else if (index === -2) {
      this.engine?.setClickGain(value);
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
          <button
            class="fold-btn"
            title=${this.collapsed ? "unfold mixer" : "fold mixer"}
            @click=${this.onFoldToggle}
          >${this.collapsed ? "▸" : "▾"}</button>
          <span class="mixer-label">MIXER</span>
        </div>
        ${this.collapsed ? nothing : html`
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
              .channelIndex=${-2}
              .master=${true}
              .label=${"CLICK"}
              .gain=${state.clickGain}
              .pan=${0}
              .mute=${false}
              .solo=${false}
              .meterLevel=${this.meterLevels[CHANNEL_COUNT + 1] ?? 0}
              @gain-change=${this.onGainChange}
            ></channel-strip>
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
        </div>`}
      </div>
    `;
  }

  static styles = css`
    /* A block of the DAW core dock (the dock draws the shared border). */
    :host {
      display: block;
      width: 100%;
    }

    .mixer-panel {
      display: flex;
      flex-direction: column;
    }

    .mixer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 1.5em;
      background: var(--main-panel-color, #181818);
    }

    .fold-btn {
      width: 20px;
      height: 20px;
      padding: 0;
      background: transparent;
      color: var(--main-panel-label-color, #fff);
      border: none;
      cursor: pointer;
      opacity: 0.7;
    }

    .fold-btn:hover {
      opacity: 1;
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
      overflow: hidden;
    }

    /* Strips share the full dock width — contiguous desk cells, no gaps,
     * falling back to horizontal scrolling when squeezed. */
    .channels-scroll > channel-strip {
      flex: 1 1 0;
      min-width: 44px;
    }

    .master-section > channel-strip {
      width: 64px;
    }

    .channels-scroll {
      display: flex;
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
      display: flex;
      border-left: 2px solid var(--mixer-fader-track, #2b3844);
      flex-shrink: 0;
    }
  `;
}
