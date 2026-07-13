export interface MonologState {
  osc: {
    mode: { value: number };
    pulseWidth: { value: number };
    subLevel: { value: number };
    noiseLevel: { value: number };
  };
  filter: {
    cutoff: { value: number };
    resonance: { value: number };
    drive: { value: number };
  };
  ampEnv: {
    attack: { value: number };
    decay: { value: number };
    sustain: { value: number };
    release: { value: number };
  };
  filterEnv: {
    attack: { value: number };
    decay: { value: number };
    amount: { value: number };
    velocity: { value: number };
  };
  lfo: {
    mode: { value: number };
    rate: { value: number };
    amount: { value: number };
    destination: { value: number };
  };
  performance: {
    glide: { value: number };
    legato: { value: number };
  };
}

export function createMonologState(partial?: Partial<any>): MonologState {
  const defaults: MonologState = {
    osc: {
      mode: { value: 1 },
      pulseWidth: { value: 63.5 },
      subLevel: { value: 80 },
      noiseLevel: { value: 0 },
    },
    filter: {
      cutoff: { value: 45 },
      resonance: { value: 30 },
      drive: { value: 35 },
    },
    ampEnv: {
      attack: { value: 2 },
      decay: { value: 50 },
      sustain: { value: 90 },
      release: { value: 15 },
    },
    filterEnv: {
      attack: { value: 0 },
      decay: { value: 45 },
      amount: { value: 55 },
      velocity: { value: 40 },
    },
    lfo: {
      mode: { value: 0 },
      rate: { value: 15 },
      amount: { value: 0 },
      destination: { value: 1 },
    },
    performance: {
      glide: { value: 15 },
      legato: { value: 0 },
    },
  };

  if (!partial) return defaults;

  return {
    osc: { ...defaults.osc, ...partial.osc },
    filter: { ...defaults.filter, ...partial.filter },
    ampEnv: { ...defaults.ampEnv, ...partial.ampEnv },
    filterEnv: { ...defaults.filterEnv, ...partial.filterEnv },
    lfo: { ...defaults.lfo, ...partial.lfo },
    performance: { ...defaults.performance, ...partial.performance },
  };
}
