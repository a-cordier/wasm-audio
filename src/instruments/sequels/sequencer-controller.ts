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

import { Channel, Status } from "../../midi/types";
import { MidiBus } from "../../midi/bus/bus";
import { MIDI_EVENT_SIZE } from "../../midi/transport/ring-buffer";
import { SequencerNode } from "./sequencer-node";
import {
  DEFAULT_CONFIG,
  Direction,
  SequencerState,
  Subdivision,
  TransportState,
} from "./types";
import { MidiSourcePlugin, PluginDescriptor, Learnable, LearnableParam } from "../../core/types";
import { ControlID } from "../../control/types";

const DRAIN_INTERVAL_MS = 10;
const HEADER_BYTES = 2 * Int32Array.BYTES_PER_ELEMENT;

/**
 * Main-thread sequencer API.
 * Owns the worklet node, drains MIDI output from the worklet ring buffer,
 * and dispatches events into the MidiBus.
 */
export class SequencerController extends EventTarget implements MidiSourcePlugin, Learnable {
  readonly descriptor: PluginDescriptor = {
    id: "sequels",
    name: "SEQUELS",
    tag: "sequencer-element",
    type: "midi-source",
  };

  private audioContext: AudioContext;
  private node: SequencerNode | null = null;
  private bus: MidiBus | null = null;
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private transport: TransportState = TransportState.STOPPED;
  private _currentStep = -1;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
  }

  init(): void {
    this.node = new SequencerNode(this.audioContext);
    this.node.connect(this.audioContext.destination);

    this.node.onPosition((step) => {
      this._currentStep = step;
      this.dispatchEvent(new CustomEvent("position", { detail: { step } }));
    });
  }

  connectMidiOutput(bus: MidiBus): void {
    this.bus = bus;
  }

  setOutputChannel(ch: Channel): void {
    this.node?.config.setOutputChannel(ch);
  }

  getState(): SequencerState {
    return {
      config: this.node?.config.getConfig() ?? { ...DEFAULT_CONFIG },
      transport: this.transport,
      currentStep: this._currentStep,
    };
  }

  loadState(state: unknown): void {
    // Future: restore pattern + config from serialized state
  }

  dispose(): void {
    this.stop();
    this.node?.disconnect();
    this.node = null;
    this.bus = null;
  }

  get currentStep(): number {
    return this._currentStep;
  }

  get isPlaying(): boolean {
    return this.transport === TransportState.PLAYING;
  }

  // --- Transport ---

  start(): void {
    if (!this.node) return;
    this.transport = TransportState.PLAYING;
    this.node.start();
    this.startDrain();
    this.dispatchEvent(new CustomEvent("transport", { detail: { state: this.transport } }));
  }

  stop(): void {
    if (!this.node) return;
    this.transport = TransportState.STOPPED;
    this.node.stop();
    this.stopDrain();
    this._currentStep = -1;
    this.dispatchEvent(new CustomEvent("transport", { detail: { state: this.transport } }));
  }

  // --- Config setters ---

  setBpm(bpm: number): void {
    this.node?.config.setBpm(bpm);
  }

  setSteps(steps: number): void {
    this.node?.config.setSteps(steps);
  }

  setSubdivision(sub: Subdivision): void {
    this.node?.config.setSubdivision(sub);
  }

  setSwing(swing: number): void {
    this.node?.config.setSwing(swing);
  }

  setGate(gate: number): void {
    this.node?.config.setGate(gate);
  }

  setDirection(dir: Direction): void {
    this.node?.config.setDirection(dir);
  }

  setLoop(loop: boolean): void {
    this.node?.config.setLoop(loop);
  }

  // --- Learnable ---

  getLearnableParams(): LearnableParam[] {
    return [
      { id: ControlID.SEQ_BPM, name: "BPM" },
      { id: ControlID.SEQ_SWING, name: "SWING" },
      { id: ControlID.SEQ_GATE, name: "GATE" },
    ];
  }

  handleControlChange(paramId: number, value: number): void {
    switch (paramId) {
      case ControlID.SEQ_BPM:
        this.setBpm(Math.round(40 + (value / 127) * 200));
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.SEQ_SWING:
        this.setSwing(value / 127);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.SEQ_GATE:
        this.setGate(0.1 + (value / 127) * 0.9);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
    }
  }

  // --- Pattern ---

  setStep(index: number, note: number, velocity: number): void {
    this.node?.pattern.setStep(index, note, velocity);
  }

  clearStep(index: number): void {
    this.node?.pattern.clearStep(index);
  }

  toggleStep(index: number, note: number, velocity: number): boolean {
    if (!this.node) return false;
    if (this.node.pattern.isStepActive(index)) {
      this.node.pattern.clearStep(index);
      return false;
    }
    this.node.pattern.setStep(index, note, velocity);
    return true;
  }

  getStep(index: number): { note: number; velocity: number } {
    return this.node?.pattern.getStep(index) ?? { note: 0, velocity: 0 };
  }

  clearPattern(): void {
    this.node?.pattern.clear();
  }

  // --- Drain loop ---

  private startDrain(): void {
    if (this.drainTimer !== null) return;
    this.drainTimer = setInterval(() => this.drain(), DRAIN_INTERVAL_MS);
  }

  private stopDrain(): void {
    if (this.drainTimer !== null) {
      clearInterval(this.drainTimer);
      this.drainTimer = null;
    }
    // Final drain to catch any remaining note-offs
    this.drain();
  }

  private drain(): void {
    if (!this.node || !this.bus) return;

    const ring = this.node.outputRing;
    const heads = new Int32Array(ring.buffer, 0, 2);
    const data = new Float32Array(ring.buffer, HEADER_BYTES);
    const capacity = (ring.buffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);

    let read = Atomics.load(heads, 0);
    const write = Atomics.load(heads, 1);

    while (read !== write) {
      const offset = read * MIDI_EVENT_SIZE;
      const packed = data[offset];
      const timestamp = data[offset + 1];

      const status = ((packed >> 20) & 0x0f) as Status;
      const channel = ((packed >> 16) & 0x0f) as Channel;
      const d1 = (packed >> 8) & 0x7f;
      const d2 = packed & 0x7f;

      this.bus.send(status, channel, d1, d2, timestamp);

      read = (read + 1) % capacity;
      Atomics.store(heads, 0, read);
    }
  }
}
