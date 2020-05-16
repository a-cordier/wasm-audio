export interface Voice {
  frequency: AudioParam;
  amplitudeAttack: AudioParam;
  amplitudeDecay: AudioParam;
  amplitudeSustain: AudioParam;
  amplitudeRelease: AudioParam;
  cutoff: AudioParam;
  resonance: AudioParam;
  cutoffAttack: AudioParam;
  cutoffDecay: AudioParam;
  cutoffEnvelopeAmount: AudioParam;
  start(time?: number): void;
  stop(time?: number): void;
}
