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
  lfoFrequency: AudioParam;
  lfoModAmount: AudioParam;
  lfoMode: OscillatorMode | string;
  start(time?: number): void;
  stop(time?: number): void;
  toggleLfoDestination(destination: LfoDestination, isEnabled: boolean);
}
