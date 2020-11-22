export const BooleanParam = Object.freeze({
  TRUE: 1,
  FALSE: 0,
});

export const WaveFormParam = Object.freeze({
  SINE: 0,
  SAWTOOTH: 1,
  SQUARE: 2,
  TRIANGLE: 3,
});

export const FilterModeParam = Object.freeze({
  LOWPASS: 0,
  LOWPASS_PLUS: 1,
  BANDPASS: 2,
  HIGHPASS: 3,
});

export const LfoDestinationParam = Object.freeze({
  FREQUENCY: 0,
  OSCILLATOR_MIX: 1,
  CUTOFF: 2,
  RESONANCE: 3,
});

export const staticParameterDescriptors = [
  {
    name: "startTime",
    defaultValue: -1,
    minValue: 0,
    automationRate: "k-rate",
  },
  {
    name: "stopped",
    defaultValue: BooleanParam.TRUE,
    minValue: BooleanParam.FALSE,
    maxValue: BooleanParam.TRUE,
    automationRate: "k-rate",
  },
  {
    name: "stopTime",
    defaultValue: -1,
    minValue: 0,
    automationRate: "k-rate",
  },
  {
    name: "osc1",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate",
  },
  {
    name: "osc2",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate",
  },
  {
    name: "lfo1Mode",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate",
  },
  {
    name: "lfo2Mode",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate",
  },
  {
    name: "lfo1Destination",
    defaultValue: LfoDestinationParam.OSCILLATOR_MIX,
    minValue: LfoDestinationParam.FREQUENCY,
    maxValue: LfoDestinationParam.RESONANCE,
    automationRate: "k-rate",
  },
  {
    name: "lfo2Destination",
    defaultValue: LfoDestinationParam.CUTOFF,
    minValue: LfoDestinationParam.FREQUENCY,
    maxValue: LfoDestinationParam.RESONANCE,
    automationRate: "k-rate",
  },
  {
    name: "filterMode",
    defaultValue: FilterModeParam.LOWPASS,
    minValue: FilterModeParam.LOWPASS,
    maxValue: FilterModeParam.HIGHPASS,
    automationRate: "k-rate",
  },
];

export const automatedParameterDescriptors = [
  {
    name: "frequency",
    defaultValue: 440,
    minValue: 0,
    maxValue: 16744,
    automationRate: "a-rate",
  },
  {
    name: "amplitude",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 1,
    automationRate: "a-rate",
  },
  {
    name: "amplitudeAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeSustain",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeRelease",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoff",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "resonance",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "cutoffAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoffDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoffEnvelopeAmount",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc1SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc1CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2Amplitude",
    defaultValue: 127 / 2,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo1Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo1ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo2Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo2ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
];
