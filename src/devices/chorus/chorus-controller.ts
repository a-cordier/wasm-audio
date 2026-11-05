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

import { ChorusState, createChorusState } from "./types/chorus-state";
import { ChorusEvent } from "./types/chorus-event";
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

/** 10 ms one-pole on every param — the mixer's anti-zipper constant. */
const RAMP_TC = 0.01;

// Two detuned comb bases: close enough to double, far enough apart that the
// voices never null against each other. Max mod depth (8 ms) keeps both
// inside [base − 8, base + 8] ⊂ (0, MAX_DELAY).
const VOICE_A_BASE = 0.015;
const VOICE_B_BASE = 0.021;
const MAX_DELAY = 0.06;

// Raw 0..127 → real units (the controller is the engine for a native-node
// device, so the Range mapping lives here, at the node boundary).
const rateHz = (raw: number) => 0.05 * Math.pow(160, raw / 127); // 0.05..8 Hz, log
const depthSeconds = (raw: number) => (raw / 127) * 0.008; // 0..8 ms
const spreadAmount = (raw: number) => raw / 127; // 0..1 pan split

/**
 * Wet-only doubling with stereo spread — 100% wet like every effect device:
 * the dry signal stays on the sending channels, blend lives on their SEND
 * knobs and this device's return fader. Native nodes only (no worklet, no
 * build step):
 *
 *   input → voiceA(delay) → panA(−spread) → output
 *        └→ voiceB(delay) → panB(+spread) ↗
 *   lfo(sine) → depthA(+d) → voiceA.delayTime
 *            └→ depthB(−d) → voiceB.delayTime   (antiphase vibrato)
 *
 * No feedback path (plain chorus, not flanger) — nothing recirculates. The
 * output sits at −3 dB so the two summed voices land near unity wet.
 */
export class ChorusController extends EventTarget implements Plugin, AudioProducer, AudioEffect, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "chorus",
    name: "CHORUS",
    kind: "effect",
    accent: "var(--chorus-accent)",
    type: "instrument",
  };

  private readonly input: GainNode;
  private readonly voiceA: DelayNode;
  private readonly voiceB: DelayNode;
  private readonly lfo: OscillatorNode;
  private readonly depthA: GainNode;
  private readonly depthB: GainNode;
  private readonly panA: StereoPannerNode;
  private readonly panB: StereoPannerNode;
  private readonly output: GainNode;
  private readonly audioContext: AudioContext;
  private state: ChorusState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createChorusState();

    this.input = new GainNode(audioContext, { gain: 1 });
    this.voiceA = new DelayNode(audioContext, { delayTime: VOICE_A_BASE, maxDelayTime: MAX_DELAY });
    this.voiceB = new DelayNode(audioContext, { delayTime: VOICE_B_BASE, maxDelayTime: MAX_DELAY });
    this.lfo = new OscillatorNode(audioContext, { type: "sine" });
    this.depthA = new GainNode(audioContext, { gain: 0 });
    this.depthB = new GainNode(audioContext, { gain: 0 }); // driven to −depth: the inversion IS the gain sign
    this.panA = new StereoPannerNode(audioContext, { pan: 0 });
    this.panB = new StereoPannerNode(audioContext, { pan: 0 });
    this.output = new GainNode(audioContext, { gain: Math.SQRT1_2 });

    this.input.connect(this.voiceA);
    this.input.connect(this.voiceB);
    this.voiceA.connect(this.panA);
    this.voiceB.connect(this.panB);
    this.panA.connect(this.output);
    this.panB.connect(this.output);
    this.lfo.connect(this.depthA);
    this.lfo.connect(this.depthB);
    this.depthA.connect(this.voiceA.delayTime);
    this.depthB.connect(this.voiceB.delayTime);
    this.lfo.start();

    this.initControlHandlers();
  }

  init() {
    this.syncParams(true);
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
    this.lfo.stop();
    this.input.disconnect();
    this.voiceA.disconnect();
    this.voiceB.disconnect();
    this.lfo.disconnect();
    this.depthA.disconnect();
    this.depthB.disconnect();
    this.panA.disconnect();
    this.panB.disconnect();
    this.output.disconnect();
  }

  handleControlChange(controlId: ControlID, value: number) {
    this.controlHandlers.get(controlId)?.(value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createChorusState(newState as Partial<ChorusState>);
    this.syncParams();
    this.dispatch(ChorusEvent.MOD, { ...this.state.mod });
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [ControlID.CHORUS_RATE, ControlID.CHORUS_DEPTH, ControlID.CHORUS_SPREAD].map((id) => ({
      id,
      name: ControlID[id].replace(/^CHORUS_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createChorusState() }];
  }

  // --- Param setters (state write → node ramp → notify UI) ---

  setRate(value: number) {
    this.state.mod.rate.value = value;
    this.lfo.frequency.setTargetAtTime(rateHz(value), this.audioContext.currentTime, RAMP_TC);
    this.dispatch(ChorusEvent.MOD, { ...this.state.mod });
  }

  setDepth(value: number) {
    this.state.mod.depth.value = value;
    const now = this.audioContext.currentTime;
    const d = depthSeconds(value);
    this.depthA.gain.setTargetAtTime(d, now, RAMP_TC);
    this.depthB.gain.setTargetAtTime(-d, now, RAMP_TC);
    this.dispatch(ChorusEvent.MOD, { ...this.state.mod });
  }

  setSpread(value: number) {
    this.state.mod.spread.value = value;
    const now = this.audioContext.currentTime;
    const s = spreadAmount(value);
    this.panA.pan.setTargetAtTime(-s, now, RAMP_TC);
    this.panB.pan.setTargetAtTime(s, now, RAMP_TC);
    this.dispatch(ChorusEvent.MOD, { ...this.state.mod });
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /** Push the whole state to the nodes; snap (no ramp) on init/preset load. */
  private syncParams(snap = false) {
    const now = this.audioContext.currentTime;
    const m = this.state.mod;
    const d = depthSeconds(m.depth.value);
    const s = spreadAmount(m.spread.value);
    if (snap) {
      this.lfo.frequency.value = rateHz(m.rate.value);
      this.depthA.gain.value = d;
      this.depthB.gain.value = -d;
      this.panA.pan.value = -s;
      this.panB.pan.value = s;
      return;
    }
    this.lfo.frequency.setTargetAtTime(rateHz(m.rate.value), now, RAMP_TC);
    this.depthA.gain.setTargetAtTime(d, now, RAMP_TC);
    this.depthB.gain.setTargetAtTime(-d, now, RAMP_TC);
    this.panA.pan.setTargetAtTime(-s, now, RAMP_TC);
    this.panB.pan.setTargetAtTime(s, now, RAMP_TC);
  }

  private initControlHandlers() {
    const reg = (id: ControlID, update: (v: number) => void) => {
      this.controlHandlers.set(id, update);
    };
    reg(ControlID.CHORUS_RATE, (v) => this.setRate(v));
    reg(ControlID.CHORUS_DEPTH, (v) => this.setDepth(v));
    reg(ControlID.CHORUS_SPREAD, (v) => this.setSpread(v));
  }
}
