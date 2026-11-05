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

import { VerbState, createVerbState } from "./types/verb-state";
import { VerbEvent } from "./types/verb-event";
import { ControlID } from "../../control/types";
import {
  Plugin,
  PluginDescriptor,
  AudioProducer,
  AudioEffect,
  Learnable,
  HasPresets,
  LearnableParam,
  PresetEntry,
} from "../../core/types";

type ControlHandler = (value: number) => void;

/**
 * The first worklet-flavoured effect: an 8-line FDN reverb. 100% wet like
 * every send/return device — dry stays on the sending channels. The DSP
 * lives entirely in verb-processor.js (per-instance state, Hadamard mix,
 * T60 feedback, glided SIZE); this controller is the thin main-thread half:
 * raw 0..127 state in, the same raw values out over the node's port — the
 * processor owns the mapping to real units, the way a wasm engine would.
 *
 *   input(gain) → AudioWorkletNode("verb") → output(gain)
 *
 * The stable Gain endpoints exist so the mixer can route before/after the
 * worklet node's lifetime: the shell loads the module before the factory
 * runs, and init() drops the node in between them.
 */
export class VerbController extends EventTarget implements Plugin, AudioProducer, AudioEffect, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "verb",
    name: "VERB",
    kind: "effect",
    accent: "var(--verb-accent)",
    type: "instrument",
  };

  private readonly input: GainNode;
  private readonly output: GainNode;
  private node: AudioWorkletNode | null = null;
  private readonly audioContext: AudioContext;
  private state: VerbState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createVerbState();
    this.input = new GainNode(audioContext, { gain: 1 });
    this.output = new GainNode(audioContext, { gain: 1 });
    this.initControlHandlers();
  }

  init() {
    const t = this.state.tank;
    this.node = new AudioWorkletNode(this.audioContext, "verb", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      // Initial targets ride the constructor so the processor snaps its
      // smoothers to them — a fresh mount never sweeps in from defaults.
      processorOptions: {
        size: t.size.value,
        decay: t.decay.value,
        damp: t.damp.value,
      },
    });
    this.input.connect(this.node);
    this.node.connect(this.output);
  }

  connectAudio(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnectAudio(): void {
    this.output.disconnect();
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  getInputNode(): AudioNode {
    return this.input;
  }

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.node?.port.postMessage({ type: "__dispose" });
    this.node?.disconnect();
    this.input.disconnect();
    this.output.disconnect();
    this.node = null;
  }

  handleControlChange(controlId: ControlID, value: number) {
    this.controlHandlers.get(controlId)?.(value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createVerbState(newState as Partial<VerbState>);
    this.syncParams();
    this.dispatch(VerbEvent.TANK, { ...this.state.tank });
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [ControlID.VERB_SIZE, ControlID.VERB_DECAY, ControlID.VERB_DAMP].map((id) => ({
      id,
      name: ControlID[id].replace(/^VERB_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createVerbState() }];
  }

  // --- Param setters (state write → port post → notify UI) ---

  setSize(value: number) {
    this.state.tank.size.value = value;
    this.syncParams();
    this.dispatch(VerbEvent.TANK, { ...this.state.tank });
  }

  setDecay(value: number) {
    this.state.tank.decay.value = value;
    this.syncParams();
    this.dispatch(VerbEvent.TANK, { ...this.state.tank });
  }

  setDamp(value: number) {
    this.state.tank.damp.value = value;
    this.syncParams();
    this.dispatch(VerbEvent.TANK, { ...this.state.tank });
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /** Post the whole tank; the processor one-poles DECAY/DAMP and glides
   * SIZE itself, so there is no snap/ramp split on this side. */
  private syncParams() {
    const t = this.state.tank;
    this.node?.port.postMessage({
      type: "params",
      size: t.size.value,
      decay: t.decay.value,
      damp: t.damp.value,
    });
  }

  private initControlHandlers() {
    const reg = (id: ControlID, update: (v: number) => void) => {
      this.controlHandlers.set(id, update);
    };
    reg(ControlID.VERB_SIZE, (v) => this.setSize(v));
    reg(ControlID.VERB_DECAY, (v) => this.setDecay(v));
    reg(ControlID.VERB_DAMP, (v) => this.setDamp(v));
  }
}
