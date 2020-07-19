import { FilterMode } from "./filter-mode";
import { OscillatorMode } from "./oscillator-mode";
import { LfoDestination } from "./lfo-destination";

export interface Voice extends AudioNode {
  osc1: OscillatorMode | string;
  osc2: OscillatorMode | string;
  osc1SemiShift: AudioParam;
  osc2SemiShift: AudioParam;
  osc1CentShift: AudioParam;
  osc2CentShift: AudioParam;
  frequency: AudioParam;
  amplitudeAttack: AudioParam;
  amplitudeDecay: AudioParam;
  amplitudeSustain: AudioParam;
  amplitudeRelease: AudioParam;
  filterMode: FilterMode;
  cutoff: AudioParam;
  resonance: AudioParam;
  cutoffAttack: AudioParam;
  cutoffDecay: AudioParam;
  cutoffEnvelopeAmount: AudioParam;
  osc2Amplitude: AudioParam;
  lfo1Frequency: AudioParam;
  lfo1ModAmount: AudioParam;
  lfo1Mode: OscillatorMode | string;
  lfo1Destination: LfoDestination | string;
  lfo2Frequency: AudioParam;
  lfo2ModAmount: AudioParam;
  lfo2Mode: OscillatorMode | string;
  lfo2Destination: LfoDestination | string;
  start(time?: number): void;
  stop(time?: number): void;
}
