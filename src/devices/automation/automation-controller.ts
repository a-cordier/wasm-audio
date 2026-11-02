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

/**
 * The first kind:"module" device (roadmap item 6): a control-signal source —
 * no audio, no MIDI, no mixer channel. It plays a shape (LFO waveforms or a
 * step lane) and writes raw 0..127 values to one learnable param of one
 * mounted device, addressed (slotId, ControlID) through the ParamDirectory —
 * the same addresses MIDI-learn dispatches to, so the target's engine and
 * panel both follow. Deliberately NOT Learnable itself: it stays out of its
 * own directory, so no modulation feedback paths exist.
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

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createAutomationState();
  }

  init() {}

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.transport = null;
  }

  // Snapshots must not alias live state: steps/target are nested and mutable.
  getState(): AutomationState {
    return createAutomationState(this.state);
  }

  setState(newState: unknown) {
    this.state = createAutomationState(newState as Partial<AutomationState>);
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
    this.dispatch(AutomationEvent.STEPS, this.copySteps());
    this.dispatch(AutomationEvent.TARGET, { ...this.state.target });
    return this.getState();
  }

  // --- Transport (child clock mode: master start/stop drive the cycle) ---

  setTransport(transport: TransportController | null) {
    this.transport = transport;
    if (!transport) this.masterRunning = false;
  }

  onMasterStart(_anchor: TransportAnchor): void {
    this.masterRunning = true;
  }

  onMasterStop(): void {
    this.masterRunning = false;
  }

  /** Beats are read live off the transport each tick — nothing to restamp. */
  onMasterTempo(_bpm: number): void {}

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
    this.dispatch(AutomationEvent.SIGNAL, { ...this.state.signal });
  }

  setTarget(slotId: string | null, controlId: number) {
    this.state.target = { slotId, controlId };
    this.dispatch(AutomationEvent.TARGET, { ...this.state.target });
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
