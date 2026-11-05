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

import { DrumlinNode } from "./drumlin-node";
import { DrumlinParamId as P } from "./types/drumlin-params";
import { DrumlinState, Field, createDrumlinState } from "./types/drumlin-state";
import { DrumlinEvent } from "./types/drumlin-event";
import { DrumlinFactoryPresets } from "./presets";
import { voiceForNote } from "./types/drumlin-notes";
import { MidiEvent, MidiTarget } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { isNoteOn } from "../../midi/codec/decode";
import { ControlID } from "../../control/types";
import {
  InstrumentPlugin,
  PluginDescriptor,
  Learnable,
  HasPresets,
  LearnableParam,
  PresetEntry,
} from "../../core/types";

// Every param is a continuous knob, so one table drives the whole control
// plane: panel setters, MIDI-learn, automation and syncParams all converge on
// setControl() — the single gate for external writes.
interface ControlSpec {
  control: ControlID;
  param: number;
  event: DrumlinEvent;
  field: (s: DrumlinState) => Field;
  section: (s: DrumlinState) => object;
}

const PAD_VELOCITY = 100;

/**
 * DRUMLIN: 6-voice analog-modeled drum synth. One-shot voices — note-ons
 * trigger, note-offs are ignored (tails always ring out; sequels' GATE has no
 * effect by design, like any drum machine).
 */
