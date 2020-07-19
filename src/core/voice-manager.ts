import { WasmVoiceNode } from "../worklets/voice-node";
import { Voice } from "../types/voice";
import { OscillatorMode } from "../types/oscillator-mode";
import { FilterMode } from "../types/filter-mode";
import { LfoDestination } from "../types/lfo-destination";

export function* createVoiceGenerator(
  audioContext: AudioContext
): IterableIterator<Voice> {
  for (;;) {
    yield new WasmVoiceNode(audioContext);
  }
}

export class VoiceManager {
  private voiceGenerator: IterableIterator<Voice>;
  private channels: Map<number, Voice>[];
  private output: GainNode;

  private state = {
    osc1: {
      mode: OscillatorMode.SAWTOOTH,
      semiShift: 0,
      centShift: 0,
    },
    osc1Envelope: {
      attack: 0,
      decay: 127 / 2,
      sustain: 127,
      release: 127 / 4,
    },
    osc2: {
      mode: OscillatorMode.SAWTOOTH,
      semiShift: 0,
      centShift: 0,
    },
    osc2Envelope: {
      attack: 0,
      decay: 127 / 2,
      sustain: 127,
      release: 127 / 4,
    },
    osc2Amplitude: 127 / 2,
    filter: {
      mode: FilterMode.LOWPASS,
      cutoff: 127,
      resonance: 0,
    },
    cutoffEnvelope: {
      attack: 0,
      decay: 127 / 2,
      amount: 0,
    },
    lfo1: {
      mode: OscillatorMode.SINE,
      frequency: 127 / 2,
      modAmount: 0,
      destination: LfoDestination.OSCILLATOR_MIX,
    },
    lfo2: {
      mode: OscillatorMode.SINE,
      frequency: 127 / 2,
      modAmount: 0,
      destination: LfoDestination.OSCILLATOR_MIX,
    },
  };

  constructor(audioContext: AudioContext) {
    this.voiceGenerator = createVoiceGenerator(audioContext);
    this.channels = Array.from({ length: 16 }).map(() => new Map());
    this.output = new GainNode(audioContext);
  }

  next({ frequency, midiValue, channel }): Voice {
    const voiceMap = this.channels[channel - 1];
    if (voiceMap.has(midiValue)) {
      return voiceMap.get(midiValue);
    }
    const voice = this.voiceGenerator.next().value;
    voice.frequency.value = frequency;
    voice.osc1 = this.state.osc1.mode;
    voice.osc1SemiShift.value = this.state.osc1.semiShift;
    voice.osc1CentShift.value = this.state.osc1.centShift;
    voice.osc2 = this.state.osc2.mode;
    voice.osc2SemiShift.value = this.state.osc2.semiShift;
    voice.osc2CentShift.value = this.state.osc2.centShift;
    voice.osc2Amplitude.value = this.state.osc2Amplitude;
    voice.amplitudeAttack.value = this.state.osc1Envelope.attack;
    voice.amplitudeDecay.value = this.state.osc1Envelope.decay;
    voice.amplitudeSustain.value = this.state.osc1Envelope.sustain;
    voice.amplitudeRelease.value = this.state.osc1Envelope.release;
    voice.filterMode = this.state.filter.mode;
    voice.cutoff.value = this.state.filter.cutoff;
    voice.resonance.value = this.state.filter.resonance;
    voice.cutoffAttack.value = this.state.cutoffEnvelope.attack;
    voice.cutoffDecay.value = this.state.cutoffEnvelope.decay;
    voice.cutoffEnvelopeAmount.value = this.state.cutoffEnvelope.amount;
    voice.lfo1Frequency.value = this.state.lfo1.frequency;
    voice.lfo1ModAmount.value = this.state.lfo1.modAmount;
    voice.lfo1Mode = this.state.lfo1.mode;
    voice.lfo1Destination = this.state.lfo1.destination;
    voice.lfo2Frequency.value = this.state.lfo2.frequency;
    voice.lfo2ModAmount.value = this.state.lfo2.modAmount;
    voice.lfo2Mode = this.state.lfo2.mode;
    voice.lfo2Destination = this.state.lfo2.destination;
    voiceMap.set(midiValue, voice);
    voice.connect(this.output);
    voice.start();
    return voice;
  }

  stop({ midiValue, channel }) {
    const voiceMap = this.channels[channel - 1];
    if (voiceMap.has(midiValue)) {
      voiceMap.get(midiValue).stop();
      voiceMap.delete(midiValue);
    }
  }

  connect(input: AudioNode) {
    this.output.connect(input);
  }

  withState(state: any): VoiceManager {
    this.state = state;
    return this;
  }

  setOsc1Mode(newMode: OscillatorMode) {
    this.state.osc1.mode = newMode;
    this.dispatchUpdate((voice) => (voice.osc1 = newMode));
  }

