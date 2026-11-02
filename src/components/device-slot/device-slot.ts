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
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

import { Plugin, InstrumentPlugin, MidiSourcePlugin, MidiConsumer, isInstrumentPlugin, isMidiSourcePlugin, isMidiConsumer, isLearnable, isTransportChild, hasPresets, PresetEntry } from "../../core/types";
import { pluginRegistry } from "../../core/plugin-registry";
import { SlotConfig } from "../../core/slot";
import { MidiBus } from "../../midi/bus/bus";
import { Midi } from "../../midi/api";
import { Channel, Disposable, INTERNAL_SOURCE, MidiEvent, RouteFilter, Status } from "../../midi/types";
import { isNoteOn, isNoteOff } from "../../midi/codec/decode";
import { getBindingManager } from "../../control/binding-manager";
import { MixerEngine } from "../../mixer";
import "../device-picker";
import { DevicePicker, PickerAnchor } from "../device-picker";

/** Label for the synthetic slot holding the user's own working state. */
const USER_PRESET = "USER";

/**
 * Plugins return a shallow copy of a nested state object, so hold a real
 * value copy rather than something later edits could reach into.
 */
function snapshot(state: unknown): unknown {
  try {
    return structuredClone(state);
  } catch {
    return JSON.parse(JSON.stringify(state));
  }
}

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
  mixerEngine?: MixerEngine;

  @property({ attribute: false })
  selectedSlotIds: Set<string> = new Set();

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

  // Index 0 is the synthetic USER slot; 1..n are this.presets[0..n-1].
  @state()
  private presetIndex = 0;

  // The working state, captured on the way out of USER so browsing the
  // factory presets can never destroy it.
  private userSnapshot: unknown | null = null;

  private busSubscription: Disposable | null = null;
  private activeNotes = new Set<number>();
  private portChangeCleanup: (() => void) | null = null;
  private controlChangeListener: EventListener | null = null;
  private learnStateListener: (() => void) | null = null;
  private wiredPlugin: Plugin | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver.observe(this);
    this.midiChannel = this.config?.midiChannel ?? "omni";
    this.outputChannel = this.config?.outputChannel ?? (0 as Channel);
    this.inputDevice = this.config?.inputDevice ?? "all";
    this.collapsed = this.config?.collapsed === true;
    this.setupCoreFeatures();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("config") || changed.has("plugin") || changed.has("bus") || changed.has("audioContext") || changed.has("mixerEngine")) {
      // Unwire the outgoing plugin on swap, or its audio stays connected and
      // its mixer routing keeps pointing at a device this slot no longer hosts.
      if (this.wiredPlugin && this.wiredPlugin !== this.plugin) {
        if (isInstrumentPlugin(this.wiredPlugin)) {
          (this.wiredPlugin as InstrumentPlugin).disconnectAudio();
        }
        this.mixerEngine?.clearRouting(this.config.id);
      }
      this.wiredPlugin = this.plugin ?? null;
      this.wireRouting();
      this.setupCoreFeatures();
    }
    if (changed.has("midi")) {
      this.syncDeviceList();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
    this.teardown();
  }

  private wireRouting() {
    this.busSubscription?.dispose();
    this.busSubscription = null;
    this.activeNotes.clear();

    if (!this.bus) return;
    if (this.config?.mode !== "leaf" || !this.plugin) return;

    // A plugin can be both: the sequencer emits MIDI *and* records what it is
    // fed, so these are two independent capabilities rather than a choice.
    if (isMidiSourcePlugin(this.plugin)) {
      (this.plugin as MidiSourcePlugin).connectMidiOutput(this.bus);
      (this.plugin as MidiSourcePlugin).setOutputChannel(this.outputChannel);
    }

    if (isMidiConsumer(this.plugin)) {
      const filter: RouteFilter = {};
      if (this.midiChannel !== "omni") {
        filter.channel = this.midiChannel as Channel;
      }
      if (this.inputDevice === "internal") {
        filter.source = INTERNAL_SOURCE;
      } else if (this.inputDevice !== "all") {
        filter.source = this.inputDevice;
      }

      const consumer = this.plugin as Plugin & MidiConsumer;
      this.busSubscription = this.bus.subscribe(
        (event: MidiEvent) => {
          if (isNoteOn(event)) this.activeNotes.add(event.data1);
          else if (isNoteOff(event)) this.activeNotes.delete(event.data1);
          consumer.receive(event);
        },
        Object.keys(filter).length > 0 ? filter : undefined
      );
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
    // Wiring-only cleanup: the SHELL (daw-element) owns plugin lifecycle —
    // it disposes the plugin and clears mixer routing in unmountSlot(). DOM
    // disconnect is NOT unmount: keyed repeat() moves elements on reorder
    // (disconnect + reconnect), so disposing here would kill live devices.
    this.busSubscription?.dispose();
    this.busSubscription = null;
    this.activeNotes.clear();
    this.portChangeCleanup?.();
    this.portChangeCleanup = null;
    this.wiredPlugin = null;
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
    // Remove-then-add: this re-runs whenever the plugin or config changes, and
    // the listeners must close over the CURRENT plugin and slot id — the old
    // guard flag kept them bound to the first plugin forever. The MIDI adapter
    // itself is app-level (registered once by daw-element), not per slot.
    this.teardownCoreFeatures();
    if (!this.plugin || !isLearnable(this.plugin)) return;

    const bm = getBindingManager();
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
    this.stepPreset(-1);
  }

  private onPresetNext() {
    this.stepPreset(1);
  }

  /** USER + every factory preset. */
  private get presetCount(): number {
    return this.presets.length + 1;
  }

  private get presetName(): string {
    if (this.presetIndex === 0) return USER_PRESET;
    return this.presets[this.presetIndex - 1]?.name ?? "";
  }

  private stepPreset(delta: number) {
    if (this.presets.length === 0 || !this.plugin) return;

    const next = (this.presetIndex + delta + this.presetCount) % this.presetCount;
    if (next === this.presetIndex) return;

    // Leaving USER: snapshot first. Loading a preset replaces the plugin's
    // whole state — for the sequencer it clears all 40 patterns — so without
    // this there is no way back to your own work.
    if (this.presetIndex === 0) {
      this.userSnapshot = snapshot(this.plugin.getState());
    }

    this.presetIndex = next;
    this.applyPreset();
  }

  private applyPreset() {
    if (!this.plugin) return;

    if (this.presetIndex === 0) {
      // Nothing to restore until USER has actually been left once.
      if (this.userSnapshot !== null) this.plugin.loadState(this.userSnapshot);
      return;
    }

    if (!hasPresets(this.plugin)) return;
    const preset = this.presets[this.presetIndex - 1];
    if (preset) {
      this.plugin.loadState(preset.state);
    }
  }

  private flushNotesOff(plugin: MidiConsumer) {
    const now = performance.now();
    for (const note of this.activeNotes) {
      plugin.receive({ status: Status.NOTE_OFF, channel: 0 as Channel, data1: note, data2: 0, timestamp: now, source: INTERNAL_SOURCE });
    }
    this.activeNotes.clear();
  }

  private onInChannelChange(delta: number) {
    if (this.config?.mode !== "leaf" || !this.plugin) return;

    if (this.midiChannel === "omni") {
      this.midiChannel = delta > 0 ? (0 as Channel) : (15 as Channel);
    } else {
      const next = this.midiChannel + delta;
      this.midiChannel = next < 0 || next > 15 ? "omni" : (next as Channel);
    }

    if (isMidiConsumer(this.plugin)) {
      this.flushNotesOff(this.plugin as Plugin & MidiConsumer);
    }
    this.config.midiChannel = this.midiChannel;
    this.wireRouting();
    this.notifyConfigChanged();

    if (this.kbActive) {
      const channel = this.midiChannel === "omni" ? (0 as Channel) : this.midiChannel;
      this.dispatchEvent(new CustomEvent("slot-selected", {
        detail: { slotId: this.config.id, pluginId: this.config.pluginId, channel, isInstrument: true },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private onOutChannelChange(delta: number) {
    if (this.config?.mode !== "leaf" || !this.plugin) return;
    if (!isMidiSourcePlugin(this.plugin)) return;

    this.outputChannel = Math.max(0, Math.min(15, this.outputChannel + delta)) as Channel;
    (this.plugin as MidiSourcePlugin).setOutputChannel(this.outputChannel);
    this.config.outputChannel = this.outputChannel;
    this.notifyConfigChanged();
  }

  private onDeviceChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.inputDevice = select.value;
    this.config.inputDevice = this.inputDevice;
    this.wireRouting();
    this.notifyConfigChanged();
  }

  // Header edits mutate the shared SlotConfig (the rack's source of truth);
  // the shell listens for this to persist the session.
  private notifyConfigChanged() {
    this.dispatchEvent(new CustomEvent("slot-config-changed", {
      detail: { slotId: this.config.id },
      bubbles: true,
      composed: true,
    }));
  }

  private get inChannelDisplay(): string {
    return this.midiChannel === "omni" ? "OMNI" : `CH ${this.midiChannel + 1}`;
  }

  private get outChannelDisplay(): string {
    return `CH ${this.outputChannel + 1}`;
  }

  private get kbActive(): boolean {
    return this.selectedSlotIds.has(this.config?.id);
  }

  private onKbToggle() {
    if (this.kbActive) {
      this.dispatchEvent(new CustomEvent("slot-deselected", {
        detail: { slotId: this.config.id },
        bubbles: true,
        composed: true,
      }));
    } else {
      const channel = this.midiChannel === "omni" ? (0 as Channel) : this.midiChannel;
      this.dispatchEvent(new CustomEvent("slot-selected", {
        detail: { slotId: this.config.id, pluginId: this.config.pluginId, channel, isInstrument: true },
        bubbles: true,
        composed: true,
      }));
    }
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
    if (this.hasAttribute("root")) {
      // The root is a column of ROWS (the last one pads itself with prepared
      // "+" slots), plus a drop zone that starts a new row.
      return html`
        <div class="branch">
          ${repeat(children, (c) => c.id, (c, i) => this.renderChildSlot(c, i === children.length - 1))}
          ${children.length === 0 ? this.renderPreparedSlot(0) : nothing}
          <div
            class=${classMap({ "new-row-zone": true, over: this.newRowOver })}
            @dragover=${this.onNewRowDragOver}
            @dragleave=${() => { this.newRowOver = false; }}
            @drop=${this.onNewRowDrop}
          >drop a device here for a new row</div>
          ${this.renderDevicePicker()}
        </div>
      `;
    }
    // A row: devices side by side; a dragged slot previews its insertion
    // point with a marker.
    return html`
      <div
        class="branch row"
        @dragover=${this.onRowDragOver}
        @dragleave=${this.onRowDragLeave}
        @drop=${this.onRowDrop}
      >
        ${repeat(children, (c) => c.id, (c, i) => html`${
          this.dropIndex === i ? html`<div class="drop-marker"></div>` : nothing
        }${this.renderChildSlot(c)}`)}
        ${this.dropIndex === children.length ? html`<div class="drop-marker"></div>` : nothing}
        ${this.showAddTile
          ? Array.from({ length: this.preparedSlotCount(children.length) }, (_, i) => this.renderPreparedSlot(i))
          : nothing}
        ${this.renderDevicePicker()}
      </div>
    `;
  }

  /** Prepared "+" slots pad the last row to the line capacity the screen
   * offers (always at least one) — each is a drop target for a device
   * dragged from the menu AND a button: clicking pops the shared
   * device-picker over the slot. Mounts land where the slot sits. */
  private renderPreparedSlot(index: number) {
    return html`
      <button
        class=${classMap({ "prepared-slot": true, over: this.plugOverIndex === index })}
        title="add a device — click, or drop one from the rail"
        @click=${this.onPreparedClick}
        @dragover=${(e: DragEvent) => this.onPlugDragOver(e, index)}
        @dragleave=${() => { if (this.plugOverIndex === index) this.plugOverIndex = -1; }}
        @drop=${this.onPlugDrop}
      >
        <span class="prepared-plus">+</span>
      </button>
    `;
  }

  @state()
  private pickerAnchor: PickerAnchor | null = null;

  private onPreparedClick = (e: MouseEvent) => {
    this.pickerAnchor = DevicePicker.anchorFor((e.currentTarget as HTMLElement).getBoundingClientRect());
  };

  private closePicker = () => {
    if (this.pickerAnchor !== null) this.pickerAnchor = null;
  };

  private onPickerPick = (e: CustomEvent<{ pluginId: string }>) => {
    e.stopPropagation();
    this.closePicker();
    this.dispatchEvent(new CustomEvent("device-mount", {
      detail: { pluginId: e.detail.pluginId },
      bubbles: true,
      composed: true,
    }));
  };

  private renderDevicePicker() {
    return html`
      <device-picker
        .anchor=${this.pickerAnchor}
        @device-pick=${this.onPickerPick}
        @picker-close=${this.closePicker}
      ></device-picker>
    `;
  }

  /** How many prepared slots complete the current line, from the measured
   * row width (ResizeObserver-fed). A full line gets one on the next. */
  private preparedSlotCount(deviceCount: number): number {
    const slotW = this.measuredSlotWidth || 698;
    const perLine = Math.max(1, Math.floor((this.measuredRowWidth + 24) / (slotW + 24)));
    const occupied = deviceCount % perLine;
    return occupied === 0 ? 1 : perLine - occupied;
  }

  private static isPluginDrag(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes("text/x-plugin-id") ?? false;
  }

  private onPlugDragOver = (e: DragEvent, index: number) => {
    if (!DeviceSlot.isPluginDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    if (this.plugOverIndex !== index) this.plugOverIndex = index;
  };

  private onPlugDrop = (e: DragEvent) => {
    if (!DeviceSlot.isPluginDrag(e)) return;
    e.preventDefault();
    this.plugOverIndex = -1;
    const pluginId = e.dataTransfer?.getData("text/x-plugin-id");
    if (!pluginId) return;
    this.dispatchEvent(new CustomEvent("device-mount", {
      detail: { pluginId },
      bubbles: true,
      composed: true,
    }));
  };

  private renderChildSlot(childConfig: SlotConfig, isLastRow = false) {
    // Instances are keyed by SLOT id: two slots can host the same
    // device. repeat() keys element identity to slot identity, so
    // unmounting slot k tears down slot k's element — an unkeyed map
    // would recycle elements by index and detach the wrong one.
    const childPlugin = this.plugins?.get(childConfig.id);
    return html`
      <device-slot
        .showAddTile=${isLastRow}
        .config=${childConfig}
        .plugin=${childPlugin}
        .plugins=${this.plugins}
        .bus=${this.bus}
        .midi=${this.midi}
        .audioContext=${this.audioContext}
        .mixerEngine=${this.mixerEngine}
        .selectedSlotIds=${this.selectedSlotIds}
      ></device-slot>
    `;
  }

  // --- Drag-and-drop arrangement (HTML5 DnD; the slot label is the handle) ---

  /** Set on the LAST row by the root: this row pads with prepared slots. */
  @property({ attribute: false })
  showAddTile = false;

  @state()
  private plugOverIndex = -1;

  @state()
  private measuredRowWidth = 0;

  private measuredSlotWidth = 0;

  // Line capacity follows the element's real width (window resizes, rail
  // fold/unfold, dock changes) — cheap to observe on every slot host.
  private resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      this.measuredRowWidth = entry.contentRect.width;
    }
    const child = this.shadowRoot?.querySelector(".branch.row > device-slot") as HTMLElement | null;
    if (child) this.measuredSlotWidth = child.offsetWidth;
  });

  @state()
  private dropIndex = -1;

  @state()
  private newRowOver = false;

  @state()
  private dragging = false;

  private static isSlotDrag(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes("text/x-slot-id") ?? false;
  }

  private onDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/x-slot-id", this.config.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    this.dragging = true;
  };

  private onDragEnd = () => {
    this.dragging = false;
  };

  private onRowDragOver = (e: DragEvent) => {
    if (!DeviceSlot.isSlotDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const branch = this.shadowRoot?.querySelector(".branch.row");
    if (!branch) return;
    // Insertion index in reading order — rows wrap on narrow viewports, so
    // compare lines (y) before positions within a line (x).
    const slots = [...branch.querySelectorAll(":scope > device-slot")];
    let index = slots.length;
    for (let i = 0; i < slots.length; i++) {
      const r = slots[i].getBoundingClientRect();
      if (e.clientY < r.top || (e.clientY < r.bottom && e.clientX < r.left + r.width / 2)) {
        index = i;
        break;
      }
    }
    if (index !== this.dropIndex) this.dropIndex = index;
  };

  private onRowDragLeave = (e: DragEvent) => {
    // dragleave fires on every child transition — only clear when the
    // pointer actually left the row's box.
    const branch = this.shadowRoot?.querySelector(".branch.row");
    if (!branch) return;
    const r = branch.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom) return;
    this.dropIndex = -1;
  };

  private onRowDrop = (e: DragEvent) => {
    if (!DeviceSlot.isSlotDrag(e)) return;
    e.preventDefault();
    const slotId = e.dataTransfer?.getData("text/x-slot-id");
    const index = this.dropIndex === -1 ? (this.config.children?.length ?? 0) : this.dropIndex;
    this.dropIndex = -1;
    if (!slotId) return;
    this.dispatchEvent(new CustomEvent("slot-move", {
      detail: { slotId, targetRowId: this.config.id, index },
      bubbles: true,
      composed: true,
    }));
  };

  private onNewRowDragOver = (e: DragEvent) => {
    if (!DeviceSlot.isSlotDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    this.newRowOver = true;
  };

  private onNewRowDrop = (e: DragEvent) => {
    if (!DeviceSlot.isSlotDrag(e)) return;
    e.preventDefault();
    this.newRowOver = false;
    const slotId = e.dataTransfer?.getData("text/x-slot-id");
    if (!slotId) return;
    this.dispatchEvent(new CustomEvent("slot-move", {
      detail: { slotId, targetRowId: null, index: -1 },
      bubbles: true,
      composed: true,
    }));
  };

  private renderLeaf() {
    if (!this.plugin) return nothing;

    return html`
      <div class=${classMap({ leaf: true, dragging: this.dragging })}>
        <div class=${classMap({ "slot-header": true, folded: this.collapsed })}>
          <button
            class="fold-btn"
            title=${this.collapsed ? "unfold" : "fold"}
            @click=${this.onFoldToggle}
          >${this.collapsed ? "▸" : "▾"}</button>
          <span
            class="slot-label"
            draggable="true"
            title="drag to arrange"
            @dragstart=${this.onDragStart}
            @dragend=${this.onDragEnd}
          >${this.config.name}</span>
          <div class="slot-controls">
            ${this.renderPresetBrowser()}
            ${this.renderKbButton()}
            ${this.renderLearnButton()}
            ${this.renderSyncButton()}
            ${this.renderDeviceSelector()}
            ${this.renderChannelSelector()}
            ${this.renderEjectButton()}
          </div>
        </div>
        <div class=${classMap({ "slot-body": true, "learn-active": this.learning, hidden: this.collapsed })}>
          ${this.renderPluginElement()}
        </div>
      </div>
    `;
  }

  private renderPluginElement() {
    if (!this.plugin) return nothing;
    const reg = pluginRegistry.get(this.plugin.descriptor.id);
    if (!reg) return nothing;
    const tag = unsafeStatic(reg.elementTag);
    // kbArmed: arming gates ALL computer-keyboard input to a device — notes
    // (via KeyboardController targets) and any document-level shortcuts the
    // device claims (sequels' transport/pattern keys check this).
    return staticHtml`
      <${tag}
        .plugin=${this.plugin}
        .audioContext=${this.audioContext}
        .bus=${this.bus}
        .midiChannel=${this.midiChannel}
        .kbArmed=${this.kbActive}
        .transportSynced=${this.config.sync === true}
      ></${tag}>
    `;
  }

  private ejectTimer: ReturnType<typeof setTimeout> | null = null;

  @state()
  private ejecting = false;

  // Folded to the header strip: the device keeps running and stays wired
  // (hidden via CSS, never unmounted), so a collapsed synth still plays.
  @state()
  private collapsed = false;

  private onFoldToggle = () => {
    this.collapsed = !this.collapsed;
    this.config.collapsed = this.collapsed;
    this.notifyConfigChanged();
  };

  // Hold-to-eject: ~600 ms press with a visual fill; releasing early cancels.
  private onEjectDown = () => {
    this.ejecting = true;
    this.ejectTimer = setTimeout(() => {
      this.ejectTimer = null;
      this.ejecting = false;
      this.dispatchEvent(new CustomEvent("slot-eject", {
        detail: { slotId: this.config.id },
        bubbles: true,
        composed: true,
      }));
    }, 600);
  };

  private onEjectCancel = () => {
    if (this.ejectTimer !== null) {
      clearTimeout(this.ejectTimer);
      this.ejectTimer = null;
    }
    this.ejecting = false;
  };

  private renderEjectButton() {
    if (!this.plugin) return nothing;
    return html`
      <button
        class=${classMap({ "eject-btn": true, holding: this.ejecting })}
        title="hold to eject"
        @pointerdown=${this.onEjectDown}
        @pointerup=${this.onEjectCancel}
        @pointerleave=${this.onEjectCancel}
      >EJECT</button>
    `;
  }

  private renderKbButton() {
    if (!this.plugin || !isMidiConsumer(this.plugin)) return nothing;

    return html`
      <button
        class=${classMap({ "kb-btn": true, active: this.kbActive })}
        @click=${this.onKbToggle}
      >KB</button>
    `;
  }

  // SYNC: this device follows the master transport (child clock mode).
  private onSyncToggle = () => {
    this.config.sync = this.config.sync !== true;
    this.requestUpdate();
    this.notifyConfigChanged();
    this.dispatchEvent(new CustomEvent("slot-sync-changed", {
      detail: { slotId: this.config.id, sync: this.config.sync },
      bubbles: true,
      composed: true,
    }));
  };

  private renderSyncButton() {
    if (!this.plugin || !isTransportChild(this.plugin)) return nothing;
    return html`
      <button
        class=${classMap({ "sync-btn": true, active: this.config.sync === true })}
        title="follow the master transport"
        @click=${this.onSyncToggle}
      >SYNC</button>
    `;
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

    const name = this.presetName;
    return html`
      <div class="control-group preset-browser">
        <button class="ch-btn" @click=${this.onPresetPrev}>-</button>
        <lcd-element .text=${name}></lcd-element>
        <button class="ch-btn" @click=${this.onPresetNext}>+</button>
      </div>
    `;
  }

  private renderDeviceSelector() {
    if (!this.plugin || !isMidiConsumer(this.plugin)) return nothing;

    return html`
      <div class="control-group">
        <label class="control-label">CTRL</label>
        <select class="device-select" @change=${this.onDeviceChange}>
          <option value="internal" ?selected=${this.inputDevice === "internal"}>INT.</option>
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
      ${isMidiConsumer(this.plugin)
        ? html`
            <div class="control-group">
              <label class="control-label">IN</label>
              <div class="channel-control">
                <button class="ch-btn" @click=${() => this.onInChannelChange(-1)}>-</button>
                <lcd-element .text=${this.inChannelDisplay}></lcd-element>
                <button class="ch-btn" @click=${() => this.onInChannelChange(1)}>+</button>
              </div>
            </div>
          `
        : nothing}
      ${isMidiSourcePlugin(this.plugin)
        ? html`
            <div class="control-group">
              <label class="control-label">OUT</label>
              <div class="channel-control">
                <button class="ch-btn" @click=${() => this.onOutChannelChange(-1)}>-</button>
                <lcd-element .text=${this.outChannelDisplay}></lcd-element>
                <button class="ch-btn" @click=${() => this.onOutChannelChange(1)}>+</button>
              </div>
            </div>
          `
        : nothing}
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

    /* A non-root branch is a ROW — the arrangement unit: devices sit side
     * by side (wrapping on narrow viewports); the root stacks rows. */
    :host(:not([root])) .branch {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
    }

    :host(:not([root])) .branch > device-slot {
      width: var(--rack-slot-width, calc(650px + 3em));
      max-width: 100%;
      flex: none;
    }

    .drop-marker {
      width: 4px;
      min-height: 48px;
      align-self: stretch;
      border-radius: 2px;
      background: var(--lcd-led-on-color, #b4d455);
    }

    .leaf.dragging {
      opacity: 0.45;
    }

    /* A prepared slot: an empty rack bay inviting a device — drop one from
     * the menu, or click to pop the device picker. Stretches to its line
     * height. */
    .prepared-slot {
      width: var(--rack-slot-width, calc(650px + 3em));
      max-width: 100%;
      min-height: 120px;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      background: transparent;
      border: 2px dashed var(--browser-rail-border, #2b3844);
      border-radius: 0.5rem;
      opacity: 0.45;
      cursor: pointer;
      transition: opacity 0.15s, border-color 0.15s, background 0.15s;
    }

    .prepared-slot.over,
    .prepared-slot:hover {
      opacity: 1;
      border-color: var(--lcd-led-on-color, #b4d455);
      background: color-mix(in srgb, var(--lcd-led-on-color, #b4d455) 6%, transparent);
    }

    .prepared-plus {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 2.4em;
      line-height: 1;
      color: var(--lcd-led-on-color, #b4d455);
    }

    .new-row-zone {
      width: var(--rack-slot-width, calc(650px + 3em));
      max-width: 100%;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed var(--browser-rail-border, #2b3844);
      border-radius: 0.5rem;
      font-size: 0.6em;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--browser-kind-color, #cbe2f3);
      opacity: 0.35;
      transition: opacity 0.15s, border-color 0.15s;
    }

    .new-row-zone.over,
    .new-row-zone:hover {
      opacity: 0.9;
      border-color: var(--lcd-led-on-color, #b4d455);
    }

    .leaf {
      display: flex;
      flex-direction: column;
      width: var(--rack-slot-width, calc(650px + 3em));
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
      cursor: grab;
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
      /* 8px not 12px: with six control groups the gaps alone were 60px, which
         was most of what pushed the SEQUELS header onto a second row. */
      gap: 8px;
      /* Wraps instead of overflowing: SEQUELS carries IN + OUT + DEVICE + KB,
         and MONOLOG's header already exceeded the slot at narrow widths. */
      flex-wrap: wrap;
      justify-content: flex-end;
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
      /* Widest content is "OMNI" / "CH 16" — ~30px at 9px monospace. */
      --lcd-screen-width: 40px;
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

    .learn-btn,
    .sync-btn,
    .kb-btn {
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

    .learn-btn.active,
    .sync-btn.active,
    .kb-btn.active {
      background: var(--button-active-background-color, #b4d455);
      color: var(--button-active-label-color, #15202b);
    }

    .learn-btn.active {
      animation: learn-blink 0.8s ease-in-out infinite alternate;
    }

    .fold-btn {
      width: 20px;
      height: 24px;
      padding: 0;
      background: transparent;
      color: var(--main-panel-label-color, #fff);
      border: none;
      cursor: pointer;
      font-size: 0.7em;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .fold-btn:hover {
      opacity: 1;
    }

    /* A folded slot is just its header strip: round all corners. */
    .slot-header.folded {
      border-radius: 0.5rem;
    }

    .slot-body.hidden {
      display: none;
    }

    .eject-btn {
      position: relative;
      overflow: hidden;
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
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    /* Hold-to-eject fill: sweeps left to right over the hold duration. */
    .eject-btn::after {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--eject-fill-color, #d4554e);
      transform: scaleX(0);
      transform-origin: left;
      opacity: 0.85;
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    .eject-btn.holding::after {
      animation: eject-fill 600ms linear forwards;
    }

    @keyframes eject-fill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    @keyframes learn-blink {
      from { opacity: 1; }
      to { opacity: 0.5; }
    }

    .preset-browser {
      /* Longest factory name is "MS-20 RIPPER" — ~65px at 9px monospace. */
      --lcd-screen-width: 84px;
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
