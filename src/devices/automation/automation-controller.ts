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

import { AutomationState, createAutomationState, SHAPES, DIVISIONS } from "./types/automation-state";
import { AutomationEvent } from "./types/automation-event";
import {
  Plugin,
  PluginDescriptor,
  TransportChild,
  TransportAnchor,
} from "../../core/types";
import { TransportController } from "../../midi/transport/transport-controller";
import { getParamDirectory } from "../../control/param-directory";

// Raw 0..127 → real units (the controller is the engine for a module —
// the mapping lives here, like echo's node boundary).
const rateHz = (raw: number) => 0.02 * Math.pow(1000, raw / 127); // 0.02..20 Hz, log
const glideSeconds = (raw: number) => (raw === 0 ? 0 : 0.002 * Math.pow(1000, raw / 127)); // 2 ms..2 s, log

/** A freshly-picked target gets a beat to settle before the signal lands:
 * stepping the DEVICE stepper across a device must not slam its first
 * param in passing (SEQUELS' is BPM — a drive-by write there is loud). */
const TARGET_SETTLE_MS = 400;

/**
 * The first kind:"module" device (roadmap item 6): a control-signal source —
 * no audio, no MIDI, no mixer channel. It plays a shape (LFO waveforms or a
 * step lane) and writes raw 0..127 values to one learnable param of one
 * mounted device, addressed (slotId, ControlID) through the ParamDirectory —
 * the same addresses MIDI-learn dispatches to, so the target's engine and
 * panel both follow. Deliberately NOT Learnable itself: it stays out of its
 * own directory, so no modulation feedback paths exist.
 *
 * Timing: a worklet clock posts frames at control rate (hidden tabs clamp
 * main-thread timers, not port messages); each tick this controller derives
 * the cycle phase — `transport.beatsAt()` live when synced (tempo changes
 * come free: setBpm re-anchors), a phase accumulator when free-running —
 * evaluates the shape, slews it (GLIDE), maps it into [MIN, MAX], and
 * dispatches only when the quantized raw value moved.
 */
export class AutomationController extends EventTarget implements Plugin, TransportChild {
  readonly descriptor: PluginDescriptor = {
    id: "automation",
    name: "MOTION",
    kind: "module",
    accent: "var(--automation-accent)",
    type: "control",
  };

  private readonly audioContext: AudioContext;
  private state: AutomationState;
  /** Master clock handle while SYNC is on (wireSync passes/clears it). */
  private transport: TransportController | null = null;
  private masterRunning = false;

  private node: AudioWorkletNode | null = null;
  /** The clock's silent pull into the graph — unpulled worklets never run. */
  private pull: GainNode | null = null;
  private clockGateOn = false;

