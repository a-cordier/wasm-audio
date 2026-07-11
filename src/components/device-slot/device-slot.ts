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

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { Plugin, InstrumentPlugin, MidiSourcePlugin, isInstrumentPlugin, isMidiSourcePlugin, isLearnable, hasPresets, PresetEntry } from "../../core/types";
import { SlotConfig } from "../../core/slot";
import { MidiBus } from "../../midi/bus/bus";
import { Midi } from "../../midi/api";
import { Channel, Disposable, MidiEvent, RouteFilter } from "../../midi/types";
import { getBindingManager } from "../../control/binding-manager";
import { MidiControlAdapter } from "../../control/adapters/midi-adapter";

@customElement("device-slot")
export class DeviceSlot extends LitElement {
  @property({ attribute: false })
  config: SlotConfig;

  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  childSlots?: SlotConfig[];

  @property({ attribute: false })
  plugins?: Map<string, Plugin>;

  @property({ attribute: false })
  bus?: MidiBus;

  @property({ attribute: false })
  midi?: Midi;

  @property({ attribute: false })
  audioContext?: AudioContext;

  @property({ attribute: false })
  parentOutput?: AudioNode;

  @state()
  private midiChannel: Channel | "omni" = "omni";

  @state()
  private outputChannel: Channel = 0 as Channel;

  @state()
  private inputDevice: string | "all" = "all";

  @state()
  private availableInputs: string[] = [];

  @state()
  private learning = false;

  @state()
  private presets: PresetEntry[] = [];

  @state()
  private presetIndex = 0;

