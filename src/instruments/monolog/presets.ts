import { SelectOptions } from "../../types/select-option";
import { MonologState } from "./types/monolog-state";

export const MonologPresetOptions = new SelectOptions([
  {
    name: "INIT",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 80 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 45 }, resonance: { value: 30 }, drive: { value: 35 } },
      ampEnv: { attack: { value: 2 }, decay: { value: 50 }, sustain: { value: 90 }, release: { value: 15 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 45 }, amount: { value: 55 }, velocity: { value: 40 } },
      lfo: { mode: { value: 0 }, rate: { value: 15 }, amount: { value: 0 }, destination: { value: 1 } },
      performance: { glide: { value: 15 }, legato: { value: 0 } },
    } as MonologState,
  },
  {
    name: "SUB BASS",
    value: {
      osc: { mode: { value: 0 }, pulseWidth: { value: 63.5 }, subLevel: { value: 100 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 40 }, resonance: { value: 10 }, drive: { value: 10 } },
      ampEnv: { attack: { value: 5 }, decay: { value: 30 }, sustain: { value: 127 }, release: { value: 20 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 20 }, amount: { value: 10 }, velocity: { value: 0 } },
      lfo: { mode: { value: 0 }, rate: { value: 10 }, amount: { value: 0 }, destination: { value: 1 } },
      performance: { glide: { value: 20 }, legato: { value: 127 } },
    } as MonologState,
  },
  {
    name: "ACID BASS",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 0 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 30 }, resonance: { value: 90 }, drive: { value: 60 } },
      ampEnv: { attack: { value: 0 }, decay: { value: 60 }, sustain: { value: 0 }, release: { value: 10 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 50 }, amount: { value: 100 }, velocity: { value: 80 } },
      lfo: { mode: { value: 0 }, rate: { value: 10 }, amount: { value: 0 }, destination: { value: 1 } },
      performance: { glide: { value: 30 }, legato: { value: 0 } },
    } as MonologState,
  },
  {
    name: "REESE BASS",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 60 }, noiseLevel: { value: 5 } },
      filter: { cutoff: { value: 60 }, resonance: { value: 30 }, drive: { value: 40 } },
      ampEnv: { attack: { value: 10 }, decay: { value: 50 }, sustain: { value: 90 }, release: { value: 40 } },
      filterEnv: { attack: { value: 5 }, decay: { value: 60 }, amount: { value: 50 }, velocity: { value: 20 } },
      lfo: { mode: { value: 0 }, rate: { value: 5 }, amount: { value: 15 }, destination: { value: 2 } },
      performance: { glide: { value: 40 }, legato: { value: 127 } },
    } as MonologState,
  },
  {
    name: "PLUCK BASS",
    value: {
      osc: { mode: { value: 2 }, pulseWidth: { value: 50 }, subLevel: { value: 30 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 50 }, resonance: { value: 40 }, drive: { value: 30 } },
      ampEnv: { attack: { value: 0 }, decay: { value: 50 }, sustain: { value: 0 }, release: { value: 15 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 40 }, amount: { value: 80 }, velocity: { value: 60 } },
      lfo: { mode: { value: 0 }, rate: { value: 10 }, amount: { value: 0 }, destination: { value: 1 } },
      performance: { glide: { value: 0 }, legato: { value: 0 } },
    } as MonologState,
  },
  {
    name: "RUBBER BASS",
    value: {
      osc: { mode: { value: 2 }, pulseWidth: { value: 40 }, subLevel: { value: 50 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 45 }, resonance: { value: 60 }, drive: { value: 50 } },
      ampEnv: { attack: { value: 3 }, decay: { value: 70 }, sustain: { value: 60 }, release: { value: 30 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 55 }, amount: { value: 70 }, velocity: { value: 50 } },
      lfo: { mode: { value: 3 }, rate: { value: 40 }, amount: { value: 10 }, destination: { value: 0 } },
      performance: { glide: { value: 50 }, legato: { value: 127 } },
    } as MonologState,
  },
  {
    name: "GROWL",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 40 }, noiseLevel: { value: 10 } },
      filter: { cutoff: { value: 55 }, resonance: { value: 70 }, drive: { value: 80 } },
      ampEnv: { attack: { value: 5 }, decay: { value: 60 }, sustain: { value: 80 }, release: { value: 25 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 50 }, amount: { value: 60 }, velocity: { value: 40 } },
      lfo: { mode: { value: 1 }, rate: { value: 60 }, amount: { value: 30 }, destination: { value: 1 } },
      performance: { glide: { value: 10 }, legato: { value: 0 } },
    } as MonologState,
  },
  {
    name: "WOBBLE",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 70 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 40 }, resonance: { value: 50 }, drive: { value: 40 } },
      ampEnv: { attack: { value: 0 }, decay: { value: 40 }, sustain: { value: 100 }, release: { value: 30 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 40 }, amount: { value: 30 }, velocity: { value: 20 } },
      lfo: { mode: { value: 0 }, rate: { value: 30 }, amount: { value: 60 }, destination: { value: 1 } },
      performance: { glide: { value: 20 }, legato: { value: 127 } },
    } as MonologState,
  },
  {
    name: "303 ACID",
    value: {
      osc: { mode: { value: 1 }, pulseWidth: { value: 63.5 }, subLevel: { value: 0 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 25 }, resonance: { value: 100 }, drive: { value: 70 } },
      ampEnv: { attack: { value: 0 }, decay: { value: 45 }, sustain: { value: 0 }, release: { value: 10 } },
      filterEnv: { attack: { value: 0 }, decay: { value: 35 }, amount: { value: 110 }, velocity: { value: 100 } },
      lfo: { mode: { value: 0 }, rate: { value: 10 }, amount: { value: 0 }, destination: { value: 1 } },
      performance: { glide: { value: 35 }, legato: { value: 0 } },
    } as MonologState,
  },
  {
    name: "DEEP DUB",
    value: {
      osc: { mode: { value: 0 }, pulseWidth: { value: 63.5 }, subLevel: { value: 90 }, noiseLevel: { value: 0 } },
      filter: { cutoff: { value: 50 }, resonance: { value: 25 }, drive: { value: 20 } },
      ampEnv: { attack: { value: 8 }, decay: { value: 50 }, sustain: { value: 80 }, release: { value: 50 } },
      filterEnv: { attack: { value: 5 }, decay: { value: 60 }, amount: { value: 30 }, velocity: { value: 10 } },
      lfo: { mode: { value: 0 }, rate: { value: 8 }, amount: { value: 10 }, destination: { value: 1 } },
      performance: { glide: { value: 30 }, legato: { value: 127 } },
    } as MonologState,
  },
]);
