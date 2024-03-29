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
import { WasmVoiceNode } from "../worklets/voice-node";
import { Voice, VoiceState, createVoiceState } from "../types/voice";
import { OscillatorMode } from "../types/oscillator-mode";
import { FilterMode } from "../types/filter-mode";
import { LfoDestination } from "../types/lfo-destination";
import { MidiControl } from "../types/control";
import { MidiControlID } from "../types/midi-learn-options";
import { Dispatcher } from "./dispatcher";
import { MidiMessageEvent, MidiMessage } from "../types/midi-message";
import { midiToNote } from "./midi/midi-note";
import { MidiController } from "../types/midi-controller";
import { VoiceEvent } from "../types/voice-event";
import { KeyboardMessage } from "../types/keyboard-messsage";
import { PresetOptions } from "./presets/options";

export function* createVoiceGenerator(audioContext: AudioContext): IterableIterator<Voice> {
  for (;;) {
    yield new WasmVoiceNode(audioContext);
  }
}

export class VoiceManager extends Dispatcher {
  private voiceGenerator: IterableIterator<Voice>;
  private voices: Map<number, Voice>;
  private output: GainNode;
  private midiController: MidiController & Dispatcher;

  private state: VoiceState;

  constructor(audioContext: AudioContext) {
    super();
    this.voiceGenerator = createVoiceGenerator(audioContext);
    this.voices = new Map();
    this.output = new GainNode(audioContext);
    this.onMidiNoteOn = this.onMidiNoteOn.bind(this);
    this.onMidiNoteOff = this.onMidiNoteOff.bind(this);
    this.onMidiCC = this.onMidiCC.bind(this);
    this.setState(createVoiceState(PresetOptions.getCurrent().value as VoiceState));
  }

  next({ frequency, midiValue, velocity = 60 }): Voice {
    if (this.voices.has(midiValue)) {
      return this.voices.get(midiValue);
    }
    const voice = this.voiceGenerator.next().value;
    voice.frequency.value = frequency;
    voice.velocity.value = velocity;
    voice.osc1.value = this.state.osc1.mode.value;
    voice.osc1SemiShift.value = this.state.osc1.semiShift.value;
    voice.osc1CentShift.value = this.state.osc1.centShift.value;
    voice.osc1Cycle.value = this.state.osc1.cycle.value;
    voice.osc2.value = this.state.osc2.mode.value;
    voice.osc2SemiShift.value = this.state.osc2.semiShift.value;
    voice.osc2CentShift.value = this.state.osc2.centShift.value;
    voice.osc2Cycle.value = this.state.osc2.cycle.value;
    voice.osc2Amplitude.value = this.state.osc2Amplitude.value;
    voice.noiseLevel.value = this.state.noiseLevel.value;
    voice.amplitudeAttack.value = this.state.envelope.attack.value;
    voice.amplitudeDecay.value = this.state.envelope.decay.value;
    voice.amplitudeSustain.value = this.state.envelope.sustain.value;
    voice.amplitudeRelease.value = this.state.envelope.release.value;
    voice.filterMode.value = this.state.filter.mode.value;
    voice.cutoff.value = this.state.filter.cutoff.value;
    voice.resonance.value = this.state.filter.resonance.value;
    voice.drive.value = this.state.filter.drive.value;
    voice.cutoffAttack.value = this.state.cutoffMod.attack.value;
    voice.cutoffDecay.value = this.state.cutoffMod.decay.value;
    voice.cutoffEnvelopeAmount.value = this.state.cutoffMod.amount.value;
    voice.cutoffEnvelopeVelocity.value = this.state.cutoffMod.velocity.value;
    voice.lfo1Frequency.value = this.state.lfo1.frequency.value;
    voice.lfo1ModAmount.value = this.state.lfo1.modAmount.value;
    voice.lfo1Mode.value = this.state.lfo1.mode.value;
    voice.lfo1Destination.value = this.state.lfo1.destination.value;
    voice.lfo2Frequency.value = this.state.lfo2.frequency.value;
    voice.lfo2ModAmount.value = this.state.lfo2.modAmount.value;
    voice.lfo2Mode.value = this.state.lfo2.mode.value;
    voice.lfo2Destination.value = this.state.lfo2.destination.value;
    this.voices.set(midiValue, voice);
    voice.start();
    voice.connect(this.output);
    return voice;
  }

