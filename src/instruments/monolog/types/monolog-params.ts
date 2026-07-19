// Must match wasm_audio::Monolog::ParamId in monolog-engine.h
export const MonologParamId = Object.freeze({
  OSC_MODE: 0,
  SUB_LEVEL: 1,
  NOISE_LEVEL: 2,
  CUTOFF: 3,
  RESONANCE: 4,
  DRIVE: 5,
  AMP_ATTACK: 6,
  AMP_DECAY: 7,
  AMP_SUSTAIN: 8,
  AMP_RELEASE: 9,
  FILTER_ATTACK: 10,
  FILTER_DECAY: 11,
  FILTER_AMOUNT: 12,
  FILTER_VELOCITY: 13,
  LFO_MODE: 14,
  LFO_RATE: 15,
  LFO_AMOUNT: 16,
  LFO_DESTINATION: 17,
  GLIDE_TIME: 18,
  LEGATO: 19,
  PULSE_WIDTH: 20,
  FILTER_MODEL: 21,
  PARAM_COUNT: 22,
});

// Must match wasm_audio::Monolog::FilterModel
export const MonologFilterModel = Object.freeze({
  MOOG: 0,
  ACID: 1,
  SCREAM: 2,
  KORG: 3,
});
