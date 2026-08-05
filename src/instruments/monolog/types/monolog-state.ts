export interface MonologState {
  osc: {
    mode: { value: number };
    pulseWidth: { value: number };
    subLevel: { value: number };
    noiseLevel: { value: number };
    subWave: { value: number };
    subOctave: { value: number };
    detune: { value: number };
  };
  filter: {
    model: { value: number };
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
    accent: { value: number };
    dirt: { value: number };
  };
}

export function createMonologState(partial?: Partial<any>): MonologState {
  const defaults: MonologState = {
    osc: {
      mode: { value: 1 },
      pulseWidth: { value: 63.5 },
      subLevel: { value: 80 },
      noiseLevel: { value: 0 },
      subWave: { value: 2 },
      subOctave: { value: 0 },
      detune: { value: 0 },
    },
    filter: {
      model: { value: 0 },
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
      accent: { value: 0 },
      dirt: { value: 0 },
    },
  };

  if (!partial) return defaults;

  // Clone down to the individual { value } objects. A shallow spread copies
  // those objects by reference straight out of the preset literal, so every
  // knob move would rewrite the factory preset for the rest of the session.
  const mergeSection = <T extends Record<string, { value: number }>>(
    defaultSection: T,
    partialSection: Partial<T> | undefined,
  ): T => {
    const merged = {} as T;
    for (const key of Object.keys(defaultSection) as (keyof T)[]) {
      const source = partialSection?.[key] ?? defaultSection[key];
      merged[key] = { value: source.value } as T[keyof T];
    }
    return merged;
  };

  return {
    osc: mergeSection(defaults.osc, partial.osc),
    filter: mergeSection(defaults.filter, partial.filter),
    ampEnv: mergeSection(defaults.ampEnv, partial.ampEnv),
    filterEnv: mergeSection(defaults.filterEnv, partial.filterEnv),
    lfo: mergeSection(defaults.lfo, partial.lfo),
    performance: mergeSection(defaults.performance, partial.performance),
  };
}