  setMidiController(midiController: MidiController & Dispatcher) {
    this.midiController = midiController
      .subscribe(MidiMessageEvent.NOTE_ON, this.onMidiNoteOn)
      .subscribe(MidiMessageEvent.NOTE_OFF, this.onMidiNoteOff)
      .subscribe(MidiMessageEvent.CONTROL_CHANGE, this.onMidiCC);
    this.bindMidiControls();
    return this;
  }

  setKeyBoardcontroller(keyBoardController: Dispatcher) {
    keyBoardController
      .subscribe(KeyboardMessage.NOTE_ON, this.onMidiNoteOn)
      .subscribe(KeyboardMessage.NOTE_OFF, this.onMidiNoteOff);
    return this;
  }

  onMidiNoteOn(message: MidiMessage) {
    const note = midiToNote(message.data);
    this.next(note);
    this.dispatch(VoiceEvent.NOTE_ON, note);
  }

  onMidiNoteOff(message: MidiMessage) {
    const note = { midiValue: message.data.value };
    this.stop(note);
    this.dispatch(VoiceEvent.NOTE_OFF, note);
  }

  onMidiCC(message: MidiMessage) {
    const midiControl = this.state.findMidiControlById(message.controlID);

    if (!midiControl) {
      return;
    }

    midiControl.controller = message.data.control;
    midiControl.value = message.data.value;

    if (message.isMidiLearning) {
      this.midiController.mapControl(message.data.control, midiControl.id);
    }

    this.dispatchCC(midiControl);
  }