  private mixNode: GainNode | null = null;
  private busSubscription: Disposable | null = null;
  private portChangeCleanup: (() => void) | null = null;
  private midiAdapterRegistered = false;
  private controlChangeListener: EventListener | null = null;
  private learnStateListener: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.midiChannel = this.config?.midiChannel ?? "omni";
    this.outputChannel = this.config?.outputChannel ?? (0 as Channel);
    this.inputDevice = this.config?.inputDevice ?? "all";
    this.setupCoreFeatures();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("config") || changed.has("plugin") || changed.has("bus") || changed.has("audioContext") || changed.has("parentOutput")) {
      this.wireAudio();
      this.wireRouting();
      this.setupCoreFeatures();
    }
    if (changed.has("midi")) {
      this.syncDeviceList();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.teardown();
  }

  private wireAudio() {
    if (!this.audioContext) return;

    if (!this.mixNode) {
      this.mixNode = new GainNode(this.audioContext);
    }

    this.mixNode.disconnect();
    const dest = this.parentOutput ?? this.audioContext.destination;
    this.mixNode.connect(dest);

    if (this.config?.mode === "leaf" && this.plugin && isInstrumentPlugin(this.plugin)) {
      (this.plugin as InstrumentPlugin).connectAudio(this.mixNode);
    }
  }

  private wireRouting() {
    this.busSubscription?.dispose();
    this.busSubscription = null;

    if (!this.bus) return;

    if (this.config?.mode === "leaf" && this.plugin) {
      if (isInstrumentPlugin(this.plugin)) {
        const filter: RouteFilter | undefined = this.midiChannel !== "omni"
          ? { channel: this.midiChannel as Channel }
          : undefined;

        this.busSubscription = this.bus.subscribe(
          (event: MidiEvent) => (this.plugin as InstrumentPlugin).receive(event),
          filter
        );
      } else if (isMidiSourcePlugin(this.plugin)) {
        (this.plugin as MidiSourcePlugin).connectMidiOutput(this.bus);
        (this.plugin as MidiSourcePlugin).setOutputChannel(this.outputChannel);
      }
    }
  }

  private syncDeviceList() {
    if (!this.midi) {
      this.availableInputs = [];
      return;
    }
    this.availableInputs = this.midi.inputNames();
    this.portChangeCleanup?.();
    this.portChangeCleanup = this.midi.onPortChange(() => {
      this.availableInputs = this.midi!.inputNames();
    });
  }

  private teardown() {
    this.busSubscription?.dispose();
    this.busSubscription = null;
    this.portChangeCleanup?.();
    this.portChangeCleanup = null;
    this.mixNode?.disconnect();
    this.teardownCoreFeatures();
  }

  private setupCoreFeatures() {
    if (this.config?.mode !== "leaf" || !this.plugin) return;

    if (hasPresets(this.plugin)) {
      this.presets = this.plugin.getFactoryPresets();
    }

    this.setupBindingManager();
  }

  private setupBindingManager() {
    if (!this.bus || this.midiAdapterRegistered) return;
    if (!this.plugin || !isLearnable(this.plugin)) return;

    const bm = getBindingManager();
    const adapter = new MidiControlAdapter(this.bus);
    bm.registerSource(adapter);
    this.midiAdapterRegistered = true;

    const plugin = this.plugin;
    const mySlotId = this.config.id;
    this.controlChangeListener = ((e: CustomEvent) => {
      const { controlId, value, slotId } = e.detail;
      if (slotId !== mySlotId) return;
      if (isLearnable(plugin)) {
        plugin.handleControlChange(controlId, value);
      }
    }) as EventListener;
    bm.addEventListener("control-change", this.controlChangeListener);

    this.learnStateListener = () => {
      this.learning = bm.isLearningSlot(this.config.id);
    };
    bm.addEventListener("learn-state-change", this.learnStateListener);
  }

  private teardownCoreFeatures() {
    const bm = getBindingManager();
    if (this.controlChangeListener) {
      bm.removeEventListener("control-change", this.controlChangeListener);
      this.controlChangeListener = null;
    }
    if (this.learnStateListener) {
      bm.removeEventListener("learn-state-change", this.learnStateListener);
      this.learnStateListener = null;
    }
  }

  private toggleLearnMode() {
    const bm = getBindingManager();
    if (bm.isLearningSlot(this.config.id)) {
      bm.exitLearnMode();
    } else {
      bm.enterLearnMode(this.config.id);
    }
  }

  private onPresetPrev() {
    if (this.presets.length === 0) return;
    this.presetIndex = (this.presetIndex - 1 + this.presets.length) % this.presets.length;
    this.applyPreset();
  }

  private onPresetNext() {
    if (this.presets.length === 0) return;
    this.presetIndex = (this.presetIndex + 1) % this.presets.length;
    this.applyPreset();
  }

  private applyPreset() {
    if (!this.plugin || !hasPresets(this.plugin)) return;
    const preset = this.presets[this.presetIndex];
    if (preset) {
      this.plugin.loadState(preset.state);
    }
  }

  private onChannelChange(delta: number) {
    if (this.config?.mode !== "leaf") return;

    if (isInstrumentPlugin(this.plugin!)) {
      if (this.midiChannel === "omni") {
        this.midiChannel = delta > 0 ? (0 as Channel) : (15 as Channel);
      } else {
        const next = this.midiChannel + delta;
        if (next < 0) {
          this.midiChannel = "omni";
        } else if (next > 15) {
          this.midiChannel = "omni";
        } else {
          this.midiChannel = next as Channel;
        }
      }
      this.wireRouting();
    } else if (isMidiSourcePlugin(this.plugin!)) {
      const next = Math.max(0, Math.min(15, this.outputChannel + delta));
      this.outputChannel = next as Channel;
      (this.plugin as MidiSourcePlugin).setOutputChannel(this.outputChannel);
    }
  }

  private onDeviceChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.inputDevice = select.value === "all" ? "all" : select.value;
    this.wireRouting();
  }

  private get channelDisplay(): string {
    if (isInstrumentPlugin(this.plugin!)) {
      return this.midiChannel === "omni" ? "OMNI" : `CH ${this.midiChannel + 1}`;
    }
    return `CH ${this.outputChannel + 1}`;
  }

  private get channelLabel(): string {
    if (this.plugin && isMidiSourcePlugin(this.plugin)) {
      return "OUT";
    }
    return "IN";
  }

  render() {
    if (!this.config) return nothing;

    if (this.config.mode === "branch") {
      return this.renderBranch();
    }
    return this.renderLeaf();
  }

  private renderBranch() {
    const children = this.config.children ?? [];
    return html`
      <div class="branch">
        ${children.map((childConfig) => {
          const childPlugin = this.plugins?.get(childConfig.pluginId ?? "");
          return html`
            <device-slot
              .config=${childConfig}
              .plugin=${childPlugin}
              .plugins=${this.plugins}
              .bus=${this.bus}
              .midi=${this.midi}
              .audioContext=${this.audioContext}
              .parentOutput=${this.mixNode}
            ></device-slot>
          `;
        })}
      </div>
    `;
  }

  private renderLeaf() {
    if (!this.plugin) return nothing;

    return html`
      <div class="leaf">
        <div class="slot-header">
          <span class="slot-label">${this.config.name}</span>
          <div class="slot-controls">
            ${this.renderPresetBrowser()}
            ${this.renderLearnButton()}
            ${this.renderDeviceSelector()}
            ${this.renderChannelSelector()}
          </div>
        </div>
        <div class=${classMap({ "slot-body": true, "learn-active": this.learning })}>
          ${this.renderPluginElement()}
        </div>
      </div>
    `;
  }

  private renderPluginElement() {
    if (!this.plugin) return nothing;

    switch (this.plugin.descriptor.tag) {
      case "wasm-poly-element":
        return html`
          <wasm-poly-element
            .voiceManager=${this.plugin}
            .audioContext=${this.audioContext}
          ></wasm-poly-element>
        `;
      case "sequencer-element":
        return html`
          <sequencer-element
            .sequencer=${this.plugin}
            .audioContext=${this.audioContext}
          ></sequencer-element>
        `;
      default:
        return nothing;
    }
  }

  private renderLearnButton() {
    if (!this.plugin || !isLearnable(this.plugin)) return nothing;

    return html`
      <button
        class=${classMap({ "learn-btn": true, active: this.learning })}
        @click=${this.toggleLearnMode}
      >LEARN</button>
    `;
  }

  private renderPresetBrowser() {
    if (!this.plugin || !hasPresets(this.plugin) || this.presets.length === 0) return nothing;

    const name = this.presets[this.presetIndex]?.name ?? "";
    return html`
      <div class="control-group preset-browser">
        <button class="ch-btn" @click=${this.onPresetPrev}>-</button>
        <lcd-element .text=${name}></lcd-element>
        <button class="ch-btn" @click=${this.onPresetNext}>+</button>
      </div>
    `;
  }

  private renderDeviceSelector() {
    if (!this.plugin || isMidiSourcePlugin(this.plugin)) return nothing;

    return html`
      <div class="control-group">
        <label class="control-label">DEVICE</label>
        <select class="device-select" @change=${this.onDeviceChange}>
          <option value="all" ?selected=${this.inputDevice === "all"}>ALL</option>
          ${this.availableInputs.map(
            (name) => html`<option value=${name} ?selected=${this.inputDevice === name}>${name}</option>`
          )}
        </select>
      </div>
    `;
  }

  private renderChannelSelector() {
    if (!this.plugin) return nothing;

    return html`
      <div class="control-group">
        <label class="control-label">${this.channelLabel}</label>
        <div class="channel-control">
          <button class="ch-btn" @click=${() => this.onChannelChange(-1)}>-</button>
          <lcd-element .text=${this.channelDisplay}></lcd-element>
          <button class="ch-btn" @click=${() => this.onChannelChange(1)}>+</button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .branch {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
      align-items: center;
    }

    .leaf {
      display: flex;
      flex-direction: column;
      width: calc(650px + 3em);
      max-width: 100%;
      margin: 0 auto;
    }

    .slot-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 1.5em;
      background: var(--main-panel-color, #181818);
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .slot-label {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 1.1em;
      font-weight: 700;
      color: var(--main-panel-label-color, #fff);
      letter-spacing: 0.08em;
      margin-right: auto;
    }

    .slot-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .control-label {
      font-size: 0.55em;
      font-weight: 600;
      color: var(--light-secondary, #cbe2f3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .channel-control {
      display: flex;
      align-items: stretch;
      height: 24px;
      --lcd-screen-width: 55px;
      --lcd-font-size: 9px;
    }

    .ch-btn {
      font-size: 0.6em;
      font-weight: bold;
      width: 20px;
      background: var(--button-disposed-background-color, #cbe2f3);
      color: var(--button-disposed-label-color, #15202b);
      border: var(--button-border, 1px solid #cbe2f3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ch-btn:active {
      background: var(--button-active-background-color, #192734);
      color: var(--button-active-label-color, #b4d455);
    }

    .device-select {
      font-size: 0.55em;
      padding: 2px 4px;
      height: 24px;
      background: var(--dark-secondary, #192734);
      color: var(--lighter, #fff);
      border: 1px solid var(--light-secondary, #cbe2f3);
      cursor: pointer;
      max-width: 120px;
    }

    .learn-btn {
      font-size: 0.55em;
      font-weight: 700;
      padding: 4px 10px;
      height: 24px;
      background: var(--button-disposed-background-color, #cbe2f3);
      color: var(--button-disposed-label-color, #15202b);
      border: var(--button-border, 1px solid #cbe2f3);
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: background 0.15s, color 0.15s;
    }

    .learn-btn.active {
      background: var(--button-active-background-color, #b4d455);
      color: var(--button-active-label-color, #15202b);
      animation: learn-blink 0.8s ease-in-out infinite alternate;
    }

    @keyframes learn-blink {
      from { opacity: 1; }
      to { opacity: 0.5; }
    }

    .preset-browser {
      --lcd-screen-width: 90px;
      --lcd-font-size: 9px;
    }

    .slot-body {
      width: 100%;
      border-radius: 0 0 0.5rem 0.5rem;
      overflow: hidden;
      transition: box-shadow 0.2s, outline 0.2s;
    }

    .slot-body.learn-active {
      outline: 2px solid rgba(180, 212, 85, 0.6);
      box-shadow: inset 0 0 20px rgba(180, 212, 85, 0.08);
    }
  `;
}
