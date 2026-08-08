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
import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

import { createMidi, Midi } from "../midi/api";
import { MidiBus } from "../midi/bus/bus";
import { KeyboardController, KbTarget } from "../midi/keyboard";
import { Channel } from "../midi/types";

import { SlotConfig, createBranchSlot, createLeafSlot, collectLeafSlots } from "../core/slot";
import { pluginRegistry, PluginRegistration } from "../core/plugin-registry";
import type { Plugin, InstrumentPlugin } from "../core/types";
import { isInstrumentPlugin, isSlotAware, isAudioProducer, isMidiConsumer, isTransportChild } from "../core/types";
import { RackSession, RackSlotEntry, loadRackSession, saveRackSession } from "../core/rack-storage";
import { getBindingManager } from "../control/binding-manager";
import { MidiControlAdapter } from "../control/adapters/midi-adapter";

import { MixerEngine, CHANNEL_COUNT } from "../mixer";
import { TransportController } from "../midi/transport/transport-controller";
import { addWorkletModuleOnce } from "../runtime/worklet-modules";

import "./device-slot/device-slot";
import "./device-browser";
import "./mixer/mixer-element";
import "../instruments/poly-ticks/register";
import "../instruments/monolog/register";
import "../instruments/sequels/register";

const SESSION_SAVE_DEBOUNCE_MS = 500;

/**
 * The DAW shell. Owns the rack (a mutable, persisted tree of slots), the
 * plugin lifecycle end to end (mount → instantiate → route; unmount → ramp
 * silent → dispose → unroute), mixer channel assignment, and the on-screen
 * keyboard targeting. device-slot elements only wire/unwire themselves —
 * their DOM disconnect is NOT unmount (keyed repeat moves elements on
 * reorder).
 */
@customElement("daw-element")
export class Daw extends LitElement {
  private audioContext = new AudioContext();
  /** The master transport ("mother" clock) — public so the transport bar and
   * console can drive it. */
  readonly transport = new TransportController(this.audioContext);
  private midi: Midi;
  private midiBus: MidiBus;
  private keyboard: KeyboardController;
  private mixerEngine: MixerEngine;

  private plugins = new Map<string, Plugin>();
  private midiAdapter: MidiControlAdapter | null = null;

  @state()
  private slotTree: SlotConfig | null = null;

  @state()
  private ready = false;

  @state()
  private selectedSlotIds: Set<string> = new Set();

  private kbSlotConfigs = new Map<string, KbTarget>();

  private slotCounter = 0;
  private mixerAssignments = new Map<string, number>();
  private sessionSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // The reload backstop: whatever in-session triggers missed, the session is
  // snapshotted synchronously before the page goes away.
  private onPageHide = () => this.saveSessionNow();
  // Panels dispatch composed "change" events that bubble all the way up here;
  // any of them means device state moved, so the session snapshot is stale.
  private onAnyControlChange = () => this.scheduleSessionSave();

  async connectedCallback() {
    super.connectedCallback();

    // Reference/template instrument: opt-in even in dev (add ?template to the
    // URL) so it never clutters normal work, and never shipped to production.
    // tsc still compiles it regardless of this runtime flag. Awaited here so it
    // lands in the registry before the rack is built.
    const showTemplate =
      (import.meta as any).env?.DEV &&
      new URLSearchParams(window.location.search).has("template");
    if (showTemplate) {
      await import("../instruments/template/register");
    }

    this.midi = await createMidi();
    this.midiBus = this.midi.bus("main");

    // One CC adapter for the whole app: bindings are globally keyed and the
    // control-change event carries the slot id, so per-slot adapters would
    // only multiply every CC dispatch.
    this.midiAdapter = new MidiControlAdapter(this.midiBus);
    getBindingManager().registerSource(this.midiAdapter);
    getBindingManager().addEventListener("control-change", this.onAnyControlChange);

    for (const input of this.midi.devices.inputs.values()) {
      input.connect(this.midiBus);
    }
    this.midi.onPortChange((port, event) => {
      if (event === "connected" && "connect" in port) {
        (port as any).connect(this.midiBus);
      }
    });

    this.keyboard = new KeyboardController();
    this.keyboard.connect(this.midiBus);

    this.mixerEngine = new MixerEngine(this.audioContext);

    const stored = loadRackSession();
    if (stored) {
      this.transport.setBpm(stored.transport?.bpm ?? 120);
      await this.restoreSession(stored);
    } else {
      await this.buildDefaultRack(showTemplate);
    }

    // Arm the first MIDI-consuming slot for the on-screen keyboard.
    const firstConsumer = this.leafSlots().find((slot) => {
      const plugin = this.plugins.get(slot.id);
      return plugin !== undefined && isMidiConsumer(plugin);
    });
    if (firstConsumer) {
      const reg = firstConsumer.pluginId ? pluginRegistry.get(firstConsumer.pluginId) : undefined;
      const channel = typeof firstConsumer.midiChannel === "number" ? firstConsumer.midiChannel : (0 as Channel);
      this.kbSlotConfigs.set(firstConsumer.id, {
        channel,
        octaveShift: reg?.keyboardOctaveShift ?? 0,
      });
      this.selectedSlotIds = new Set([firstConsumer.id]);
    }
    this.syncKeyboardTargets();

    window.addEventListener("pagehide", this.onPageHide);
    this.addEventListener("change", this.onAnyControlChange);

    // Dev-only console handle: `daw.transport.start()`, `daw.mountDevice(...)`.
    if ((import.meta as any).env?.DEV) {
      (window as any).daw = this;
    }

    this.ready = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pagehide", this.onPageHide);
    this.removeEventListener("change", this.onAnyControlChange);
    getBindingManager().removeEventListener("control-change", this.onAnyControlChange);
    if (this.midiAdapter) {
      getBindingManager().unregisterSource(this.midiAdapter);
      this.midiAdapter = null;
    }
  }

