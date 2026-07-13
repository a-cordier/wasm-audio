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
import { KeyboardController } from "../midi/keyboard";
import { Channel } from "../midi/types";

import { SlotConfig, createBranchSlot, createLeafSlot } from "../core/slot";
import { pluginRegistry } from "../core/plugin-registry";
import type { Plugin } from "../core/types";

import "./device-slot/device-slot";
import "../instruments/poly-ticks/register";
import "../instruments/monolog/register";
import "../instruments/sequels/register";

@customElement("root-element")
export class Root extends LitElement {
  private audioContext = new AudioContext();
  private midi: Midi;
  private midiBus: MidiBus;
  private keyboard: KeyboardController;

  private plugins = new Map<string, Plugin>();
  private slotTree: SlotConfig;

  @state()
  private ready = false;

  @state()
  private selectedSlotId = "";

  async connectedCallback() {
    super.connectedCallback();

    this.midi = await createMidi();
    this.midiBus = this.midi.bus("main");

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

    this.slotTree = createBranchSlot("root", "DAW", [
      createLeafSlot("slot-synth", "POLY TICKS", "poly-ticks", {
        midiChannel: 0 as Channel,
      }),
      createLeafSlot("slot-monolog", "MONOLOG", "monolog", {
        midiChannel: 1 as Channel,
      }),
      createLeafSlot("slot-seq", "SEQUELS", "sequels", {
        outputChannel: 0 as Channel,
      }),
    ]);

    this.selectedSlotId = "slot-synth";
    this.keyboard.setChannel(0 as Channel);

    this.ready = true;
  }

  private onSlotSelected(e: CustomEvent<{ slotId: string; pluginId?: string; channel: Channel; isInstrument: boolean }>) {
    this.selectedSlotId = e.detail.slotId;
    this.keyboard.setEnabled(e.detail.isInstrument);
    if (e.detail.isInstrument) {
      this.keyboard.setChannel(e.detail.channel);
      const reg = e.detail.pluginId ? pluginRegistry.get(e.detail.pluginId) : undefined;
      this.keyboard.setOctaveShift(reg?.keyboardOctaveShift ?? 0);
    }
  }

  private onSlotDeselected() {
    this.selectedSlotId = "";
    this.keyboard.setEnabled(false);
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
        .selectedSlotId=${this.selectedSlotId}
        @slot-selected=${this.onSlotSelected}
        @slot-deselected=${this.onSlotDeselected}
      ></device-slot>
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
