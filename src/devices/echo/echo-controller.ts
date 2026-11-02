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

import { EchoState, createEchoState } from "./types/echo-state";
import { EchoEvent } from "./types/echo-event";
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

/** 10 ms one-pole on feedback/tone — the mixer's anti-zipper constant. */
const RAMP_TC = 0.01;
/** delayTime ramps slower on purpose: the glide IS the tape pitch-bend. */
const TIME_RAMP_TC = 0.03;

// Raw 0..127 → real units (the controller is the engine for a native-node
// device, so the Range mapping lives here, at the node boundary).
const timeSeconds = (raw: number) => 0.01 * Math.pow(100, raw / 127); // 10 ms..1 s, log
const feedbackGain = (raw: number) => 0.9 * (raw / 127); // 0..0.9, never self-oscillates
const toneHz = (raw: number) => 500 * Math.pow(24, raw / 127); // 500 Hz..12 kHz, log

/**
 * The minimal send/return delay — the first kind:"effect" device. 100% wet
 * by design: the dry signal stays on the sending channels, the mixer's send
 * bus feeds getInputNode(), and the output returns on this device's own
 * channel. Native nodes only (no worklet, no build step):
 *
 *   input → delay → tone(lowpass) → output
 *                      └→ feedback → delay   (repeats darken each pass)
 */
export class EchoController extends EventTarget implements Plugin, AudioProducer, AudioEffect, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "echo",
    name: "ECHO",
    kind: "effect",
    accent: "var(--echo-accent)",
    type: "instrument",
  };

  private readonly input: GainNode;
  private readonly delay: DelayNode;
  private readonly feedback: GainNode;
  private readonly saturator: WaveShaperNode;
  private readonly tone: BiquadFilterNode;
  private readonly output: GainNode;
  private readonly audioContext: AudioContext;
  private state: EchoState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createEchoState();

    this.input = new GainNode(audioContext, { gain: 1 });
    this.delay = new DelayNode(audioContext, { maxDelayTime: 2 });
    // Lowpass Q is in dB (Web Audio): -3.01 dB == Butterworth, the steepest
    // MONOTONE response. Anything peakier multiplies into the loop — at
    // Q "0" (== linear 1, +1.25 dB peak) the loop gain hit 0.9 × 1.15 > 1
    // and the echo self-oscillated at tight delay times.
    this.tone = new BiquadFilterNode(audioContext, { type: "lowpass", Q: -3.0103 });
    this.feedback = new GainNode(audioContext);
    // Tape-style loop saturation: recirculating energy soft-clips through
    // tanh (unity slope at small signal, so decay character is untouched),
    // which bounds a hot high-FDBK stack instead of letting the comb build
    // toward 1/(1-g) and slam the master limiter.
    this.saturator = new WaveShaperNode(audioContext, {
      curve: EchoController.tanhCurve(),
      oversample: "4x",
    });
    this.output = new GainNode(audioContext, { gain: 1 });

    this.input.connect(this.delay);
    this.delay.connect(this.tone);
    this.tone.connect(this.output);
    this.tone.connect(this.feedback);
    this.feedback.connect(this.saturator);
    this.saturator.connect(this.delay);

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
    this.delay.disconnect();
    this.tone.disconnect();
    this.feedback.disconnect();
    this.saturator.disconnect();
    this.output.disconnect();
  }

  private static tanhCurve(): Float32Array {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      curve[i] = Math.tanh((i / (n - 1)) * 2 - 1);
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
    this.state = createEchoState(newState as Partial<EchoState>);
    this.syncParams();
    this.dispatch(EchoEvent.DELAY, { ...this.state.delay });
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [ControlID.ECHO_TIME, ControlID.ECHO_FEEDBACK, ControlID.ECHO_TONE].map((id) => ({
      id,
      name: ControlID[id].replace(/^ECHO_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createEchoState() }];
  }

  // --- Param setters (state write → node ramp → notify UI) ---

  setTime(value: number) {
    this.state.delay.time.value = value;
    this.delay.delayTime.setTargetAtTime(timeSeconds(value), this.audioContext.currentTime, TIME_RAMP_TC);
    this.dispatch(EchoEvent.DELAY, { ...this.state.delay });
  }

  setFeedback(value: number) {
    this.state.delay.feedback.value = value;
    this.feedback.gain.setTargetAtTime(feedbackGain(value), this.audioContext.currentTime, RAMP_TC);
    this.dispatch(EchoEvent.DELAY, { ...this.state.delay });
  }

  setTone(value: number) {
    this.state.delay.tone.value = value;
    this.tone.frequency.setTargetAtTime(toneHz(value), this.audioContext.currentTime, RAMP_TC);
    this.dispatch(EchoEvent.DELAY, { ...this.state.delay });
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /** Push the whole state to the nodes; snap (no ramp) on init/preset load. */
  private syncParams(snap = false) {
    const now = this.audioContext.currentTime;
    const d = this.state.delay;
    if (snap) {
      this.delay.delayTime.value = timeSeconds(d.time.value);
      this.feedback.gain.value = feedbackGain(d.feedback.value);
      this.tone.frequency.value = toneHz(d.tone.value);
      return;
    }
    this.delay.delayTime.setTargetAtTime(timeSeconds(d.time.value), now, TIME_RAMP_TC);
    this.feedback.gain.setTargetAtTime(feedbackGain(d.feedback.value), now, RAMP_TC);
    this.tone.frequency.setTargetAtTime(toneHz(d.tone.value), now, RAMP_TC);
  }

  private initControlHandlers() {
    const reg = (id: ControlID, update: (v: number) => void) => {
      this.controlHandlers.set(id, update);
    };
    reg(ControlID.ECHO_TIME, (v) => this.setTime(v));
    reg(ControlID.ECHO_FEEDBACK, (v) => this.setFeedback(v));
    reg(ControlID.ECHO_TONE, (v) => this.setTone(v));
  }
}
