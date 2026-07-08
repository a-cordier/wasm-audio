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
import { SynthNode, ParamId, OscModeToCpp, FilterModeToCpp } from "./synth-node";
import { VoiceState, createVoiceState } from "../types/voice";
import { OscillatorMode } from "../types/oscillator-mode";
import { FilterMode } from "../types/filter-mode";
import { LfoDestination } from "../types/lfo-destination";
import { MidiControl } from "../types/control";
import { MidiControlID } from "../types/midi-learn-options";
import { Dispatcher } from "../core/dispatcher";
import { MidiEvent, MidiTarget, Disposable } from "../midi/types";
import { MidiBus } from "../midi/bus/bus";
import { noteFrequency } from "../midi/codec/notes";
import { isNoteOn, isNoteOff, isControlChange } from "../midi/codec/decode";
import { VoiceEvent } from "../types/voice-event";
import { PresetOptions } from "../core/presets/options";

export class SynthController extends Dispatcher implements MidiTarget {
  private synthNode: SynthNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;

  private state: VoiceState;
  private controlMap = new Map<number, MidiControlID>();
  private currentLearnerID = MidiControlID.NONE;
  private busSubscription: Disposable | null = null;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
    this.setState(createVoiceState(PresetOptions.getCurrent().value as VoiceState));
  }

  init() {
    this.synthNode = new SynthNode(this.audioContext);
    this.synthNode.connect(this.output);
    this.syncParams();
  }

  /**
   * Connect this controller to a MidiBus.
   * All MIDI events are routed through receive() which handles notes (to worklet)
   * and CCs (for MIDI Learn and UI sync).
   */
  connectBus(bus: MidiBus): this {
    this.busSubscription = bus.subscribe((event) => this.receive(event));
    return this;
  }

  /**
   * Implements MidiTarget — receives events from a bus or source.
   */
  receive(event: MidiEvent): void {
    if (isNoteOn(event)) {
      const frequency = noteFrequency(event.data1);
      this.synthNode?.noteOn(event.data1, frequency, event.data2);
      this.dispatch(VoiceEvent.NOTE_ON, {
        midiValue: event.data1,
        frequency,
        velocity: event.data2,
      });
    } else if (isNoteOff(event)) {
      this.synthNode?.noteOff(event.data1);
      this.dispatch(VoiceEvent.NOTE_OFF, { midiValue: event.data1 });
    } else if (isControlChange(event)) {
      this.handleCC(event.data1, event.data2);
    }
  }

  next({ frequency, midiValue, velocity = 60 }) {
    this.synthNode?.noteOn(midiValue, frequency, velocity);
  }

  stop({ midiValue }) {
    this.synthNode?.noteOff(midiValue);
  }

  connect(input: AudioNode) {
    this.output.connect(input);
  }

  /** MIDI Learn: set which parameter is currently learning */
  setLearnerID(id: MidiControlID) {
    this.currentLearnerID = id;
  }

  /** MIDI Learn: map a CC number to a control ID */
  mapControl(ccNumber: number, id: MidiControlID) {
    this.controlMap.set(ccNumber, id);
    this.currentLearnerID = MidiControlID.NONE;
  }

  private handleCC(control: number, value: number) {
    const isLearning = this.currentLearnerID !== MidiControlID.NONE;

    let controlID = this.controlMap.get(control);
    if (isLearning) {
      controlID = this.currentLearnerID;
      this.controlMap.set(control, controlID);
      this.currentLearnerID = MidiControlID.NONE;
    }

    if (controlID === undefined) return;

    const midiControl = this.state.findMidiControlById(controlID);
    if (!midiControl) return;

    midiControl.controller = control;
    midiControl.value = value;
    this.dispatchCC(midiControl);
  }

  dispatchCC(control: MidiControl) {
    switch (control.id) {
      case MidiControlID.OSC1_SEMI:
        this.sendParam(ParamId.OSC1_SEMI_SHIFT, control.value);
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ semiShift: control.clone() },
        });
      case MidiControlID.OSC1_CENT:
        this.sendParam(ParamId.OSC1_CENT_SHIFT, control.value);
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ centShift: control.clone() },
        });
      case MidiControlID.OSC1_CYCLE:
        this.sendParam(ParamId.OSC1_CYCLE, control.value);
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ cycle: control.clone() },
        });
      case MidiControlID.OSC2_SEMI:
        this.sendParam(ParamId.OSC2_SEMI_SHIFT, control.value);
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ semiShift: control.clone() },
        });
      case MidiControlID.OSC2_CENT:
        this.sendParam(ParamId.OSC2_CENT_SHIFT, control.value);
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ centShift: control.clone() },
        });
      case MidiControlID.OSC2_CYCLE:
        this.sendParam(ParamId.OSC2_CYCLE, control.value);
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ cycle: control.clone() },
        });
      case MidiControlID.OSC_MIX:
        this.sendParam(ParamId.OSC2_AMPLITUDE, control.value);
        return this.dispatch(VoiceEvent.OSC_MIX, control.clone());
      case MidiControlID.NOISE:
        this.sendParam(ParamId.NOISE_LEVEL, control.value);
        return this.dispatch(VoiceEvent.NOISE, control.clone());
      case MidiControlID.CUTOFF:
        this.sendParam(ParamId.CUTOFF, control.value);
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ cutoff: control.clone() },
        });
      case MidiControlID.RESONANCE:
        this.sendParam(ParamId.RESONANCE, control.value);
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ resonance: control.clone() },
        });
      case MidiControlID.DRIVE:
        this.sendParam(ParamId.DRIVE, control.value);
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ drive: control.clone() },
        });
      case MidiControlID.ATTACK:
        this.sendParam(ParamId.AMPLITUDE_ATTACK, control.value);
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ attack: control.clone() },
        });
      case MidiControlID.DECAY:
        this.sendParam(ParamId.AMPLITUDE_DECAY, control.value);
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ decay: control.clone() },
        });
      case MidiControlID.SUSTAIN:
        this.sendParam(ParamId.AMPLITUDE_SUSTAIN, control.value);
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ sustain: control.clone() },
        });
      case MidiControlID.RELEASE:
        this.sendParam(ParamId.AMPLITUDE_RELEASE, control.value);
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ release: control.clone() },
        });
      case MidiControlID.LFO1_FREQ:
        this.sendParam(ParamId.LFO1_FREQUENCY, control.value);
        return this.dispatch(VoiceEvent.LFO1, {
          ...this.state.lfo1,
          ...{ frequency: control.clone() },
        });
      case MidiControlID.LFO1_MOD:
        this.sendParam(ParamId.LFO1_MOD_AMOUNT, control.value);
        return this.dispatch(VoiceEvent.LFO1, {
          ...this.state.lfo1,
          ...{ modAmount: control.clone() },
        });
      case MidiControlID.LFO2_FREQ:
        this.sendParam(ParamId.LFO2_FREQUENCY, control.value);
        return this.dispatch(VoiceEvent.LFO2, {
          ...this.state.lfo2,
          ...{ frequency: control.clone() },
        });
      case MidiControlID.LFO2_MOD:
        this.sendParam(ParamId.LFO2_MOD_AMOUNT, control.value);
        return this.dispatch(VoiceEvent.LFO2, {
          ...this.state.lfo2,
          ...{ modAmount: control.clone() },
        });
      case MidiControlID.CUT_ATTACK:
        this.sendParam(ParamId.CUTOFF_ENV_ATTACK, control.value);
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ attack: control.clone() },
        });
      case MidiControlID.CUT_DECAY:
        this.sendParam(ParamId.CUTOFF_ENV_DECAY, control.value);
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ decay: control.clone() },
        });
      case MidiControlID.CUT_MOD:
        this.sendParam(ParamId.CUTOFF_ENV_AMOUNT, control.value);
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ amount: control.clone() },
        });
      case MidiControlID.CUT_VEL:
        this.sendParam(ParamId.CUTOFF_ENV_VELOCITY, control.value);
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ velocity: control.clone() },
        });
    }
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = createVoiceState(newState);
    this.bindMidiControls();
    this.syncParams();
    return this.getState();
  }

  private bindMidiControls() {
    if (!this.state) return;
    this.controlMap.clear();
    for (const control of this.state.getMidiControls()) {
      if (control.controller >= 0) {
        this.controlMap.set(control.controller, control.id);
      }
    }
  }

  setOsc1Mode(newMode: OscillatorMode) {
    this.state.osc1.mode.value = newMode;
    this.sendParam(ParamId.OSC1_MODE, OscModeToCpp[newMode]);
    return this;
  }

  setOsc1SemiShift(newSemiShift: number) {
    this.state.osc1.semiShift.value = newSemiShift;
    this.sendParam(ParamId.OSC1_SEMI_SHIFT, newSemiShift);
    return this;
  }

  setOsc1CentShift(newCentShift: number) {
    this.state.osc1.centShift.value = newCentShift;
    this.sendParam(ParamId.OSC1_CENT_SHIFT, newCentShift);
    return this;
  }

  setOsc1Cycle(newCycle: number) {
    this.state.osc1.cycle.value = newCycle;
    this.sendParam(ParamId.OSC1_CYCLE, newCycle);
    return this;
  }

  get osc1() {
    return this.state.osc1;
  }

  setOsc2Mode(newMode: OscillatorMode) {
    this.state.osc2.mode.value = newMode;
    this.sendParam(ParamId.OSC2_MODE, OscModeToCpp[newMode]);
    return this;
  }

  setOsc2SemiShift(newSemiShift: number) {
    this.state.osc2.semiShift.value = newSemiShift;
    this.sendParam(ParamId.OSC2_SEMI_SHIFT, newSemiShift);
    return this;
  }

  setOsc2CentShift(newCentShift: number) {
    this.state.osc2.centShift.value = newCentShift;
    this.sendParam(ParamId.OSC2_CENT_SHIFT, newCentShift);
    return this;
  }

  setOsc2Cycle(newCycle: number) {
    this.state.osc2.cycle.value = newCycle;
    this.sendParam(ParamId.OSC2_CYCLE, newCycle);
    return this;
  }

  get osc2() {
    return this.state.osc2;
  }

  setNoiseLevel(newLevel: number) {
    this.state.noiseLevel.value = newLevel;
    this.sendParam(ParamId.NOISE_LEVEL, newLevel);
    return this;
  }

  setAmplitudeEnvelopeAttack(newAttackTime: number) {
    this.state.envelope.attack.value = newAttackTime;
    this.sendParam(ParamId.AMPLITUDE_ATTACK, newAttackTime);
    return this;
  }

  setAmplitudeEnvelopeDecay(newDecayTime: number) {
    this.state.envelope.decay.value = newDecayTime;
    this.sendParam(ParamId.AMPLITUDE_DECAY, newDecayTime);
    return this;
  }

  setAmplitudeEnvelopeSustain(newSustainLevel: number) {
    this.state.envelope.sustain.value = newSustainLevel;
    this.sendParam(ParamId.AMPLITUDE_SUSTAIN, newSustainLevel);
    return this;
  }

  setAmplitudeEnvelopeRelease(newReleaseTime: number) {
    this.state.envelope.release.value = newReleaseTime;
    this.sendParam(ParamId.AMPLITUDE_RELEASE, newReleaseTime);
    return this;
  }

  get envelope() {
    return this.state.envelope;
  }

  setOsc2Amplitude(newOsc2Amplitude: number) {
    this.state.osc2Amplitude.value = newOsc2Amplitude;
    this.sendParam(ParamId.OSC2_AMPLITUDE, newOsc2Amplitude);
    return this;
  }

  get osc2Amplitude() {
    return this.state.osc2Amplitude;
  }

  setFilterMode(newMode: FilterMode) {
    this.state.filter.mode.value = newMode;
    this.sendParam(ParamId.FILTER_MODE, FilterModeToCpp[newMode]);
    return this;
  }

  setFilterCutoff(newCutoff: number) {
    this.state.filter.cutoff.value = newCutoff;
    this.sendParam(ParamId.CUTOFF, newCutoff);
    return this;
  }

  setFilterResonance(newResonance: number) {
    this.state.filter.resonance.value = newResonance;
    this.sendParam(ParamId.RESONANCE, newResonance);
    return this;
  }

  setDrive(newDrive: number) {
    this.state.filter.drive.value = newDrive;
    this.sendParam(ParamId.DRIVE, newDrive);
    return this;
  }

  get filter() {
    return this.state.filter;
  }

  setCutoffEnvelopeAmount(newAmount: number) {
    this.state.cutoffMod.amount.value = newAmount;
    this.sendParam(ParamId.CUTOFF_ENV_AMOUNT, newAmount);
    return this;
  }

  setCutoffEnvelopeVelocity(newVelocity: number) {
    this.state.cutoffMod.velocity.value = newVelocity;
    this.sendParam(ParamId.CUTOFF_ENV_VELOCITY, newVelocity);
    return this;
  }

  setCutoffEnvelopeAttack(newAttackTime: number) {
    this.state.cutoffMod.attack.value = newAttackTime;
    this.sendParam(ParamId.CUTOFF_ENV_ATTACK, newAttackTime);
    return this;
  }

  setCutoffEnvelopeDecay(newDecayTime: number) {
    this.state.cutoffMod.decay.value = newDecayTime;
    this.sendParam(ParamId.CUTOFF_ENV_DECAY, newDecayTime);
    return this;
  }

  setLfo1Mode(newMode: OscillatorMode) {
    this.state.lfo1.mode.value = newMode;
    this.sendParam(ParamId.LFO1_MODE, OscModeToCpp[newMode]);
    return this;
  }

  get lfo1() {
    return this.state.lfo1;
  }

  setLfo1Destination(newDestination: LfoDestination) {
    this.state.lfo1.destination.value = newDestination;
    this.sendParam(ParamId.LFO1_DESTINATION, newDestination);
    return this;
  }

  setLfo1Frequency(newFrequency: number) {
    this.state.lfo1.frequency.value = newFrequency;
    this.sendParam(ParamId.LFO1_FREQUENCY, newFrequency);
    return this;
  }

  setLfo1ModAmount(newAmount: number) {
    this.state.lfo1.modAmount.value = newAmount;
    this.sendParam(ParamId.LFO1_MOD_AMOUNT, newAmount);
    return this;
  }

  get lfo2() {
    return this.state.lfo2;
  }

  setLfo2Mode(newMode: OscillatorMode) {
    this.state.lfo2.mode.value = newMode;
    this.sendParam(ParamId.LFO2_MODE, OscModeToCpp[newMode]);
    return this;
  }

  setLfo2Destination(newDestination: LfoDestination) {
    this.state.lfo2.destination.value = newDestination;
    this.sendParam(ParamId.LFO2_DESTINATION, newDestination);
    return this;
  }

  setLfo2Frequency(newFrequency: number) {
    this.state.lfo2.frequency.value = newFrequency;
    this.sendParam(ParamId.LFO2_FREQUENCY, newFrequency);
    return this;
  }

  setLfo2ModAmount(newAmount: number) {
    this.state.lfo2.modAmount.value = newAmount;
    this.sendParam(ParamId.LFO2_MOD_AMOUNT, newAmount);
    return this;
  }

  get cutoffMod() {
    return this.state.cutoffMod;
  }

  dumpState() {
    console.log(JSON.stringify(this.state));
  }

  private sendParam(id: number, value: number) {
    this.synthNode?.setParam(id, value);
  }

  private syncParams() {
    if (!this.synthNode) return;
    const s = this.state;
    this.sendParam(ParamId.OSC1_MODE, OscModeToCpp[s.osc1.mode.value]);
    this.sendParam(ParamId.OSC1_SEMI_SHIFT, s.osc1.semiShift.value);
    this.sendParam(ParamId.OSC1_CENT_SHIFT, s.osc1.centShift.value);
    this.sendParam(ParamId.OSC1_CYCLE, s.osc1.cycle.value);
    this.sendParam(ParamId.OSC2_MODE, OscModeToCpp[s.osc2.mode.value]);
    this.sendParam(ParamId.OSC2_SEMI_SHIFT, s.osc2.semiShift.value);
    this.sendParam(ParamId.OSC2_CENT_SHIFT, s.osc2.centShift.value);
    this.sendParam(ParamId.OSC2_CYCLE, s.osc2.cycle.value);
    this.sendParam(ParamId.OSC2_AMPLITUDE, s.osc2Amplitude.value);
    this.sendParam(ParamId.NOISE_LEVEL, s.noiseLevel.value);
    this.sendParam(ParamId.AMPLITUDE_ATTACK, s.envelope.attack.value);
    this.sendParam(ParamId.AMPLITUDE_DECAY, s.envelope.decay.value);
    this.sendParam(ParamId.AMPLITUDE_SUSTAIN, s.envelope.sustain.value);
    this.sendParam(ParamId.AMPLITUDE_RELEASE, s.envelope.release.value);
    this.sendParam(ParamId.FILTER_MODE, FilterModeToCpp[s.filter.mode.value]);
    this.sendParam(ParamId.CUTOFF, s.filter.cutoff.value);
    this.sendParam(ParamId.RESONANCE, s.filter.resonance.value);
    this.sendParam(ParamId.DRIVE, s.filter.drive.value);
    this.sendParam(ParamId.CUTOFF_ENV_AMOUNT, s.cutoffMod.amount.value);
    this.sendParam(ParamId.CUTOFF_ENV_VELOCITY, s.cutoffMod.velocity.value);
    this.sendParam(ParamId.CUTOFF_ENV_ATTACK, s.cutoffMod.attack.value);
    this.sendParam(ParamId.CUTOFF_ENV_DECAY, s.cutoffMod.decay.value);
    this.sendParam(ParamId.LFO1_MODE, OscModeToCpp[s.lfo1.mode.value]);
    this.sendParam(ParamId.LFO1_DESTINATION, s.lfo1.destination.value);
    this.sendParam(ParamId.LFO1_FREQUENCY, s.lfo1.frequency.value);
    this.sendParam(ParamId.LFO1_MOD_AMOUNT, s.lfo1.modAmount.value);
    this.sendParam(ParamId.LFO2_MODE, OscModeToCpp[s.lfo2.mode.value]);
    this.sendParam(ParamId.LFO2_DESTINATION, s.lfo2.destination.value);
    this.sendParam(ParamId.LFO2_FREQUENCY, s.lfo2.frequency.value);
    this.sendParam(ParamId.LFO2_MOD_AMOUNT, s.lfo2.modAmount.value);
  }
}
