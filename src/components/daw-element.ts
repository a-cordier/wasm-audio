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
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { createMidi, Midi } from "../midi/api";
import { MidiBus } from "../midi/bus/bus";
import { KeyboardController, KbTarget } from "../midi/keyboard";
import { Channel } from "../midi/types";

import { SlotConfig, createBranchSlot, createLeafSlot, collectLeafSlots } from "../core/slot";
import { pluginRegistry, PluginRegistration } from "../core/plugin-registry";
import type { Plugin, InstrumentPlugin } from "../core/types";
import { isInstrumentPlugin, isSlotAware, isAudioProducer, isAudioEffect, isAuxOutputProvider, isClockObserver, isMidiConsumer, isTransportChild } from "../core/types";
import { RackSession, RackSlotEntry, loadRackSession, saveRackSession } from "../core/rack-storage";
import { getBindingManager } from "../control/binding-manager";
import { getParamDirectory } from "../control/param-directory";
import { MidiControlAdapter } from "../control/adapters/midi-adapter";

import { MixerEngine, ChannelStripState } from "../mixer";
import { TransportController } from "../midi/transport/transport-controller";
import { addWorkletModuleOnce } from "../runtime/worklet-modules";

import "./device-slot/device-slot";
import "./device-browser";
import "./transport-bar";
import "./mixer/mixer-element";
import "../instruments/poly-ticks/register";
import "../instruments/monolog/register";
import "../instruments/sequels/register";
import "../instruments/drumlin/register";
import "../instruments/dischord/register";
import "../devices/echo/register";
import "../devices/drive/register";
import "../devices/chorus/register";
import "../devices/verb/register";
import "../devices/audio-in/register";
import "../devices/automation/register";
import "../devices/song/register";

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
  // One "aux-outputs-changed" listener per separate-outs device (by slot id).
  private auxListeners = new Map<string, EventListener>();
  private midiAdapter: MidiControlAdapter | null = null;

  @state()
  private slotTree: SlotConfig | null = null;

  @state()
  private ready = false;

  // The audio hardware is only allowed to spin up on a user gesture
  // (autoplay policy) — until then a power-on overlay covers the app, so
  // the spin-up cost is paid at the door, never on a downbeat.
  @state()
  private audioReady = false;

  private onAudioStateChange = () => {
    this.audioReady = this.audioContext.state === "running";
  };

  private powerOn = async () => {
    try {
      await this.audioContext.resume();
    } catch {
      // resume can only fail without a gesture; the click IS the gesture.
    }
    this.audioReady = this.audioContext.state === "running";
  };

  @state()
  private selectedSlotIds: Set<string> = new Set();

  // Workspace chrome state (persisted with the session).
  @state()
  private mixerCollapsed = false;

  @state()
  private browserOpen = true;

  private kbSlotConfigs = new Map<string, KbTarget>();

  private slotCounter = 0;
  private rowCounter = 0;
  private sessionSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // First-gesture audio unlock: the context is born suspended (autoplay
  // policy) and the FIRST resume spins up the audio hardware — up to seconds
  // on Bluetooth. Warming it on the first interaction anywhere means the
  // spin-up never lands on a downbeat.
  private unlockAudio = () => {
    if (this.audioContext.state === "suspended") void this.audioContext.resume();
    window.removeEventListener("pointerdown", this.unlockAudio);
    window.removeEventListener("keydown", this.unlockAudio);
  };

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
      if (stored.mixer) {
        this.mixerEngine.setMasterGain(stored.mixer.master);
        this.mixerEngine.setClickGain(stored.mixer.click);
      }
      this.mixerCollapsed = stored.ui?.mixerCollapsed === true;
      this.browserOpen = stored.ui?.browserOpen !== false;
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

    this.audioReady = this.audioContext.state === "running";
    this.audioContext.addEventListener("statechange", this.onAudioStateChange);

    window.addEventListener("pagehide", this.onPageHide);
    window.addEventListener("pointerdown", this.unlockAudio);
    window.addEventListener("keydown", this.unlockAudio);
    // A cancelled device drag fires no dragleave on the viewport — dragend
    // on the source is the only reliable "it's over" signal.
    window.addEventListener("dragend", this.onAnyDragEnd);
    this.addEventListener("change", this.onAnyControlChange);
    this.transport.addEventListener("transport-tempo", this.onAnyControlChange);

    // Dev-only console handle: `daw.transport.start()`, `daw.mountDevice(...)`.
    if ((import.meta as any).env?.DEV) {
      (window as any).daw = this;
    }

    this.ready = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.audioContext.removeEventListener("statechange", this.onAudioStateChange);
    window.removeEventListener("pagehide", this.onPageHide);
    window.removeEventListener("pointerdown", this.unlockAudio);
    window.removeEventListener("keydown", this.unlockAudio);
    window.removeEventListener("dragend", this.onAnyDragEnd);
    this.removeEventListener("change", this.onAnyControlChange);
    this.transport.removeEventListener("transport-tempo", this.onAnyControlChange);
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

  /** Rows are unnamed branches — the arrangement unit of the rack. */
  private newRow(children: SlotConfig[]): SlotConfig {
    return createBranchSlot(`row-${++this.rowCounter}`, "", children);
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
    this.slotTree = createBranchSlot("root", "DAW", [this.newRow(slots)]);
    for (const slot of this.leafSlots()) {
      await this.instantiateSlot(slot);
      this.routeSlot(slot);
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
    // Rebuild the row structure: entries carry their row index.
    const rowBuckets = new Map<number, SlotConfig[]>();
    for (const entry of session.slots) {
      const slot = slots.find((s) => s.id === entry.id);
      if (!slot) continue;
      const bucket = rowBuckets.get(entry.row);
      if (bucket) bucket.push(slot);
      else rowBuckets.set(entry.row, [slot]);
    }
    const rows = [...rowBuckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, leaves]) => this.newRow(leaves));
    this.slotTree = createBranchSlot("root", "DAW", rows);

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
      // Strip order follows slot order — the strip settings travel with it.
      this.routeSlot(slot, entry.mixer, entry.auxMixer);
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
    // Every mount path converges here — the automation address book sees
    // every learnable device (register no-ops for the rest).
    getParamDirectory().register(slot.id, slot.name, plugin);
    // The passive clock feed (synced LFOs): wired unconditionally, unlike
    // the per-slot SYNC opt-in (wireSync) — observe pushes the clock now.
    if (isClockObserver(plugin)) this.transport.observe(plugin);
    return plugin;
  }

  private routeSlot(
    slot: SlotConfig,
    restoredStrip?: ChannelStripState,
    restoredAux?: Record<string, ChannelStripState>
  ) {
    const plugin = this.plugins.get(slot.id);
    if (!plugin) return;
    // Sequencers never take an instrument channel: their only audio is the
    // metronome click, which sums into the mixer's shared CLICK bus.
    if (plugin.descriptor.kind === "sequencer") {
      if (isAudioProducer(plugin)) {
        this.mixerEngine.routeToClick(slot.id, plugin.getOutputNode());
      }
      return;
    }
    // Modules emit no audio at all — nothing to route, no strip to take.
    if (plugin.descriptor.kind === "module") return;
    const channel = this.mixerEngine.addChannel(
      slot.id,
      slot.name,
      restoredStrip,
      plugin.descriptor.accent
    );
    if (!channel) {
      console.warn("rack: all mixer channels are in use");
      return;
    }
    if (isAudioProducer(plugin)) {
      this.mixerEngine.setRouting(slot.id, plugin.getOutputNode());
    }
    // An effect opens its loop: a send bus feeding its input; its output
    // already returns on the channel routed above.
    if (isAudioEffect(plugin)) {
      this.mixerEngine.addSendBus(slot.id, slot.name, plugin.getInputNode(), plugin.descriptor.accent);
    }
    // Separate outs: open a strip per routed voice and follow the device's
    // announcements from here on.
    if (isAuxOutputProvider(plugin)) {
      this.syncAuxChannels(slot, restoredAux);
      if (!this.auxListeners.has(slot.id)) {
        const handler = () => this.syncAuxChannels(slot);
        (plugin as unknown as EventTarget).addEventListener("aux-outputs-changed", handler);
        this.auxListeners.set(slot.id, handler);
      }
    }
  }

  /**
   * Reconcile a device's separate outs against mixer channels (keyed
   * `${slotId}:${voiceId}` — the engine treats ids as opaque). Runs at route
   * time and on every "aux-outputs-changed"; a full board refuses the new
   * strip and setAuxActive reverts the device's toggle.
   */
  private syncAuxChannels(slot: SlotConfig, restoredAux?: Record<string, ChannelStripState>) {
    const plugin = this.plugins.get(slot.id);
    if (!plugin || !isAuxOutputProvider(plugin)) return;
    const desired = plugin.getAuxOutputs();
    const desiredKeys = new Set(desired.map((a) => `${slot.id}:${a.id}`));
    for (const ch of [...this.mixerEngine.channels]) {
      if (ch.slotId.startsWith(`${slot.id}:`) && !desiredKeys.has(ch.slotId)) {
        void this.mixerEngine.removeChannel(ch.slotId).then(() => this.mixerEngine.clearRouting(ch.slotId));
      }
    }
    for (const aux of desired) {
      const key = `${slot.id}:${aux.id}`;
      if (this.mixerEngine.getChannel(key)) continue;
      if (!this.mixerEngine.hasFreeChannel()) {
        plugin.setAuxActive(aux.id, false);
        continue;
      }
      this.mixerEngine.addChannel(key, aux.label, restoredAux?.[aux.id], plugin.descriptor.accent);
      this.mixerEngine.setRouting(key, aux.node);
    }
    this.scheduleSessionSave();
  }

  /** A second instance of a device mounts as "NAME 2" — slot names flow to
   * rack headers, strip nameplates and send-knob labels, where two identical
   * "ECHO"s would be indistinguishable. */
  private uniqueSlotName(base: string): string {
    const names = new Set(this.leafSlots().map((slot) => slot.name));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
  }

  private defaultChannelsFor(reg: PluginRegistration): Partial<Pick<SlotConfig, "midiChannel" | "outputChannel">> {
    // Control devices consume no MIDI — don't burn an IN channel on one.
    if (reg.descriptor.type === "control") return {};
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
    const needsChannel = reg.descriptor.kind !== "sequencer" && reg.descriptor.kind !== "module";
    if (needsChannel && !this.mixerEngine.hasFreeChannel()) {
      console.warn("rack: all mixer channels are in use");
      return null;
    }
    const id = `slot-${++this.slotCounter}`;
    const slot = createLeafSlot(id, this.uniqueSlotName(reg.descriptor.name), pluginId, {
      ...this.defaultChannelsFor(reg),
      sync: reg.defaultSync === true,
    });
    await this.instantiateSlot(slot);
    this.routeSlot(slot);
    if (slot.sync) this.wireSync(slot.id, true);
    const rows = [...(this.slotTree.children ?? [])];
    if (rows.length === 0) {
      rows.push(this.newRow([slot]));
    } else {
      const last = rows[rows.length - 1];
      rows[rows.length - 1] = { ...last, children: [...(last.children ?? []), slot] };
    }
    this.slotTree = { ...this.slotTree, children: rows };
    this.scheduleSessionSave();
    return id;
  }

  async unmountSlot(slotId: string): Promise<void> {
    if (!this.slotTree) return;
    const plugin = this.plugins.get(slotId);
    if (!plugin) return;

    // Out of the automation address book FIRST: no tick may dispatch into a
    // plugin that is ramping down or disposed.
    getParamDirectory().unregister(slotId);
    if (isClockObserver(plugin)) this.transport.unobserve(plugin);

    // Ramp to silence before teardown so the unmount never clicks.
    if (isAudioProducer(plugin)) {
      const node = plugin.getOutputNode();
      if (node instanceof GainNode) {
        node.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.01);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }

    if (isTransportChild(plugin)) this.wireSync(slotId, false);
    // An unmounting effect closes its loop first (sends stop feeding it),
    // then its strip ramps itself silent before the graph is torn down; the
    // CLICK-bus route (sequencers — they have no strip) unplugs alongside.
    this.mixerEngine.removeSendBus(slotId);
    await this.mixerEngine.removeChannel(slotId);
    this.mixerEngine.clearRouting(slotId);

    // Separate outs close with their device: every aux strip goes too.
    if (isAuxOutputProvider(plugin)) {
      const handler = this.auxListeners.get(slotId);
      if (handler) {
        (plugin as unknown as EventTarget).removeEventListener("aux-outputs-changed", handler);
        this.auxListeners.delete(slotId);
      }
      for (const aux of plugin.getAuxOutputs()) {
        const key = `${slotId}:${aux.id}`;
        await this.mixerEngine.removeChannel(key);
        this.mixerEngine.clearRouting(key);
      }
    }

    plugin.dispose();
    this.plugins.delete(slotId);

    this.kbSlotConfigs.delete(slotId);
    const nextSelected = new Set(this.selectedSlotIds);
    nextSelected.delete(slotId);
    this.selectedSlotIds = nextSelected;
    this.syncKeyboardTargets();

    this.slotTree = {
      ...this.slotTree,
      children: (this.slotTree.children ?? [])
        .map((row) => ({ ...row, children: (row.children ?? []).filter((c) => c.id !== slotId) }))
        .filter((row) => (row.children ?? []).length > 0),
    };
    this.scheduleSessionSave();
  }

  /** Drag-and-drop arrangement: move a device within/between rows, or into a
   * fresh row at the end (targetRowId null). Rows left empty are pruned. */
  private onSlotMove = (e: CustomEvent<{ slotId: string; targetRowId: string | null; index: number }>) => {
    if (!this.slotTree) return;
    const { slotId, targetRowId, index } = e.detail;
    const rows: Array<SlotConfig & { children: SlotConfig[] }> =
      (this.slotTree.children ?? []).map((r) => ({ ...r, children: [...(r.children ?? [])] }));
    let moved: SlotConfig | undefined;
    let sourceRow: (typeof rows)[number] | undefined;
    let sourceIndex = -1;
    for (const row of rows) {
      const i = row.children.findIndex((c) => c.id === slotId);
      if (i !== -1) {
        moved = row.children[i];
        sourceRow = row;
        sourceIndex = i;
        break;
      }
    }
    if (!moved || !sourceRow) return;
    if (targetRowId !== null) {
      const target = rows.find((r) => r.id === targetRowId);
      if (!target) return;
      let insertIndex = index;
      if (target === sourceRow && sourceIndex < insertIndex) insertIndex -= 1;
      sourceRow.children.splice(sourceIndex, 1);
      insertIndex = Math.max(0, Math.min(insertIndex, target.children.length));
      target.children.splice(insertIndex, 0, moved);
    } else {
      sourceRow.children.splice(sourceIndex, 1);
      rows.push({ ...this.newRow([moved]), children: [moved] });
    }
    this.slotTree = { ...this.slotTree, children: rows.filter((r) => r.children.length > 0) };
    this.scheduleSessionSave();
  };

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
    (this.slotTree.children ?? []).forEach((row, rowIndex) => {
      for (const slot of row.children ?? []) {
        if (!slot.pluginId) continue;
        const plugin = this.plugins.get(slot.id);
        slots.push({
          id: slot.id,
          pluginId: slot.pluginId,
          name: slot.name,
          midiChannel: slot.midiChannel ?? "omni",
          outputChannel: slot.outputChannel ?? 0,
          inputDevice: slot.inputDevice ?? "internal",
          mixer: this.saveStrip(slot.id),
          auxMixer: this.saveAuxStrips(slot.id, plugin),
          collapsed: slot.collapsed === true,
          sync: slot.sync === true,
          row: rowIndex,
          state: plugin && !isSlotAware(plugin) ? plugin.getState() : undefined,
        });
      }
    });
    saveRackSession({
      version: 1,
      slotCounter: this.slotCounter,
      slots,
      transport: { bpm: this.transport.bpm },
      mixer: { master: this.mixerEngine.masterGain, click: this.mixerEngine.clickGain },
      ui: { mixerCollapsed: this.mixerCollapsed, browserOpen: this.browserOpen },
    });
  }

  private saveStrip(slotId: string) {
    const channel = this.mixerEngine.getChannel(slotId);
    if (!channel) return undefined;
    // Send levels for ejected loops would otherwise pile up forever.
    return { ...channel.strip, sends: this.mixerEngine.pruneSends(channel.strip.sends) };
  }

  /** Strip snapshots for a device's separate-out channels, keyed by voice. */
  private saveAuxStrips(slotId: string, plugin?: Plugin) {
    if (!plugin || !isAuxOutputProvider(plugin)) return undefined;
    let out: Record<string, ChannelStripState> | undefined;
    for (const aux of plugin.getAuxOutputs()) {
      const strip = this.saveStrip(`${slotId}:${aux.id}`);
      if (strip) (out ??= {})[aux.id] = strip;
    }
    return out;
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
      <transport-bar
        .transport=${this.transport}
        .audioContext=${this.audioContext}
      ></transport-bar>
      ${!this.audioReady
        ? html`
          <div class="power-overlay" @click=${this.powerOn}>
            <div class="power-box">
              <span class="power-title">WASM AUDIO</span>
              <span class="power-hint">click to power on</span>
            </div>
          </div>`
        : nothing}
      <div class="main-zone">
        <device-browser
          .open=${this.browserOpen}
          .emptyRack=${(this.slotTree.children ?? []).length === 0}
          @device-mount=${this.onDeviceMount}
          @browser-toggle=${this.onBrowserToggle}
        ></device-browser>
        <div
          class=${classMap({ "rack-viewport": true, "drag-over": this.rackDragOver })}
          @dragover=${this.onRackDragOver}
          @dragleave=${this.onRackDragLeave}
          @drop=${this.onRackDrop}
        >
          <device-slot
            root
            @slot-move=${this.onSlotMove}
            @device-mount=${this.onDeviceMount}
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
        </div>
      </div>
      <mixer-element
        .engine=${this.mixerEngine}
        .collapsed=${this.mixerCollapsed}
        @mixer-collapse-changed=${this.onMixerCollapseChanged}
        @device-mount=${this.onDeviceMount}
      ></mixer-element>
    `;
  }

  private onDeviceMount(e: CustomEvent<{ pluginId: string }>) {
    void this.mountDevice(e.detail.pluginId);
  }

  // --- Drop-anywhere mounting: the whole rack viewport takes menu drags ---
  // Aiming for a prepared "+" slot is optional; a device dropped anywhere
  // in the rack mounts at the end of the last row (same as a rail click).

  @state()
  private rackDragOver = false;

  private static isPluginDrag(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes("text/x-plugin-id") ?? false;
  }

  private onRackDragOver = (e: DragEvent) => {
    if (!Daw.isPluginDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    if (!this.rackDragOver) this.rackDragOver = true;
  };

  private onRackDragLeave = (e: DragEvent) => {
    // dragleave fires on every child transition — only clear when the
    // pointer actually left the viewport's box.
    const viewport = this.shadowRoot?.querySelector(".rack-viewport");
    if (!viewport) return;
    const r = viewport.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom) return;
    this.rackDragOver = false;
  };

  private onRackDrop = (e: DragEvent) => {
    this.rackDragOver = false;
    // A prepared slot that already took this drop prevented it first.
    if (!Daw.isPluginDrag(e) || e.defaultPrevented) return;
    e.preventDefault();
    const pluginId = e.dataTransfer?.getData("text/x-plugin-id");
    if (pluginId) void this.mountDevice(pluginId);
  };

  private onAnyDragEnd = () => {
    if (this.rackDragOver) this.rackDragOver = false;
  };

  private onBrowserToggle(e: CustomEvent<{ open: boolean }>) {
    this.browserOpen = e.detail.open;
    this.scheduleSessionSave();
  }

  private onMixerCollapseChanged(e: CustomEvent<{ collapsed: boolean }>) {
    this.mixerCollapsed = e.detail.collapsed;
    this.scheduleSessionSave();
  }

  private onSlotEject(e: CustomEvent<{ slotId: string }>) {
    void this.unmountSlot(e.detail.slotId);
  }

  static get styles() {
    return css`
      /* The workspace grid: browser rail + scrolling rack over the DAW
       * core dock (MASTER transport + mixer, composable — future core
       * modules join it). Item 7's timeline claims a chrome row later. */
      :host {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        height: 100%;
        width: 100%;
      }

      mixer-element {
        border-top: 1px solid var(--medium, #2b3844);
      }

      /* Middle row: browser rail + rack viewport. */
      .main-zone {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        min-height: 0;
        overflow: hidden;
      }

      .rack-viewport {
        overflow-y: auto;
        min-height: 0;
        padding: 24px;
        box-sizing: border-box;
        scrollbar-width: thin;
      }

      /* A device drag from the menu lights the whole viewport up as the
       * drop zone — the prepared "+" slots are an invitation, not a target
       * you have to hit. */
      .rack-viewport.drag-over {
        box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--lcd-led-on-color, #b4d455) 45%, transparent);
      }

      .power-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--body-background, #121212) 96%, transparent);
        cursor: pointer;
      }

      .power-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px 48px;
        background: var(--main-panel-color, #181818);
        border: 1px solid var(--medium, #2b3844);
        border-radius: 0.5rem;
      }

      .power-title {
        font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
        font-size: 1.6em;
        color: var(--main-panel-label-color, #fff);
        letter-spacing: 0.1em;
      }

      .power-hint {
        font-size: 0.7em;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--lcd-led-on-color, #b4d455);
        animation: power-pulse 1.6s ease-in-out infinite alternate;
      }

      @keyframes power-pulse {
        from { opacity: 1; }
        to { opacity: 0.35; }
      }
    `;
  }
}
