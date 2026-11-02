import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { MixerEngine, MASTER_ID, CLICK_ID, MAX_CHANNELS } from "../../mixer";
import "./channel-strip";
import "../device-picker";
import { DevicePicker, PickerAnchor } from "../device-picker";

@customElement("mixer-element")
export class MixerElement extends LitElement {
  @property({ attribute: false })
  engine?: MixerEngine;

  /** Dock fold state — owned by the shell (persisted with the session). */
  @property({ type: Boolean })
  collapsed = false;

  /** Peak level per strip id (slot ids + the MASTER/CLICK bus ids). */
  @state() private meterLevels = new Map<string, number>();

  private rafId = 0;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    if (!this.collapsed) this.startMetering();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.engine?.removeEventListener("channels-changed", this.onChannelsChanged);
    cancelAnimationFrame(this.rafId);
  }

  private onVisibilityChange = () => {
    cancelAnimationFrame(this.rafId);
    if (!document.hidden && !this.collapsed) this.startMetering();
  };

  /** Strips follow mount/unmount — the engine says when the list moved. */
  private onChannelsChanged = () => {
    this.requestUpdate();
  };

  // Meters only draw while the dock is open — a folded mixer keeps playing
  // but spends no frames on analysers.
  protected updated(changed: PropertyValues): void {
    if (changed.has("engine")) {
      (changed.get("engine") as MixerEngine | undefined)?.removeEventListener(
        "channels-changed",
        this.onChannelsChanged
      );
      this.engine?.addEventListener("channels-changed", this.onChannelsChanged);
    }
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
      const engine = this.engine;
      if (engine) {
        // Every strip has a mounted device behind it, so read them all; when
        // no level moved, skip the state write so a silent mixer does not
        // re-render its strips every frame.
        const next = new Map<string, number>();
        for (const ch of engine.channels) {
          const [l, r] = engine.getMeterLevel(ch.slotId);
          next.set(ch.slotId, Math.max(l, r));
        }
        const [ml, mr] = engine.getMasterMeterLevel();
        next.set(MASTER_ID, Math.max(ml, mr));
        const [cl, cr] = engine.getClickMeterLevel();
        next.set(CLICK_ID, Math.max(cl, cr));
        // The limiter's gain reduction (dB, negative) rides the same frame
        // loop — it drives the MASTER strip's GR LED.
        next.set("gr", engine.getLimiterReduction());

        let changed = next.size !== this.meterLevels.size;
        if (!changed) {
          for (const [id, level] of next) {
            if (this.meterLevels.get(id) !== level) {
              changed = true;
              break;
            }
          }
        }
        if (changed) this.meterLevels = next;
      }
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  // Strip edits land in the engine, then bubble a composed "change" so the
  // shell snapshots the session (mixer state persists with the slots).
  private notifyMixerChanged() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  private onGainChange(e: CustomEvent) {
    const { id, value } = e.detail;
    if (id === MASTER_ID) {
      this.engine?.setMasterGain(value);
    } else if (id === CLICK_ID) {
      this.engine?.setClickGain(value);
    } else {
      this.engine?.setGain(id, value);
    }
    this.notifyMixerChanged();
    this.requestUpdate();
  }

  private onPanChange(e: CustomEvent) {
    const { id, value } = e.detail;
    this.engine?.setPan(id, value);
    this.notifyMixerChanged();
    this.requestUpdate();
  }

  private onMuteChange(e: CustomEvent) {
    const { id, value } = e.detail;
    this.engine?.setMute(id, value);
    this.notifyMixerChanged();
    this.requestUpdate();
  }

  private onSoloChange(e: CustomEvent) {
    const { id, value } = e.detail;
    this.engine?.setSolo(id, value);
    this.notifyMixerChanged();
    this.requestUpdate();
  }

  // --- Prepared channels: the unused desk capacity stays visible ---
  // Empty strips pad the board to MAX_CHANNELS, mirroring the rack's
  // prepared "+" slots: each is a drop target for a device dragged off the
  // rail, and a BUTTON — clicking pops the shared device-picker over the
  // cell and picking mounts there (the strip takes the first prepared cell).

  @state()
  private ghostOverIndex = -1;

  @state()
  private pickerAnchor: PickerAnchor | null = null;

  private static isPluginDrag(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes("text/x-plugin-id") ?? false;
  }

  private onGhostDragOver(e: DragEvent, index: number) {
    if (!MixerElement.isPluginDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    if (this.ghostOverIndex !== index) this.ghostOverIndex = index;
  }

  private onGhostDrop = (e: DragEvent) => {
    if (!MixerElement.isPluginDrag(e)) return;
    e.preventDefault();
    this.ghostOverIndex = -1;
    const pluginId = e.dataTransfer?.getData("text/x-plugin-id");
    if (!pluginId) return;
    this.mountPicked(pluginId);
  };

  private mountPicked(pluginId: string) {
    this.dispatchEvent(new CustomEvent("device-mount", {
      detail: { pluginId },
      bubbles: true,
      composed: true,
    }));
  }

  private onGhostClick(e: MouseEvent) {
    this.pickerAnchor = DevicePicker.anchorFor((e.currentTarget as HTMLElement).getBoundingClientRect());
  }

  private closePicker = () => {
    if (this.pickerAnchor !== null) this.pickerAnchor = null;
  };

  private onPickerPick = (e: CustomEvent<{ pluginId: string }>) => {
    e.stopPropagation();
    this.closePicker();
    this.mountPicked(e.detail.pluginId);
  };

  private renderGhostStrips(used: number) {
    const count = Math.max(0, MAX_CHANNELS - used);
    return Array.from({ length: count }, (_, i) => html`
      <button
        class=${classMap({ "ghost-strip": true, over: this.ghostOverIndex === i })}
        title="add a device — click, or drop one from the rail"
        @click=${this.onGhostClick}
        @dragover=${(e: DragEvent) => this.onGhostDragOver(e, i)}
        @dragleave=${() => { if (this.ghostOverIndex === i) this.ghostOverIndex = -1; }}
        @drop=${this.onGhostDrop}
      >
        <span class="ghost-plus">+</span>
      </button>
    `);
  }

  render() {
    const engine = this.engine;
    if (!engine) return html``;

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
            ${repeat(engine.channels, (ch) => ch.slotId, (ch) => html`
              <channel-strip
                .channelId=${ch.slotId}
                .label=${ch.label}
                .accent=${ch.accent ?? ""}
                .gain=${ch.strip.gain}
                .pan=${ch.strip.pan}
                .mute=${ch.strip.mute}
                .solo=${ch.strip.solo}
                .meterLevel=${this.meterLevels.get(ch.slotId) ?? 0}
                @gain-change=${this.onGainChange}
                @pan-change=${this.onPanChange}
                @mute-change=${this.onMuteChange}
                @solo-change=${this.onSoloChange}
              ></channel-strip>
            `)}
            ${this.renderGhostStrips(engine.channels.length)}
          </div>
          <div class="master-section">
            <channel-strip
              .channelId=${CLICK_ID}
              .master=${true}
              .label=${"CLICK"}
              .gain=${engine.clickGain}
              .pan=${0}
              .mute=${false}
              .solo=${false}
              .meterLevel=${this.meterLevels.get(CLICK_ID) ?? 0}
              @gain-change=${this.onGainChange}
            ></channel-strip>
            <channel-strip
              .channelId=${MASTER_ID}
              .master=${true}
              .limiter=${true}
              .gainReduction=${this.meterLevels.get("gr") ?? 0}
              .gain=${engine.masterGain}
              .pan=${0}
              .mute=${false}
              .solo=${false}
              .meterLevel=${this.meterLevels.get(MASTER_ID) ?? 0}
              @gain-change=${this.onGainChange}
            ></channel-strip>
          </div>
        </div>`}
        <device-picker
          heading="ADD TO MIXER"
          .anchor=${this.pickerAnchor}
          .omitKinds=${["sequencer"] as const}
          @device-pick=${this.onPickerPick}
          @picker-close=${this.closePicker}
        ></device-picker>
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

    /* Strips share the dock width — contiguous desk cells, no gaps, growing
     * only to the desk-cell cap (a two-device board is not two huge strips)
     * and falling back to horizontal scrolling when squeezed. */
    .channels-scroll > channel-strip {
      flex: 1 1 0;
      min-width: 44px;
      max-width: var(--mixer-strip-max-width, 96px);
    }

    .master-section > channel-strip {
      width: 64px;
    }

    /* A prepared channel: an empty desk cell inviting a device — same
     * affordance as the rack's prepared "+" slots, but also a real button:
     * clicking pops the device menu over the cell. */
    .ghost-strip {
      flex: 1 1 0;
      min-width: 44px;
      max-width: var(--mixer-strip-max-width, 96px);
      border: none;
      border-right: var(--mixer-strip-border, 1px solid #2b3844);
      padding: 0;
      background: color-mix(in srgb, var(--mixer-strip-bg, #192734) 45%, var(--mixer-bg, #141414));
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      opacity: 0.45;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s;
    }

    .ghost-strip.over,
    .ghost-strip:hover {
      opacity: 1;
      background: color-mix(in srgb, var(--lcd-led-on-color, #b4d455) 8%, var(--mixer-bg, #141414));
    }

    .ghost-plus {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 1.1em;
      line-height: 1;
      color: var(--lcd-led-on-color, #b4d455);
      opacity: 0.6;
    }

    .ghost-strip.over .ghost-plus,
    .ghost-strip:hover .ghost-plus {
      opacity: 1;
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
      margin-left: auto;
    }
  `;
}