  // --- Motion state (reset whenever the clock gate opens) ---
  private freePhase = 0;
  private lastTickFrame = -1;
  private shCycle: number | null = null;
  private shValue = 0;
  private slewY = 0;
  private snapSlew = true;
  private lastSentRaw = -1;
  /** 0 = settled (restored targets dispatch at once); setTarget re-arms it. */
  private targetSetAt = 0;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createAutomationState();
  }

  init() {
    this.node = new AudioWorkletNode(this.audioContext, "automation", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    this.pull = new GainNode(this.audioContext, { gain: 0 });
    this.node.connect(this.pull).connect(this.audioContext.destination);
    this.node.port.onmessage = (e) => {
      if (e.data?.type === "__tick") this.onTick(e.data.frame as number);
    };
    this.updateClockGate();
  }

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.node?.port.postMessage({ type: "__dispose" });
    this.node?.disconnect();
    this.pull?.disconnect();
    this.node = null;
    this.pull = null;
    this.transport = null;
  }

  // Snapshots must not alias live state: steps/target are nested and mutable.
  getState(): AutomationState {
    return createAutomationState(this.state);
  }

  setState(newState: unknown) {
    this.state = createAutomationState(newState as Partial<AutomationState>);
    this.lastSentRaw = -1;
    this.updateClockGate();
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
    this.dispatch(AutomationEvent.STEPS, this.copySteps());
    this.dispatch(AutomationEvent.TARGET, { ...this.state.target });
    return this.getState();
  }

  // --- Transport (child clock mode: master start/stop drive the cycle) ---

  setTransport(transport: TransportController | null) {
    this.transport = transport;
    if (!transport) this.masterRunning = false;
    this.updateClockGate();
  }

  onMasterStart(_anchor: TransportAnchor): void {
    this.masterRunning = true;
    this.updateClockGate();
  }

  onMasterStop(): void {
    this.masterRunning = false;
    this.updateClockGate();
  }

  /** Beats are read live off the transport each tick — nothing to restamp. */
  onMasterTempo(_bpm: number): void {}

  // --- The tick loop (control-rate, worklet-clocked) ---

  private isRunning(): boolean {
    return this.transport ? this.masterRunning : this.state.signal.run.value === 1;
  }

  private updateClockGate() {
    const on = this.isRunning();
    if (on && !this.clockGateOn) this.resetMotion();
    this.clockGateOn = on;
    this.node?.port.postMessage({ type: "__run", on });
  }

  /** A fresh run starts its cycle at phase 0 with the slew snapped — the
   * first value lands exactly, never sweeps in from a stale level. */
  private resetMotion() {
    this.freePhase = 0;
    this.lastTickFrame = -1;
    this.shCycle = null;
    this.snapSlew = true;
    this.lastSentRaw = -1;
  }

  private onTick(frame: number) {
    const s = this.state.signal;
    const sr = this.audioContext.sampleRate;
    const dtSec = this.lastTickFrame < 0 ? 0 : (frame - this.lastTickFrame) / sr;
    this.lastTickFrame = frame;

    // Cycle position: musical when synced (downbeat-anchored, shared with
    // every synced device), an accumulator when free (rate changes bend the
    // motion without jumping its phase).
    let phase: number;
    let cycle: number;
    if (this.transport) {
      const cycles = this.transport.beatsAt(frame / sr) / DIVISIONS[s.div.value].beats;
      cycle = Math.floor(cycles);
      phase = cycles - cycle;
    } else {
      this.freePhase += dtSec * rateHz(s.rate.value);
      cycle = Math.floor(this.freePhase);
      phase = this.freePhase - cycle;
    }

    // S&H holds one random level per cycle; resample on the wrap.
    if (cycle !== this.shCycle) {
      this.shCycle = cycle;
      this.shValue = Math.random();
    }

    let v = this.evalShape(phase);

    // Universal output slew: a lag processor is never a dead control — it
    // smears SQR/S&H/STEP into portamento and rounds the rest at speed.
    const tau = glideSeconds(s.glide.value);
    if (this.snapSlew || tau <= 0 || dtSec <= 0) {
      this.slewY = v;
      this.snapSlew = false;
    } else {
      this.slewY += (1 - Math.exp(-dtSec / tau)) * (v - this.slewY);
    }

    // The motion keeps running through the settle window — only the
    // dispatch holds, and lastSentRaw stays -1 so the first settled tick
    // lands the current value immediately.
    if (performance.now() - this.targetSetAt < TARGET_SETTLE_MS) return;

    // [MIN, MAX] in raw 0..127 (MIN > MAX inverts); quantization gates the
    // dispatch, so an idle shape costs nothing downstream.
    const raw = Math.round(s.min.value + this.slewY * (s.max.value - s.min.value));
    if (raw !== this.lastSentRaw) {
      this.lastSentRaw = raw;
      getParamDirectory()
        .resolve(this.state.target.slotId)
        ?.plugin.handleControlChange(this.state.target.controlId, raw);
    }
  }

  private evalShape(phase: number): number {
    switch (SHAPES[this.state.signal.shape.value]) {
      case "SIN": // starts at the floor on the downbeat, peaks mid-cycle
        return 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
      case "TRI":
        return phase < 0.5 ? phase * 2 : 2 - phase * 2;
      case "RMP":
        return phase;
      case "SQR": // high half first: the downbeat hits MAX
        return phase < 0.5 ? 1 : 0;
      case "S&H":
        return this.shValue;
      case "STEP": {
        const st = this.state.steps;
        return st.values[Math.floor(phase * st.count) % st.count] / 127;
      }
    }
  }

  // --- Param setters (state write → notify UI; the tick loop reads state) ---

  setShape(index: number) {
    this.state.signal.shape.value = Math.max(0, Math.min(SHAPES.length - 1, Math.round(index)));
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setRate(value: number) {
    this.state.signal.rate.value = value;
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setDiv(index: number) {
    this.state.signal.div.value = Math.max(0, Math.min(DIVISIONS.length - 1, Math.round(index)));
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setMin(value: number) {
    this.state.signal.min.value = value;
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setMax(value: number) {
    this.state.signal.max.value = value;
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setGlide(value: number) {
    this.state.signal.glide.value = value;
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setRun(on: boolean) {
    this.state.signal.run.value = on ? 1 : 0;
    this.updateClockGate();
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setTarget(slotId: string | null, controlId: number) {
    this.state.target = { slotId, controlId };
    this.lastSentRaw = -1;
    this.targetSetAt = performance.now();
    this.dispatch(AutomationEvent.TARGET, { ...this.state.target });
  }

  setStep(index: number, value: number) {
    const st = this.state.steps;
    if (index < 0 || index >= st.values.length) return;
    st.values[index] = Math.max(0, Math.min(127, Math.round(value)));
    this.dispatch(AutomationEvent.STEPS, this.copySteps());
  }

  setStepCount(count: number) {
    this.state.steps.count = Math.max(2, Math.min(this.state.steps.values.length, Math.round(count)));
    this.dispatch(AutomationEvent.STEPS, this.copySteps());
  }

  // --- Reads the panel renders from ---

  getTarget() {
    return { ...this.state.target };
  }

  isMasterRunning() {
    return this.masterRunning;
  }

  private copySteps() {
    return { count: this.state.steps.count, values: [...this.state.steps.values] };
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
}