  // --- Rack construction ---

  private leafSlots(): SlotConfig[] {
    return this.slotTree ? collectLeafSlots(this.slotTree) : [];
  }

  private async buildDefaultRack(showTemplate: boolean) {
    const slots = [
      createLeafSlot("slot-synth", "POLY TICKS", "poly-ticks", {
        midiChannel: 0 as Channel,
      }),
      createLeafSlot("slot-monolog", "MONOLOG", "monolog", {
        midiChannel: 1 as Channel,
      }),
      createLeafSlot("slot-seq", "SEQUELS", "sequels", {
        // CH 2 == MONOLOG's input channel, so the sequencer drives it on load.
        outputChannel: 1 as Channel,
      }),
    ];
    if (showTemplate) {
      slots.push(
        createLeafSlot("slot-template", "TEMPLATE", "template", {
          midiChannel: 3 as Channel,
        })
      );
    }
    this.slotCounter = 0;
    this.slotTree = createBranchSlot("root", "DAW", slots);
    for (const [index, slot] of this.leafSlots().entries()) {
      await this.instantiateSlot(slot);
      this.routeSlot(slot, index);
    }
  }

  private async restoreSession(session: RackSession) {
    this.slotCounter = session.slotCounter;

    const slots: SlotConfig[] = [];
    for (const entry of session.slots) {
      if (!pluginRegistry.get(entry.pluginId)) {
        // Device not registered this session (e.g. a template slot without
        // the ?template flag) — drop the slot rather than break the rack.
        console.warn(`rack: dropping slot ${entry.id} (unregistered device "${entry.pluginId}")`);
        continue;
      }
      slots.push(
        createLeafSlot(entry.id, entry.name, entry.pluginId, {
          midiChannel: entry.midiChannel as Channel | "omni",
          outputChannel: entry.outputChannel as Channel,
          inputDevice: entry.inputDevice,
          collapsed: entry.collapsed,
          sync: entry.sync,
        })
      );
    }
    if (slots.length === 0) {
      await this.buildDefaultRack(false);
      return;
    }
    this.slotTree = createBranchSlot("root", "DAW", slots);

    for (const entry of session.slots) {
      const slot = slots.find((s) => s.id === entry.id);
      if (!slot) continue;
      const plugin = await this.instantiateSlot(slot);
      if (!plugin) continue;
      // Self-persisting devices (sequels) restore from their own slot-scoped
      // storage inside init(); everything else replays the session snapshot.
      if (entry.state != null && !isSlotAware(plugin)) {
        try {
          plugin.loadState(entry.state);
        } catch (err) {
          console.warn(`rack: could not restore state for ${entry.id}`, err);
        }
      }
      const wanted = entry.mixerChannel;
      const used = new Set(this.mixerAssignments.values());
      const channel = wanted >= 0 && wanted < CHANNEL_COUNT && !used.has(wanted)
        ? wanted
        : this.allocateMixerChannel();
      if (channel >= 0) this.routeSlot(slot, channel);
      this.wireSync(slot.id, entry.sync);
    }
  }

