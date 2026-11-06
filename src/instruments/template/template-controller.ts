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

import { TemplateNode } from "./template-node";
import { TemplateParamId } from "./types/template-params";
import { DIVISIONS } from "../../core/divisions";
import { TemplateState, createTemplateState } from "./types/template-state";
import { TemplateEvent } from "./types/template-event";
import { MidiEvent, MidiTarget } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { isNoteOn, isNoteOff } from "../../midi/codec/decode";
import { ControlID } from "../../control/types";
import {
  ClockObserver,
  InstrumentPlugin,
  PluginDescriptor,
  Learnable,
  HasPresets,
  LearnableParam,
  PresetEntry,
  TransportAnchor,
} from "../../core/types";

type ControlHandler = (value: number) => void;

/**
 * Reference controller. It owns: the audio graph (worklet node → output gain),
 * MIDI in (notes → node), the authoritative state, param sync, MIDI-learn
 * handlers, and preset load. New instruments follow this exact shape.
 */
export class TemplateController extends EventTarget implements InstrumentPlugin, MidiTarget, Learnable, HasPresets, ClockObserver {
  readonly descriptor: PluginDescriptor = {
    id: "template",
    name: "TEMPLATE",
    kind: "instrument",
    accent: "var(--template-accent)",
    type: "instrument",
  };

