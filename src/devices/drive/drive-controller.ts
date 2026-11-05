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

import { DriveState, createDriveState } from "./types/drive-state";
import { DriveEvent } from "./types/drive-event";
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

// The static curve spans tanh(±SHAPER_RANGE): the pre-gain is drive/RANGE, so
// the shaper computes exactly tanh(signal × drive) at every drive setting.
// Baking drive into gains (ramped) instead of regenerating the curve is what
// keeps a DRIVE sweep smooth — a curve swap under signal steps (house rule:
// smooth every param that reaches the audio path).
const SHAPER_RANGE = 30;

// Raw 0..127 → real units (the controller is the engine for a native-node
// device, so the Range mapping lives here, at the node boundary).
const driveFactor = (raw: number) => Math.pow(SHAPER_RANGE, raw / 127); // 1..30×, log
const toneHz = (raw: number) => 500 * Math.pow(24, raw / 127); // 500 Hz..12 kHz, log
const levelGain = (raw: number) => Math.pow(raw / 127, 2) * 2; // 0..2, unity at raw 90

/**
 * Parallel saturation on a send bus — 100% wet like every effect device: the
 * dry signal stays on the sending channels, blend lives on their SEND knobs
 * and this device's return fader. Native nodes only (no worklet, no build
 * step):
 *
 *   input → pre(drive/30) → shaper(tanh·30, 4x) → tone(lowpass) → post → output
 *
 * post carries level × 1/√drive: an approximate loudness makeup so DRIVE
 * changes character, not just volume. No feedback path — nothing recirculates.
 */
export class DriveController extends EventTarget implements Plugin, AudioProducer, AudioEffect, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "drive",
    name: "DRIVE",
    kind: "effect",
    accent: "var(--drive-accent)",
    type: "instrument",
  };

  private readonly input: GainNode;
  private readonly pre: GainNode;
  private readonly shaper: WaveShaperNode;
  private readonly tone: BiquadFilterNode;
  private readonly post: GainNode;
  private readonly output: GainNode;
  private readonly audioContext: AudioContext;
  private state: DriveState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createDriveState();

    this.input = new GainNode(audioContext, { gain: 1 });
    this.pre = new GainNode(audioContext);
    this.shaper = new WaveShaperNode(audioContext, {
      curve: DriveController.tanhCurve(),
      oversample: "4x", // waveshapers get oversampled (house rule)
    });
    // Lowpass Q is in dB (Web Audio): -3.01 dB == Butterworth, the steepest
    // MONOTONE response — no resonant bump colouring the clipped harmonics.
    this.tone = new BiquadFilterNode(audioContext, { type: "lowpass", Q: -3.0103 });
    this.post = new GainNode(audioContext);
    this.output = new GainNode(audioContext, { gain: 1 });

    this.input.connect(this.pre);
    this.pre.connect(this.shaper);
    this.shaper.connect(this.tone);
    this.tone.connect(this.post);
    this.post.connect(this.output);

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
    this.input.disconnect();
    this.pre.disconnect();
    this.shaper.disconnect();
    this.tone.disconnect();
    this.post.disconnect();
    this.output.disconnect();
  }

  private static tanhCurve(): Float32Array {
    const n = 8192; // dense enough that the ×30 slope at the origin stays clean
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(SHAPER_RANGE * x);
    }
    return curve;
  }

  handleControlChange(controlId: ControlID, value: number) {
    this.controlHandlers.get(controlId)?.(value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createDriveState(newState as Partial<DriveState>);
    this.syncParams();
    this.dispatch(DriveEvent.SAT, { ...this.state.sat });
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [ControlID.DRIVE_AMOUNT, ControlID.DRIVE_TONE, ControlID.DRIVE_LEVEL].map((id) => ({
      id,
      name: ControlID[id].replace(/^DRIVE_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createDriveState() }];
  }

  // --- Param setters (state write → node ramp → notify UI) ---

  setDrive(value: number) {
    this.state.sat.drive.value = value;
    const now = this.audioContext.currentTime;
    this.pre.gain.setTargetAtTime(this.preGain(), now, RAMP_TC);
    this.post.gain.setTargetAtTime(this.postGain(), now, RAMP_TC); // makeup follows drive
    this.dispatch(DriveEvent.SAT, { ...this.state.sat });
  }

  setTone(value: number) {
    this.state.sat.tone.value = value;
    this.tone.frequency.setTargetAtTime(toneHz(value), this.audioContext.currentTime, RAMP_TC);
    this.dispatch(DriveEvent.SAT, { ...this.state.sat });
  }

  setLevel(value: number) {
    this.state.sat.level.value = value;
    this.post.gain.setTargetAtTime(this.postGain(), this.audioContext.currentTime, RAMP_TC);
    this.dispatch(DriveEvent.SAT, { ...this.state.sat });
  }

  private preGain(): number {
    return driveFactor(this.state.sat.drive.value) / SHAPER_RANGE;
  }

  private postGain(): number {
    return levelGain(this.state.sat.level.value) / Math.sqrt(driveFactor(this.state.sat.drive.value));
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /** Push the whole state to the nodes; snap (no ramp) on init/preset load. */
  private syncParams(snap = false) {
    const now = this.audioContext.currentTime;
    const s = this.state.sat;
    if (snap) {
      this.pre.gain.value = this.preGain();
      this.tone.frequency.value = toneHz(s.tone.value);
      this.post.gain.value = this.postGain();
      return;
    }
    this.pre.gain.setTargetAtTime(this.preGain(), now, RAMP_TC);
    this.tone.frequency.setTargetAtTime(toneHz(s.tone.value), now, RAMP_TC);
    this.post.gain.setTargetAtTime(this.postGain(), now, RAMP_TC);
  }

  private initControlHandlers() {
    const reg = (id: ControlID, update: (v: number) => void) => {
      this.controlHandlers.set(id, update);
    };
    reg(ControlID.DRIVE_AMOUNT, (v) => this.setDrive(v));
    reg(ControlID.DRIVE_TONE, (v) => this.setTone(v));
    reg(ControlID.DRIVE_LEVEL, (v) => this.setLevel(v));
  }
}