  private async instantiateSlot(slot: SlotConfig): Promise<Plugin | null> {
    if (!slot.pluginId) return null;
    const reg = pluginRegistry.get(slot.pluginId);
    if (!reg) return null;
    for (const mod of reg.workletModules ?? []) {
      await addWorkletModuleOnce(this.audioContext, mod);
    }
    const plugin = reg.controllerFactory(this.audioContext);
    if (isSlotAware(plugin)) plugin.setSlotId(slot.id);
    plugin.init();
    this.plugins.set(slot.id, plugin);
    return plugin;
  }

  private routeSlot(slot: SlotConfig, channel: number) {
    const plugin = this.plugins.get(slot.id);
    if (!plugin) return;
    this.mixerAssignments.set(slot.id, channel);
    this.mixerEngine.setLabel(channel, slot.name);
    if (isAudioProducer(plugin)) {
      this.mixerEngine.setRouting(slot.id, plugin.getOutputNode(), [channel]);
    }
  }

  private allocateMixerChannel(): number {
    const used = new Set(this.mixerAssignments.values());
    for (let ch = 0; ch < CHANNEL_COUNT; ch++) {
      if (!used.has(ch)) return ch;
    }
    return -1;
  }

  private defaultChannelsFor(reg: PluginRegistration): Partial<Pick<SlotConfig, "midiChannel" | "outputChannel">> {
    if (reg.descriptor.type === "midi-source") {
      // Drive the first mounted instrument, mirroring the default
      // sequels → monolog wiring.
      const firstInstrument = this.leafSlots().find((slot) => {
        const r = slot.pluginId ? pluginRegistry.get(slot.pluginId) : undefined;
        return r?.descriptor.type === "instrument";
      });
      const target = firstInstrument?.midiChannel;
      return { outputChannel: (typeof target === "number" ? target : 0) as Channel };
    }
    // Lowest IN channel not already taken by another slot.
    const used = new Set(
      this.leafSlots()
        .map((slot) => slot.midiChannel)
        .filter((c): c is Channel => typeof c === "number")
    );
    let ch = 0;
    while (used.has(ch as Channel) && ch < 15) ch++;
    return { midiChannel: ch as Channel };
  }

  // --- Mount / unmount (the shell owns plugin lifecycle) ---

  async mountDevice(pluginId: string): Promise<string | null> {
    if (!this.slotTree) return null;
    const reg = pluginRegistry.get(pluginId);
    if (!reg) {
      console.warn(`rack: unknown device "${pluginId}"`);
      return null;
    }
    const channel = this.allocateMixerChannel();
    if (channel === -1) {
      console.warn("rack: all mixer channels are in use");
      return null;
    }
    const id = `slot-${++this.slotCounter}`;
    const slot = createLeafSlot(id, reg.descriptor.name, pluginId, this.defaultChannelsFor(reg));
    await this.instantiateSlot(slot);
    this.routeSlot(slot, channel);
    this.slotTree = { ...this.slotTree, children: [...(this.slotTree.children ?? []), slot] };
    this.scheduleSessionSave();
    return id;
  }

  async unmountSlot(slotId: string): Promise<void> {
    if (!this.slotTree) return;
    const plugin = this.plugins.get(slotId);
    if (!plugin) return;

    // Ramp to silence before teardown so the unmount never clicks.
    if (isAudioProducer(plugin)) {
      const node = plugin.getOutputNode();
      if (node instanceof GainNode) {
        node.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.01);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }

    if (isTransportChild(plugin)) this.wireSync(slotId, false);
    this.mixerEngine.clearRouting(slotId);
    const channel = this.mixerAssignments.get(slotId);
    if (channel !== undefined) this.mixerEngine.setLabel(channel, "");
    this.mixerAssignments.delete(slotId);

    plugin.dispose();
    this.plugins.delete(slotId);

    this.kbSlotConfigs.delete(slotId);
    const nextSelected = new Set(this.selectedSlotIds);
    nextSelected.delete(slotId);
    this.selectedSlotIds = nextSelected;
    this.syncKeyboardTargets();

    this.slotTree = {
      ...this.slotTree,
      children: (this.slotTree.children ?? []).filter((c) => c.id !== slotId),
    };
    this.scheduleSessionSave();
  }

  // --- Session persistence ---

