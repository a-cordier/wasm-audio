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
import { VoiceMode } from "../types/voice-mode";
import { MidiEvent, MidiTarget, Disposable } from "../midi/types";
import { MidiBus } from "../midi/bus/bus";
import { noteFrequency } from "../midi/codec/notes";
import { isNoteOn, isNoteOff } from "../midi/codec/decode";
import { VoiceEvent } from "../types/voice-event";
import { PresetOptions } from "./presets";
import { ControlID } from "../control/types";

type ControlHandler = (value: number) => void;

export class SynthController extends EventTarget implements MidiTarget {
  private synthNode: SynthNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;

  private state: VoiceState;
  private busSubscription: Disposable | null = null;
  private _observers = new Map<Function, EventListenerOrEventListenerObject>();

  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
    this.setState(createVoiceState(PresetOptions.getCurrent().value as VoiceState));
    this.initControlHandlers();
  }

  init() {
    this.synthNode = new SynthNode(this.audioContext);
    this.synthNode.connect(this.output);
    this.syncParams();
  }

  connectBus(bus: MidiBus): this {
    this.busSubscription = bus.subscribe((event) => this.receive(event));
    return this;
  }

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
    }
  }

  /**
   * Called by the BindingManager (or any external control source)
   * when a bound control value changes.
   */
  handleControlChange(controlId: ControlID, value: number) {
    const handler = this.controlHandlers.get(controlId);
    if (handler) handler(value);
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

  dispatch(actionId: string, detail: any) {
    this.dispatchEvent(new CustomEvent(actionId, { detail }));
    return this;
  }

  subscribe(actionId: string, callback: (detail: any) => void) {
    const observer = (event: CustomEvent) => callback(event.detail);
    this._observers.set(callback, observer);
    this.addEventListener(actionId, observer);
    return this;
  }

  unsubscribe(actionId: string, callback: (detail: any) => void) {
    this.removeEventListener(actionId, this._observers.get(callback));
    this._observers.delete(callback);
    return this;
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = createVoiceState(newState);
    this.syncParams();
    return this.getState();
  }

  // --- Oscillator 1 ---

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

  // --- Oscillator 2 ---

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

  // --- Mix ---

  setOsc2Amplitude(newOsc2Amplitude: number) {
    this.state.osc2Amplitude.value = newOsc2Amplitude;
    this.sendParam(ParamId.OSC2_AMPLITUDE, newOsc2Amplitude);
    return this;
  }

  setNoiseLevel(newLevel: number) {
    this.state.noiseLevel.value = newLevel;
    this.sendParam(ParamId.NOISE_LEVEL, newLevel);
    return this;
  }

  // --- Envelope ---

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

  // --- Filter ---

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

  // --- Cutoff Mod ---

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

  // --- LFO 1 ---

  setLfo1Mode(newMode: OscillatorMode) {
    this.state.lfo1.mode.value = newMode;
    this.sendParam(ParamId.LFO1_MODE, OscModeToCpp[newMode]);
    return this;
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

  // --- LFO 2 ---

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

  // --- Voice Config ---

  setVoiceMode(mode: VoiceMode) {
    this.state.voiceConfig.voiceMode.value = mode;
    this.sendParam(ParamId.VOICE_MODE, mode);
    this.dispatch(VoiceEvent.VOICE_CONFIG, { ...this.state.voiceConfig });
    return this;
  }

  setGlideTime(time: number) {
    this.state.voiceConfig.glideTime.value = time;
    this.sendParam(ParamId.GLIDE_TIME, time);
    this.dispatch(VoiceEvent.VOICE_CONFIG, { ...this.state.voiceConfig });
    return this;
  }

  setRetrigger(value: number) {
    this.state.voiceConfig.retrigger.value = value;
    this.sendParam(ParamId.RETRIGGER, value);
    this.dispatch(VoiceEvent.VOICE_CONFIG, { ...this.state.voiceConfig });
    return this;
  }

  dumpState() {
    console.log(JSON.stringify(this.state));
  }

  // --- Internal ---

  private initControlHandlers() {
    const reg = (id: ControlID, paramId: number, event: VoiceEvent,
                 update: (v: number) => void, slice: () => any) => {
      this.controlHandlers.set(id, (value: number) => {
        update(value);
        this.sendParam(paramId, value);
        this.dispatch(event, { ...slice() });
      });
    };

    reg(ControlID.OSC1_SEMI, ParamId.OSC1_SEMI_SHIFT, VoiceEvent.OSC1,
      (v) => { this.state.osc1.semiShift.value = v; }, () => this.state.osc1);
    reg(ControlID.OSC1_CENT, ParamId.OSC1_CENT_SHIFT, VoiceEvent.OSC1,
      (v) => { this.state.osc1.centShift.value = v; }, () => this.state.osc1);
    reg(ControlID.OSC1_CYCLE, ParamId.OSC1_CYCLE, VoiceEvent.OSC1,
      (v) => { this.state.osc1.cycle.value = v; }, () => this.state.osc1);

    reg(ControlID.OSC2_SEMI, ParamId.OSC2_SEMI_SHIFT, VoiceEvent.OSC2,
      (v) => { this.state.osc2.semiShift.value = v; }, () => this.state.osc2);
    reg(ControlID.OSC2_CENT, ParamId.OSC2_CENT_SHIFT, VoiceEvent.OSC2,
      (v) => { this.state.osc2.centShift.value = v; }, () => this.state.osc2);
    reg(ControlID.OSC2_CYCLE, ParamId.OSC2_CYCLE, VoiceEvent.OSC2,
      (v) => { this.state.osc2.cycle.value = v; }, () => this.state.osc2);

    reg(ControlID.OSC_MIX, ParamId.OSC2_AMPLITUDE, VoiceEvent.OSC_MIX,
      (v) => { this.state.osc2Amplitude.value = v; }, () => this.state.osc2Amplitude);
    reg(ControlID.NOISE, ParamId.NOISE_LEVEL, VoiceEvent.NOISE,
      (v) => { this.state.noiseLevel.value = v; }, () => this.state.noiseLevel);

    reg(ControlID.CUTOFF, ParamId.CUTOFF, VoiceEvent.FILTER,
      (v) => { this.state.filter.cutoff.value = v; }, () => this.state.filter);
    reg(ControlID.RESONANCE, ParamId.RESONANCE, VoiceEvent.FILTER,
      (v) => { this.state.filter.resonance.value = v; }, () => this.state.filter);
    reg(ControlID.DRIVE, ParamId.DRIVE, VoiceEvent.FILTER,
      (v) => { this.state.filter.drive.value = v; }, () => this.state.filter);

    reg(ControlID.ATTACK, ParamId.AMPLITUDE_ATTACK, VoiceEvent.ENVELOPE,
      (v) => { this.state.envelope.attack.value = v; }, () => this.state.envelope);
    reg(ControlID.DECAY, ParamId.AMPLITUDE_DECAY, VoiceEvent.ENVELOPE,
      (v) => { this.state.envelope.decay.value = v; }, () => this.state.envelope);
    reg(ControlID.SUSTAIN, ParamId.AMPLITUDE_SUSTAIN, VoiceEvent.ENVELOPE,
      (v) => { this.state.envelope.sustain.value = v; }, () => this.state.envelope);
    reg(ControlID.RELEASE, ParamId.AMPLITUDE_RELEASE, VoiceEvent.ENVELOPE,
      (v) => { this.state.envelope.release.value = v; }, () => this.state.envelope);

    reg(ControlID.LFO1_FREQ, ParamId.LFO1_FREQUENCY, VoiceEvent.LFO1,
      (v) => { this.state.lfo1.frequency.value = v; }, () => this.state.lfo1);
    reg(ControlID.LFO1_MOD, ParamId.LFO1_MOD_AMOUNT, VoiceEvent.LFO1,
      (v) => { this.state.lfo1.modAmount.value = v; }, () => this.state.lfo1);

    reg(ControlID.LFO2_FREQ, ParamId.LFO2_FREQUENCY, VoiceEvent.LFO2,
      (v) => { this.state.lfo2.frequency.value = v; }, () => this.state.lfo2);
    reg(ControlID.LFO2_MOD, ParamId.LFO2_MOD_AMOUNT, VoiceEvent.LFO2,
      (v) => { this.state.lfo2.modAmount.value = v; }, () => this.state.lfo2);

    reg(ControlID.CUT_ATTACK, ParamId.CUTOFF_ENV_ATTACK, VoiceEvent.CUTOFF_MOD,
      (v) => { this.state.cutoffMod.attack.value = v; }, () => this.state.cutoffMod);
    reg(ControlID.CUT_DECAY, ParamId.CUTOFF_ENV_DECAY, VoiceEvent.CUTOFF_MOD,
      (v) => { this.state.cutoffMod.decay.value = v; }, () => this.state.cutoffMod);
    reg(ControlID.CUT_MOD, ParamId.CUTOFF_ENV_AMOUNT, VoiceEvent.CUTOFF_MOD,
      (v) => { this.state.cutoffMod.amount.value = v; }, () => this.state.cutoffMod);
    reg(ControlID.CUT_VEL, ParamId.CUTOFF_ENV_VELOCITY, VoiceEvent.CUTOFF_MOD,
      (v) => { this.state.cutoffMod.velocity.value = v; }, () => this.state.cutoffMod);

    reg(ControlID.GLIDE_TIME, ParamId.GLIDE_TIME, VoiceEvent.VOICE_CONFIG,
      (v) => { this.state.voiceConfig.glideTime.value = v; }, () => this.state.voiceConfig);
  }

  private sendParam(id: number, value: number) {
    this.synthNode?.setParam(id, value);
  }

  private syncParams() {
    if (!this.synthNode) return;
    const s = this.state;
    this.sendParam(ParamId.OSC1_MODE, OscModeToCpp[s.osc1.mode.value]);
    this.sendParam(ParamId.OSC1_SEMI_SHIFT, s.osc1.semiShift.value as number);
    this.sendParam(ParamId.OSC1_CENT_SHIFT, s.osc1.centShift.value as number);
    this.sendParam(ParamId.OSC1_CYCLE, s.osc1.cycle.value as number);
    this.sendParam(ParamId.OSC2_MODE, OscModeToCpp[s.osc2.mode.value]);
    this.sendParam(ParamId.OSC2_SEMI_SHIFT, s.osc2.semiShift.value as number);
    this.sendParam(ParamId.OSC2_CENT_SHIFT, s.osc2.centShift.value as number);
    this.sendParam(ParamId.OSC2_CYCLE, s.osc2.cycle.value as number);
    this.sendParam(ParamId.OSC2_AMPLITUDE, s.osc2Amplitude.value as number);
    this.sendParam(ParamId.NOISE_LEVEL, s.noiseLevel.value as number);
    this.sendParam(ParamId.AMPLITUDE_ATTACK, s.envelope.attack.value as number);
    this.sendParam(ParamId.AMPLITUDE_DECAY, s.envelope.decay.value as number);
    this.sendParam(ParamId.AMPLITUDE_SUSTAIN, s.envelope.sustain.value as number);
    this.sendParam(ParamId.AMPLITUDE_RELEASE, s.envelope.release.value as number);
    this.sendParam(ParamId.FILTER_MODE, FilterModeToCpp[s.filter.mode.value]);
    this.sendParam(ParamId.CUTOFF, s.filter.cutoff.value as number);
    this.sendParam(ParamId.RESONANCE, s.filter.resonance.value as number);
    this.sendParam(ParamId.DRIVE, s.filter.drive.value as number);
    this.sendParam(ParamId.CUTOFF_ENV_AMOUNT, s.cutoffMod.amount.value as number);
    this.sendParam(ParamId.CUTOFF_ENV_VELOCITY, s.cutoffMod.velocity.value as number);
    this.sendParam(ParamId.CUTOFF_ENV_ATTACK, s.cutoffMod.attack.value as number);
    this.sendParam(ParamId.CUTOFF_ENV_DECAY, s.cutoffMod.decay.value as number);
    this.sendParam(ParamId.LFO1_MODE, OscModeToCpp[s.lfo1.mode.value]);
    this.sendParam(ParamId.LFO1_DESTINATION, s.lfo1.destination.value as number);
    this.sendParam(ParamId.LFO1_FREQUENCY, s.lfo1.frequency.value as number);
    this.sendParam(ParamId.LFO1_MOD_AMOUNT, s.lfo1.modAmount.value as number);
    this.sendParam(ParamId.LFO2_MODE, OscModeToCpp[s.lfo2.mode.value]);
    this.sendParam(ParamId.LFO2_DESTINATION, s.lfo2.destination.value as number);
    this.sendParam(ParamId.LFO2_FREQUENCY, s.lfo2.frequency.value as number);
    this.sendParam(ParamId.LFO2_MOD_AMOUNT, s.lfo2.modAmount.value as number);
    this.sendParam(ParamId.VOICE_MODE, s.voiceConfig.voiceMode.value as number);
    this.sendParam(ParamId.GLIDE_TIME, s.voiceConfig.glideTime.value as number);
    this.sendParam(ParamId.RETRIGGER, s.voiceConfig.retrigger.value as number);
  }
}
