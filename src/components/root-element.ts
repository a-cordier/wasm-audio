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

import { SlotConfig, createBranchSlot, createLeafSlot } from "../core/slot";
import { pluginRegistry } from "../core/plugin-registry";
import type { Plugin, InstrumentPlugin } from "../core/types";
import { isInstrumentPlugin } from "../core/types";
import { getBindingManager } from "../control/binding-manager";
import { MidiControlAdapter } from "../control/adapters/midi-adapter";

import { MixerEngine } from "../mixer";

import "./device-slot/device-slot";
import "./mixer/mixer-element";
import "../instruments/poly-ticks/register";
import "../instruments/monolog/register";
import "../instruments/sequels/register";

@customElement("root-element")
export class Root extends LitElement {
  private audioContext = new AudioContext();
  private midi: Midi;
  private midiBus: MidiBus;
  private keyboard: KeyboardController;
  private mixerEngine: MixerEngine;

  private plugins = new Map<string, Plugin>();
  private slotTree: SlotConfig;
  private midiAdapter: MidiControlAdapter | null = null;

  @state()
  private ready = false;

  @state()
  private selectedSlotIds: Set<string> = new Set();

  private kbSlotConfigs = new Map<string, KbTarget>();

  async connectedCallback() {
    super.connectedCallback();

    // Reference/template instrument: opt-in even in dev (add ?template to the
    // URL) so it never clutters normal work, and never shipped to production.
    // tsc still compiles it regardless of this runtime flag. Awaited here so it
    // lands in the registry before the worklet-load loop below.
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

    for (const reg of pluginRegistry.getAll()) {
      for (const mod of reg.workletModules ?? []) {
        await this.audioContext.audioWorklet.addModule(mod);
      }
      const plugin = reg.controllerFactory(this.audioContext);
      plugin.init();
      this.plugins.set(reg.descriptor.id, plugin);
    }

    this.mixerEngine = new MixerEngine(this.audioContext);

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
    this.slotTree = createBranchSlot("root", "DAW", slots);

    this.mixerEngine.setLabel(0, "POLY TICKS");
    this.mixerEngine.setLabel(1, "MONOLOG");
    this.mixerEngine.setLabel(2, "SEQUELS");

    const polyTicks = this.plugins.get("poly-ticks");
    if (polyTicks && isInstrumentPlugin(polyTicks)) {
      this.mixerEngine.setRouting("slot-synth", (polyTicks as InstrumentPlugin).getOutputNode(), [0]);
    }
    const monolog = this.plugins.get("monolog");
    if (monolog && isInstrumentPlugin(monolog)) {
      this.mixerEngine.setRouting("slot-monolog", (monolog as InstrumentPlugin).getOutputNode(), [1]);
    }

    const defaultReg = pluginRegistry.get("poly-ticks");
    this.kbSlotConfigs.set("slot-synth", {
      channel: 0 as Channel,
      octaveShift: defaultReg?.keyboardOctaveShift ?? 0,
    });
    this.selectedSlotIds = new Set(["slot-synth"]);
    this.syncKeyboardTargets();

    this.ready = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.midiAdapter) {
      getBindingManager().unregisterSource(this.midiAdapter);
      this.midiAdapter = null;
    }
  }

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
    if (!this.ready) return html``;
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
      ></device-slot>
      <mixer-element
        .engine=${this.mixerEngine}
      ></mixer-element>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }
    `;
  }
}