  private scheduleSessionSave() {
    if (this.sessionSaveTimer !== null) clearTimeout(this.sessionSaveTimer);
    this.sessionSaveTimer = setTimeout(() => {
      this.sessionSaveTimer = null;
      this.saveSessionNow();
    }, SESSION_SAVE_DEBOUNCE_MS);
  }

  private saveSessionNow() {
    if (!this.slotTree) return;
    const slots: RackSlotEntry[] = [];
    for (const slot of this.leafSlots()) {
      if (!slot.pluginId) continue;
      const plugin = this.plugins.get(slot.id);
      slots.push({
        id: slot.id,
        pluginId: slot.pluginId,
        name: slot.name,
        midiChannel: slot.midiChannel ?? "omni",
        outputChannel: slot.outputChannel ?? 0,
        inputDevice: slot.inputDevice ?? "internal",
        mixerChannel: this.mixerAssignments.get(slot.id) ?? -1,
        collapsed: slot.collapsed === true,
        sync: slot.sync === true,
        state: plugin && !isSlotAware(plugin) ? plugin.getState() : undefined,
      });
    }
    saveRackSession({
      version: 1,
      slotCounter: this.slotCounter,
      slots,
      transport: { bpm: this.transport.bpm },
    });
  }

  private onSlotConfigChanged() {
    this.scheduleSessionSave();
  }

  // Attach/detach a slot's device to the master transport (SYNC toggle). The
  // quantized-launch handle (setTransport) rides along only while synced.
  private wireSync(slotId: string, sync: boolean) {
    const plugin = this.plugins.get(slotId);
    if (!plugin || !isTransportChild(plugin)) return;
    const withHandle = plugin as unknown as { setTransport?: (t: TransportController | null) => void };
    if (sync) {
      withHandle.setTransport?.(this.transport);
      this.transport.addChild(plugin);
    } else {
      this.transport.removeChild(plugin);
      withHandle.setTransport?.(null);
    }
  }

  private onSlotSyncChanged(e: CustomEvent<{ slotId: string; sync: boolean }>) {
    this.wireSync(e.detail.slotId, e.detail.sync);
  }

  // --- Keyboard targeting ---

  private onSlotSelected(e: CustomEvent<{ slotId: string; pluginId?: string; channel: Channel }>) {
    const { slotId, pluginId, channel } = e.detail;
    // The KB button only renders for slots that consume MIDI, so reaching here
    // already means "this slot wants the keyboard" — no type check needed.
    const reg = pluginId ? pluginRegistry.get(pluginId) : undefined;
    this.kbSlotConfigs.set(slotId, {
      channel,
      octaveShift: reg?.keyboardOctaveShift ?? 0,
    });
    this.selectedSlotIds = new Set([...this.selectedSlotIds, slotId]);
    this.syncKeyboardTargets();
  }

  private onSlotDeselected(e: CustomEvent<{ slotId: string }>) {
    this.kbSlotConfigs.delete(e.detail.slotId);
    const next = new Set(this.selectedSlotIds);
    next.delete(e.detail.slotId);
    this.selectedSlotIds = next;
    this.syncKeyboardTargets();
  }

  private syncKeyboardTargets() {
    this.keyboard.setTargets(Array.from(this.kbSlotConfigs.values()));
  }

  render() {
    if (!this.ready || !this.slotTree) return html``;
    return html`
      <device-slot
        .config=${this.slotTree}
        .plugins=${this.plugins}
        .bus=${this.midiBus}
        .midi=${this.midi}
        .audioContext=${this.audioContext}
        .mixerEngine=${this.mixerEngine}
        .selectedSlotIds=${this.selectedSlotIds}
        @slot-selected=${this.onSlotSelected}
        @slot-deselected=${this.onSlotDeselected}
        @slot-config-changed=${this.onSlotConfigChanged}
        @slot-eject=${this.onSlotEject}
        @slot-sync-changed=${this.onSlotSyncChanged}
      ></device-slot>
      <device-browser
        .emptyRack=${(this.slotTree.children ?? []).length === 0}
        @device-mount=${this.onDeviceMount}
      ></device-browser>
      <mixer-element
        .engine=${this.mixerEngine}
      ></mixer-element>
    `;
  }

  private onDeviceMount(e: CustomEvent<{ pluginId: string }>) {
    void this.mountDevice(e.detail.pluginId);
  }

  private onSlotEject(e: CustomEvent<{ slotId: string }>) {
    void this.unmountSlot(e.detail.slotId);
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      device-browser {
        margin: 24px auto;
      }
    `;
  }
}
