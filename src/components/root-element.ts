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

import { SynthController } from "../instruments/poly-ticks/synth-controller";
import { SequencerController } from "../instruments/sequels/sequencer-controller";

import { SlotConfig, createBranchSlot, createLeafSlot } from "../core/slot";
import type { Plugin } from "../core/types";

import "./device-slot/device-slot";
import "../instruments/poly-ticks/ui/poly-ticks-element";
import "../instruments/sequels/ui/sequels-element";

@customElement("root-element")
export class Root extends LitElement {
  private audioContext = new AudioContext();
  private midi: Midi;
  private midiBus: MidiBus;

  private plugins = new Map<string, Plugin>();
  private slotTree: SlotConfig;

  @state()
  private ready = false;

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

    new KeyboardController().connect(this.midiBus);

    await this.audioContext.audioWorklet.addModule("synth-processor.js");
    await this.audioContext.audioWorklet.addModule("seq-processor.js");

    const synth = new SynthController(this.audioContext);
    synth.init();
    this.plugins.set("poly-ticks", synth);

    const sequencer = new SequencerController(this.audioContext);
    sequencer.init();
    this.plugins.set("sequels", sequencer);

    this.slotTree = createBranchSlot("root", "DAW", [
      createLeafSlot("slot-synth", "POLY TICKS", "poly-ticks", {
        midiChannel: 0 as Channel,
      }),
      createLeafSlot("slot-seq", "SEQUELS", "sequels", {
        outputChannel: 0 as Channel,
      }),
    ]);

    this.ready = true;
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