  setOsc1SemiShift(newSemiShift: number) {
    this.state.osc1.semiShift = newSemiShift;
    this.dispatchUpdate((voice) => (voice.osc1SemiShift.value = newSemiShift));
  }

  setOsc1CentShift(newCentShift: number) {
    this.state.osc1.centShift = newCentShift;
    this.dispatchUpdate((voice) => (voice.osc1CentShift.value = newCentShift));
  }

  get osc1() {
    return this.state.osc1;
  }

  setOsc2Mode(newMode: OscillatorMode) {
    this.state.osc2.mode = newMode;
    this.dispatchUpdate((voice) => (voice.osc2 = newMode));
  }

  setOsc2SemiShift(newSemiShift: number) {
    this.state.osc2.semiShift = newSemiShift;
    this.dispatchUpdate((voice) => (voice.osc2SemiShift.value = newSemiShift));
  }

  setOsc2CentShift(newCentShift: number) {
    this.state.osc2.centShift = newCentShift;
    this.dispatchUpdate((voice) => (voice.osc2CentShift.value = newCentShift));
  }

  get osc2() {
    return this.state.osc2;
  }

  setOsc1EnvelopeAttack(newAttackTime: number) {
    this.state.osc1Envelope.attack = newAttackTime;
  }

  setOsc1EnvelopeDecay(newDecayTime: number) {
    this.state.osc1Envelope.decay = newDecayTime;
  }

  setOsc1EnvelopeSustain(newSustainLevel: number) {
    this.state.osc1Envelope.sustain = newSustainLevel;
  }

  setOsc1EnvelopeRelease(newReleaseTime: number) {
    this.state.osc1Envelope.release = newReleaseTime;
  }

  get osc1Envelope() {
    return this.state.osc1Envelope;
  }

  setOsc2Amplitude(newOsc2Amplitude: number) {
    this.state.osc2Amplitude = newOsc2Amplitude;
    this.dispatchUpdate(
      (voice) => (voice.osc2Amplitude.value = newOsc2Amplitude)
    );
  }

  get osc2Amplitude() {
    return this.state.osc2Amplitude;
  }

  setFilterMode(newMode: FilterMode) {
    this.state.filter.mode = newMode;
    this.dispatchUpdate((voice) => (voice.filterMode = newMode));
  }

  setFilterCutoff(newCutoff: number) {
    this.state.filter.cutoff = newCutoff;
    this.dispatchUpdate((voice) => (voice.cutoff.value = newCutoff));
  }

  setFilterResonance(newResonance: number) {
    this.state.filter.resonance = newResonance;
    this.dispatchUpdate((voice) => (voice.resonance.value = newResonance));
  }

  get filter() {
    return this.state.filter;
  }

  setCutoffEnvelopeAmount(newAmount: number) {
    this.state.cutoffEnvelope.amount = newAmount;
  }

  setCutoffEnvelopeAttack(newAttackTime: number) {
    this.state.cutoffEnvelope.attack = newAttackTime;
  }

  setCutoffEnvelopeDecay(newDecayTime: number) {
    this.state.cutoffEnvelope.decay = newDecayTime;
  }

  setLfo1Mode(newMode: OscillatorMode) {
    this.state.lfo1.mode = newMode;
    this.dispatchUpdate((voice) => (voice.lfo1Mode = newMode));
  }

  setLfo1Destination(newDestination: LfoDestination) {
    this.state.lfo1.destination = newDestination;
    this.dispatchUpdate((voice) => (voice.lfo1Destination = newDestination));
  }

  setLfo1Frequency(newFrequency: number) {
    this.state.lfo1.frequency = newFrequency;
    this.dispatchUpdate((voice) => (voice.lfo1Frequency.value = newFrequency));
  }

  setLfo1ModAmount(newAmount: number) {
    this.state.lfo1.modAmount = newAmount;
    this.dispatchUpdate((voice) => (voice.lfo1ModAmount.value = newAmount));
  }

  setLfo2Mode(newMode: OscillatorMode) {
    this.state.lfo2.mode = newMode;
    this.dispatchUpdate((voice) => (voice.lfo2Mode = newMode));
  }

  setLfo2Destination(newDestination: LfoDestination) {
    this.state.lfo2.destination = newDestination;
    this.dispatchUpdate((voice) => (voice.lfo2Destination = newDestination));
  }

  setLfo2Frequency(newFrequency: number) {
    this.state.lfo2.frequency = newFrequency;
    this.dispatchUpdate((voice) => (voice.lfo2Frequency.value = newFrequency));
  }

  setLfo2ModAmount(newAmount: number) {
    this.state.lfo2.modAmount = newAmount;
    this.dispatchUpdate((voice) => (voice.lfo2ModAmount.value = newAmount));
  }

  get cutoffEnvelope() {
    return this.state.cutoffEnvelope;
  }

  dispatchUpdate(doUpdate: (voice: Voice) => void) {
    for (const channel of this.channels) {
      for (const voice of channel.values()) {
        doUpdate(voice);
      }
    }
  }
}