export class DrumlinController extends EventTarget implements InstrumentPlugin, MidiTarget, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "drumlin",
    name: "DRUMLIN",
    kind: "instrument",
    accent: "var(--drumlin-accent)",
    type: "instrument",
  };

  private node: DrumlinNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;
  private state: DrumlinState;
  private specs = new Map<ControlID, ControlSpec>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
    this.state = createDrumlinState();
    this.initControlSpecs();
  }

  init() {
    this.node = new DrumlinNode(this.audioContext);
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
    this.node?.dispose();
    this.node = null;
    this.output.disconnect();
  }

  receive(event: MidiEvent): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    // One-shot drums: note-offs carry no meaning, so they never enter the ring.
    if (!isNoteOn(event)) return;
    const voice = voiceForNote(event.data1);
    if (!voice) return; // unmapped GM notes are silent by design
    this.node?.noteOn(event.data1, noteFrequency(event.data1), event.data2, event.frame ?? 0);
    this.dispatch(DrumlinEvent.TRIGGER, { voice, midiValue: event.data1, velocity: event.data2 });
  }

  /** Pad audition path (panel pointerdown) — plays now (frame 0). */
  trigger(note: number, velocity = PAD_VELOCITY): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    const voice = voiceForNote(note);
    if (!voice) return;
    this.node?.noteOn(note, noteFrequency(note), velocity, 0);
    this.dispatch(DrumlinEvent.TRIGGER, { voice, midiValue: note, velocity });
  }

  /** The one setter: panel knobs, MIDI-learn and automation all land here. */
  setControl(control: ControlID, value: number) {
    const spec = this.specs.get(control);
    if (!spec) return;
    spec.field(this.state).value = value;
    this.sendParam(spec.param, value);
    this.dispatch(spec.event, { ...spec.section(this.state) });
  }

  handleControlChange(controlId: ControlID, value: number) {
    this.setControl(controlId, value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createDrumlinState(newState as Partial<DrumlinState>);
    this.syncParams();
    this.notifyStateChange();
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [...this.specs.keys()].map((id) => ({
      id,
      name: ControlID[id].replace(/^DRM_/, "").replace(/_/g, " "),
    }));
  }

  getFactoryPresets(): PresetEntry[] {
    return DrumlinFactoryPresets;
  }

  private sendParam(id: number, value: number) {
    this.node?.setParam(id, value);
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  private notifyStateChange() {
    const s = this.state;
    this.dispatch(DrumlinEvent.KICK, { ...s.kick });
    this.dispatch(DrumlinEvent.SNARE, { ...s.snare });
    this.dispatch(DrumlinEvent.CLAP, { ...s.clap });
    this.dispatch(DrumlinEvent.HATS, { ...s.hats });
    this.dispatch(DrumlinEvent.TOM, { ...s.tom });
    this.dispatch(DrumlinEvent.RIM, { ...s.rim });
    this.dispatch(DrumlinEvent.RIDE, { ...s.ride });
    this.dispatch(DrumlinEvent.CRASH, { ...s.crash });
    this.dispatch(DrumlinEvent.OUT, { ...s.out });
  }

  private syncParams() {
    if (!this.node) return;
    for (const spec of this.specs.values()) {
      this.sendParam(spec.param, spec.field(this.state).value);
    }
  }

  private initControlSpecs() {
    const reg = (
      control: ControlID,
      param: number,
      event: DrumlinEvent,
      field: (s: DrumlinState) => Field,
      section: (s: DrumlinState) => object
    ) => this.specs.set(control, { control, param, event, field, section });

    const C = ControlID;
    const E = DrumlinEvent;
    reg(C.DRM_KICK_TUNE, P.KICK_TUNE, E.KICK, (s) => s.kick.tune, (s) => s.kick);
    reg(C.DRM_KICK_PUNCH, P.KICK_PUNCH, E.KICK, (s) => s.kick.punch, (s) => s.kick);
    reg(C.DRM_KICK_DECAY, P.KICK_DECAY, E.KICK, (s) => s.kick.decay, (s) => s.kick);
    reg(C.DRM_KICK_LEVEL, P.KICK_LEVEL, E.KICK, (s) => s.kick.level, (s) => s.kick);
    reg(C.DRM_SNARE_TUNE, P.SNARE_TUNE, E.SNARE, (s) => s.snare.tune, (s) => s.snare);
    reg(C.DRM_SNARE_SNAP, P.SNARE_SNAP, E.SNARE, (s) => s.snare.snap, (s) => s.snare);
    reg(C.DRM_SNARE_DECAY, P.SNARE_DECAY, E.SNARE, (s) => s.snare.decay, (s) => s.snare);
    reg(C.DRM_SNARE_LEVEL, P.SNARE_LEVEL, E.SNARE, (s) => s.snare.level, (s) => s.snare);
    reg(C.DRM_CLAP_TONE, P.CLAP_TONE, E.CLAP, (s) => s.clap.tone, (s) => s.clap);
    reg(C.DRM_CLAP_DECAY, P.CLAP_DECAY, E.CLAP, (s) => s.clap.decay, (s) => s.clap);
    reg(C.DRM_CLAP_LEVEL, P.CLAP_LEVEL, E.CLAP, (s) => s.clap.level, (s) => s.clap);
    reg(C.DRM_HAT_TONE, P.HAT_TONE, E.HATS, (s) => s.hats.tone, (s) => s.hats);
    reg(C.DRM_CH_DECAY, P.CH_DECAY, E.HATS, (s) => s.hats.chDecay, (s) => s.hats);
    reg(C.DRM_CH_LEVEL, P.CH_LEVEL, E.HATS, (s) => s.hats.chLevel, (s) => s.hats);
    reg(C.DRM_OH_DECAY, P.OH_DECAY, E.HATS, (s) => s.hats.ohDecay, (s) => s.hats);
    reg(C.DRM_OH_LEVEL, P.OH_LEVEL, E.HATS, (s) => s.hats.ohLevel, (s) => s.hats);
    reg(C.DRM_TOM_TUNE, P.TOM_TUNE, E.TOM, (s) => s.tom.tune, (s) => s.tom);
    reg(C.DRM_TOM_DECAY, P.TOM_DECAY, E.TOM, (s) => s.tom.decay, (s) => s.tom);
    reg(C.DRM_TOM_LEVEL, P.TOM_LEVEL, E.TOM, (s) => s.tom.level, (s) => s.tom);
    reg(C.DRM_ACCENT, P.ACCENT, E.OUT, (s) => s.out.accent, (s) => s.out);
    reg(C.DRM_RIM_TUNE, P.RIM_TUNE, E.RIM, (s) => s.rim.tune, (s) => s.rim);
    reg(C.DRM_RIM_DECAY, P.RIM_DECAY, E.RIM, (s) => s.rim.decay, (s) => s.rim);
    reg(C.DRM_RIM_LEVEL, P.RIM_LEVEL, E.RIM, (s) => s.rim.level, (s) => s.rim);
    reg(C.DRM_RIDE_TONE, P.RIDE_TONE, E.RIDE, (s) => s.ride.tone, (s) => s.ride);
    reg(C.DRM_RIDE_DECAY, P.RIDE_DECAY, E.RIDE, (s) => s.ride.decay, (s) => s.ride);
    reg(C.DRM_RIDE_LEVEL, P.RIDE_LEVEL, E.RIDE, (s) => s.ride.level, (s) => s.ride);
    reg(C.DRM_CRASH_TONE, P.CRASH_TONE, E.CRASH, (s) => s.crash.tone, (s) => s.crash);
    reg(C.DRM_CRASH_DECAY, P.CRASH_DECAY, E.CRASH, (s) => s.crash.decay, (s) => s.crash);
    reg(C.DRM_CRASH_LEVEL, P.CRASH_LEVEL, E.CRASH, (s) => s.crash.level, (s) => s.crash);
  }
}