  private node: TemplateNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;
  private state: TemplateState;
  private controlHandlers = new Map<ControlID, ControlHandler>();
  // observe() may fire before init() creates the node — replayed there.
  private lastClock: { anchor: TransportAnchor; playing: boolean } | null = null;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
    this.state = createTemplateState();
    this.initControlHandlers();
  }

  init() {
    this.node = new TemplateNode(this.audioContext);
    this.node.connect(this.output);
    this.syncParams();
    if (this.lastClock) this.onClock(this.lastClock.anchor, this.lastClock.playing);
  }

  /**
   * ClockObserver — the shell wires this at mount (transport.observe), so the
   * master clock always flows to the worklet; whether it is USED is the LFO's
   * own SYNC param. Fires on start/stop/tempo and once on observe.
   */
  onClock(anchor: TransportAnchor, playing: boolean): void {
    this.lastClock = { anchor, playing };
    this.node?.setClock(anchor.startFrame, anchor.bpm, playing);
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

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.node?.dispose();
    this.node = null;
    this.output.disconnect();
  }

  receive(event: MidiEvent): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    if (isNoteOn(event)) {
      const frequency = noteFrequency(event.data1);
      this.node?.noteOn(event.data1, frequency, event.data2, event.frame ?? 0);
      this.dispatch(TemplateEvent.NOTE_ON, { midiValue: event.data1, frequency, velocity: event.data2 });
    } else if (isNoteOff(event)) {
      this.node?.noteOff(event.data1, event.frame ?? 0);
      this.dispatch(TemplateEvent.NOTE_OFF, { midiValue: event.data1 });
    }
  }

  handleControlChange(controlId: ControlID, value: number) {
    this.controlHandlers.get(controlId)?.(value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createTemplateState(newState as Partial<TemplateState>);
    this.syncParams();
    this.notifyStateChange();
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    // Continuous knobs only — the WAVE selector and the OCTAVE/DIV steppers
    // and SYNC toggle drive directly (selectors are never learnable).
    return [
      ControlID.TPL_ATTACK,
      ControlID.TPL_RELEASE,
      ControlID.TPL_LEVEL,
      ControlID.TPL_LFO_RATE,
      ControlID.TPL_LFO_AMT,
    ].map((id) => ({
      id,
      name: ControlID[id].replace(/^TPL_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createTemplateState() }];
  }

  // --- Param setters (state write → node → notify UI) ---

  setWave(value: number) {
    this.state.osc.wave.value = value;
    this.sendParam(TemplateParamId.WAVE, value);
    this.dispatch(TemplateEvent.OSC, { ...this.state.osc });
  }

  setOctave(value: number) {
    this.state.osc.octave.value = value;
    this.sendParam(TemplateParamId.OCTAVE, value);
    this.dispatch(TemplateEvent.OSC, { ...this.state.osc });
  }

  setAttack(value: number) {
    this.state.amp.attack.value = value;
    this.sendParam(TemplateParamId.ATTACK, value);
    this.dispatch(TemplateEvent.AMP, { ...this.state.amp });
  }

  setRelease(value: number) {
    this.state.amp.release.value = value;
    this.sendParam(TemplateParamId.RELEASE, value);
    this.dispatch(TemplateEvent.AMP, { ...this.state.amp });
  }

  setLevel(value: number) {
    this.state.amp.level.value = value;
    this.sendParam(TemplateParamId.LEVEL, value);
    this.dispatch(TemplateEvent.AMP, { ...this.state.amp });
  }

  setLfoRate(value: number) {
    // Ghosted under SYNC exactly like the panel knob: the master clock owns
    // the rate, so external writers (MIDI-learn CCs, automation) are inert
    // too — the control handlers route through this setter, which is where
    // every input path converges (the sequels SEQ_BPM rule).
    if (this.state.lfo.sync.value >= 64) return;
    this.state.lfo.rate.value = value;
    this.sendParam(TemplateParamId.LFO_RATE, value);
    this.dispatch(TemplateEvent.LFO, { ...this.state.lfo });
  }

  setLfoAmount(value: number) {
    this.state.lfo.amount.value = value;
    this.sendParam(TemplateParamId.LFO_AMOUNT, value);
    this.dispatch(TemplateEvent.LFO, { ...this.state.lfo });
  }

  setLfoSync(value: number) {
    this.state.lfo.sync.value = value;
    this.sendParam(TemplateParamId.LFO_SYNC, value);
    this.dispatch(TemplateEvent.LFO, { ...this.state.lfo });
  }

  setLfoDiv(index: number) {
    // The controller owns authoritative state: clamp here, not only in the
    // panel, so programmatic writers can't persist an out-of-range index.
    const next = Math.max(0, Math.min(DIVISIONS.length - 1, Math.round(index)));
    this.state.lfo.div.value = next;
    this.sendParam(TemplateParamId.LFO_DIV, next);
    this.dispatch(TemplateEvent.LFO, { ...this.state.lfo });
  }

  private sendParam(id: number, value: number) {
    this.node?.setParam(id, value);
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  private notifyStateChange() {
    this.dispatch(TemplateEvent.OSC, { ...this.state.osc });
    this.dispatch(TemplateEvent.AMP, { ...this.state.amp });
    this.dispatch(TemplateEvent.LFO, { ...this.state.lfo });
  }

  private syncParams() {
    if (!this.node) return;
    const s = this.state;
    this.sendParam(TemplateParamId.WAVE, s.osc.wave.value);
    this.sendParam(TemplateParamId.OCTAVE, s.osc.octave.value);
    this.sendParam(TemplateParamId.ATTACK, s.amp.attack.value);
    this.sendParam(TemplateParamId.RELEASE, s.amp.release.value);
    this.sendParam(TemplateParamId.LEVEL, s.amp.level.value);
    this.sendParam(TemplateParamId.LFO_RATE, s.lfo.rate.value);
    this.sendParam(TemplateParamId.LFO_AMOUNT, s.lfo.amount.value);
    this.sendParam(TemplateParamId.LFO_SYNC, s.lfo.sync.value);
    this.sendParam(TemplateParamId.LFO_DIV, s.lfo.div.value);
  }

  private initControlHandlers() {
    // External control writes (MIDI-learn CCs, automation dispatch) route
    // through the PUBLIC setters, so any gate there (setLfoRate under SYNC)
    // covers every input path at once.
    this.controlHandlers.set(ControlID.TPL_ATTACK, (v) => this.setAttack(v));
    this.controlHandlers.set(ControlID.TPL_RELEASE, (v) => this.setRelease(v));
    this.controlHandlers.set(ControlID.TPL_LEVEL, (v) => this.setLevel(v));
    this.controlHandlers.set(ControlID.TPL_LFO_RATE, (v) => this.setLfoRate(v));
    this.controlHandlers.set(ControlID.TPL_LFO_AMT, (v) => this.setLfoAmount(v));
  }
}
