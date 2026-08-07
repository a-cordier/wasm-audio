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
import { TemplateState, createTemplateState } from "./types/template-state";
import { TemplateEvent } from "./types/template-event";
import { MidiEvent, MidiTarget } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { isNoteOn, isNoteOff } from "../../midi/codec/decode";
import { ControlID } from "../../control/types";
import {
  InstrumentPlugin,
  PluginDescriptor,
  Learnable,
  HasPresets,
  LearnableParam,
  PresetEntry,
} from "../../core/types";

type ControlHandler = (value: number) => void;

/**
 * Reference controller. It owns: the audio graph (worklet node → output gain),
 * MIDI in (notes → node), the authoritative state, param sync, MIDI-learn
 * handlers, and preset load. New instruments follow this exact shape.
 */
export class TemplateController extends EventTarget implements InstrumentPlugin, MidiTarget, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "template",
    name: "TEMPLATE",
    tag: "template-element",
    type: "instrument",
  };

  private node: TemplateNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;
  private state: TemplateState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

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
    this.output.disconnect();
    this.node = null;
  }

  receive(event: MidiEvent): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    if (isNoteOn(event)) {
      const frequency = noteFrequency(event.data1);
      this.node?.noteOn(event.data1, frequency, event.data2);
      this.dispatch(TemplateEvent.NOTE_ON, { midiValue: event.data1, frequency, velocity: event.data2 });
    } else if (isNoteOff(event)) {
      this.node?.noteOff(event.data1);
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
    // Continuous knobs only — the WAVE selector and OCTAVE stepper drive directly.
    return [ControlID.TPL_ATTACK, ControlID.TPL_RELEASE, ControlID.TPL_LEVEL].map((id) => ({
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

  subscribe(eventId: string, callback: (detail: any) => void) {
    this.addEventListener(eventId, (e) => callback((e as CustomEvent).detail));
    return this;
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
  }

  private syncParams() {
    if (!this.node) return;
    const s = this.state;
    this.sendParam(TemplateParamId.WAVE, s.osc.wave.value);
    this.sendParam(TemplateParamId.OCTAVE, s.osc.octave.value);
    this.sendParam(TemplateParamId.ATTACK, s.amp.attack.value);
    this.sendParam(TemplateParamId.RELEASE, s.amp.release.value);
    this.sendParam(TemplateParamId.LEVEL, s.amp.level.value);
  }

  private initControlHandlers() {
    const reg = (id: ControlID, paramId: number, update: (v: number) => void) => {
      this.controlHandlers.set(id, (value: number) => {
        update(value);
        this.sendParam(paramId, value);
        this.dispatch(TemplateEvent.AMP, { ...this.state.amp });
      });
    };
    reg(ControlID.TPL_ATTACK, TemplateParamId.ATTACK, (v) => { this.state.amp.attack.value = v; });
    reg(ControlID.TPL_RELEASE, TemplateParamId.RELEASE, (v) => { this.state.amp.release.value = v; });
    reg(ControlID.TPL_LEVEL, TemplateParamId.LEVEL, (v) => { this.state.amp.level.value = v; });
  }
}