  dispatchCC(control: MidiControl) {
    switch (control.id) {
      case MidiControlID.OSC1_SEMI:
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ semiShift: control.clone() },
        });
      case MidiControlID.OSC1_CENT:
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ centShift: control.clone() },
        });
      case MidiControlID.OSC1_CYCLE:
        return this.dispatch(VoiceEvent.OSC1, {
          ...this.state.osc1,
          ...{ cycle: control.clone() },
        });
      case MidiControlID.OSC2_SEMI:
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ centShift: control.clone() },
        });
      case MidiControlID.OSC2_CENT:
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ centShift: control.clone() },
        });
      case MidiControlID.OSC2_CYCLE:
        return this.dispatch(VoiceEvent.OSC2, {
          ...this.state.osc2,
          ...{ cycle: control.clone() },
        });
      case MidiControlID.OSC_MIX:
        return this.dispatch(VoiceEvent.OSC_MIX, control.clone());
      case MidiControlID.NOISE:
        return this.dispatch(VoiceEvent.NOISE, control.clone());
      case MidiControlID.CUTOFF:
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ cutoff: control.clone() },
        });
      case MidiControlID.RESONANCE:
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ resonance: control.clone() },
        });
      case MidiControlID.DRIVE:
        return this.dispatch(VoiceEvent.FILTER, {
          ...this.state.filter,
          ...{ drive: control.clone() },
        });
      case MidiControlID.ATTACK:
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ attack: control.clone() },
        });
      case MidiControlID.DECAY:
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ decay: control.clone() },
        });
      case MidiControlID.SUSTAIN:
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ sustain: control.clone() },
        });
      case MidiControlID.RELEASE:
        return this.dispatch(VoiceEvent.ENVELOPE, {
          ...this.state.envelope,
          ...{ release: control.clone() },
        });
      case MidiControlID.LFO1_FREQ:
        return this.dispatch(VoiceEvent.LFO1, {
          ...this.state.lfo1,
          ...{ frequency: control.clone() },
        });
      case MidiControlID.LFO1_MOD:
        return this.dispatch(VoiceEvent.LFO1, {
          ...this.state.lfo1,
          ...{ modAmount: control.clone() },
        });
      case MidiControlID.LFO2_FREQ:
        return this.dispatch(VoiceEvent.LFO2, {
          ...this.state.lfo2,
          ...{ frequency: control.clone() },
        });
      case MidiControlID.LFO2_MOD:
        return this.dispatch(VoiceEvent.LFO2, {
          ...this.state.lfo2,
          ...{ modAmount: control.clone() },
        });
      case MidiControlID.CUT_ATTACK:
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ attack: control.clone() },
        });
      case MidiControlID.CUT_DECAY:
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ decay: control.clone() },
        });
      case MidiControlID.CUT_MOD:
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ amount: control.clone() },
        });
      case MidiControlID.CUT_VEL:
        return this.dispatch(VoiceEvent.CUTOFF_MOD, {
          ...this.state.cutoffMod,
          ...{ velocity: control.clone() },
        });
    }
  }

  stop({ midiValue }) {
    if (this.voices.has(midiValue)) {
      this.voices.get(midiValue).stop();
      this.voices.delete(midiValue);
    }
  }

  connect(input: AudioNode) {
    this.output.connect(input);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = createVoiceState(newState);
    this.bindMidiControls();
    return this.getState();
  }

  bindMidiControls() {
    if (!this.state) {
      return;
    }
    if (!this.midiController) {
      return;
    }
    for (const control of this.state.getMidiControls()) {
      this.midiController.mapControl(control.controller, control.id);
    }
  }

  setOsc1Mode(newMode: OscillatorMode) {
    this.state.osc1.mode.value = newMode;
    this.dispatchUpdate((voice) => (voice.osc1.value = newMode));
    return this;
  }

  setOsc1SemiShift(newSemiShift: number) {
    this.state.osc1.semiShift.value = newSemiShift;
    this.dispatchUpdate((voice) => (voice.osc1SemiShift.value = newSemiShift));
    return this;
  }

  setOsc1CentShift(newCentShift: number) {
    this.state.osc1.centShift.value = newCentShift;
    this.dispatchUpdate((voice) => (voice.osc1CentShift.value = newCentShift));
    return this;
  }

  setOsc1Cycle(newCycle: number) {
    this.state.osc1.cycle.value = newCycle;
    this.dispatchUpdate((voice) => (voice.osc1Cycle.value = newCycle));
    return this;
  }

  get osc1() {
    return this.state.osc1;
  }

  setOsc2Mode(newMode: OscillatorMode) {
    this.state.osc2.mode.value = newMode;
    this.dispatchUpdate((voice) => (voice.osc2.value = newMode));
    return this;
  }

  setOsc2SemiShift(newSemiShift: number) {
    this.state.osc2.semiShift.value = newSemiShift;
    this.dispatchUpdate((voice) => (voice.osc2SemiShift.value = newSemiShift));
    return this;
  }

  setOsc2CentShift(newCentShift: number) {
    this.state.osc2.centShift.value = newCentShift;
    this.dispatchUpdate((voice) => (voice.osc2CentShift.value = newCentShift));
    return this;
  }

  setOsc2Cycle(newCycle: number) {
    this.state.osc2.cycle.value = newCycle;
    this.dispatchUpdate((voice) => (voice.osc2Cycle.value = newCycle));
    return this;
  }

  get osc2() {
    return this.state.osc2;
  }

  setNoiseLevel(newLevel: number) {
    this.state.noiseLevel.value = newLevel;
    this.dispatchUpdate((voice) => (voice.noiseLevel.value = newLevel));
    return this;
  }

  setAmplitudeEnvelopeAttack(newAttackTime: number) {
    this.state.envelope.attack.value = newAttackTime;
    return this;
  }

  setAmplitudeEnvelopeDecay(newDecayTime: number) {
    this.state.envelope.decay.value = newDecayTime;
    return this;
  }

  setAmplitudeEnvelopeSustain(newSustainLevel: number) {
    this.state.envelope.sustain.value = newSustainLevel;
    return this;
  }

  setAmplitudeEnvelopeRelease(newReleaseTime: number) {
    this.state.envelope.release.value = newReleaseTime;
    return this;
  }

  get envelope() {
    return this.state.envelope;
  }

  setOsc2Amplitude(newOsc2Amplitude: number) {
    this.state.osc2Amplitude.value = newOsc2Amplitude;
    this.dispatchUpdate((voice) => (voice.osc2Amplitude.value = newOsc2Amplitude));
    return this;
  }

  get osc2Amplitude() {
    return this.state.osc2Amplitude;
  }

  setFilterMode(newMode: FilterMode) {
    this.state.filter.mode.value = newMode;
    this.dispatchUpdate((voice) => (voice.filterMode.value = newMode));
    return this;
  }

  setFilterCutoff(newCutoff: number) {
    this.state.filter.cutoff.value = newCutoff;
    this.dispatchUpdate((voice) => (voice.cutoff.value = newCutoff));
    return this;
  }

  setFilterResonance(newResonance: number) {
    this.state.filter.resonance.value = newResonance;
    this.dispatchUpdate((voice) => (voice.resonance.value = newResonance));
    return this;
  }

  setDrive(newDrive: number) {
    this.state.filter.drive.value = newDrive;
    this.dispatchUpdate((voice) => (voice.drive.value = newDrive));
    return this;
  }

  get filter() {
    return this.state.filter;
  }

  setCutoffEnvelopeAmount(newAmount: number) {
    this.state.cutoffMod.amount.value = newAmount;
    return this;
  }

  setCutoffEnvelopeVelocity(newVelocity: number) {
    this.state.cutoffMod.velocity.value = newVelocity;
    return this;
  }

  setCutoffEnvelopeAttack(newAttackTime: number) {
    this.state.cutoffMod.attack.value = newAttackTime;
    return this;
  }

  setCutoffEnvelopeDecay(newDecayTime: number) {
    this.state.cutoffMod.decay.value = newDecayTime;
    return this;
  }

  setLfo1Mode(newMode: OscillatorMode) {
    this.state.lfo1.mode.value = newMode;
    this.dispatchUpdate((voice) => (voice.lfo1Mode.value = newMode));
    return this;
  }

  get lfo1() {
    return this.state.lfo1;
  }

  setLfo1Destination(newDestination: LfoDestination) {
    this.state.lfo1.destination.value = newDestination;
    this.dispatchUpdate((voice) => (voice.lfo1Destination.value = newDestination));
    return this;
  }

  setLfo1Frequency(newFrequency: number) {
    this.state.lfo1.frequency.value = newFrequency;
    this.dispatchUpdate((voice) => (voice.lfo1Frequency.value = newFrequency));
    return this;
  }

  setLfo1ModAmount(newAmount: number) {
    this.state.lfo1.modAmount.value = newAmount;
    this.dispatchUpdate((voice) => (voice.lfo1ModAmount.value = newAmount));
    return this;
  }

  get lfo2() {
    return this.state.lfo2;
  }

  setLfo2Mode(newMode: OscillatorMode) {
    this.state.lfo2.mode.value = newMode;
    this.dispatchUpdate((voice) => (voice.lfo2Mode.value = newMode));
    return this;
  }

  setLfo2Destination(newDestination: LfoDestination) {
    this.state.lfo2.destination.value = newDestination;
    this.dispatchUpdate((voice) => (voice.lfo2Destination.value = newDestination));
    return this;
  }

  setLfo2Frequency(newFrequency: number) {
    this.state.lfo2.frequency.value = newFrequency;
    this.dispatchUpdate((voice) => (voice.lfo2Frequency.value = newFrequency));
    return this;
  }

  setLfo2ModAmount(newAmount: number) {
    this.state.lfo2.modAmount.value = newAmount;
    this.dispatchUpdate((voice) => (voice.lfo2ModAmount.value = newAmount));
    return this;
  }

  get cutoffMod() {
    return this.state.cutoffMod;
  }

  dispatchUpdate(doUpdate: (voice: Voice) => void) {
    for (const voice of this.voices.values()) {
      doUpdate(voice);
    }
  }

  dumpState() {
    console.log(JSON.stringify(this.state));
  }
}
