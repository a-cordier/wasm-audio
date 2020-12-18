import { FilterMode } from "./filter-mode";
import { OscillatorMode } from "./oscillator-mode";
import { LfoDestination } from "./lfo-destination";
import { MidiControlID } from "./midi-learn-options";
import { Control, SelectControl, MidiControl, ControlValue } from "./control";
import { FilterState } from "./filter-state";

type MidiControlMap = Map<MidiControlID, MidiControl>;

export interface OscillatorState {
  mode: Control;
  semiShift: Control;
  centShift: Control;
  cycle: Control;
}

export interface EnvelopeState {
  attack: Control;
  decay: Control;
  sustain: Control;
  release: Control;
}

export interface CutoffModState {
  attack: Control;
  decay: Control;
  amount: Control;
}

export interface LFOState {
  mode: Control;
  frequency: Control;
  modAmount: Control;
  destination: Control;
}

export interface VoiceState {
  osc1: OscillatorState;
  osc2: OscillatorState;
  osc2Amplitude: Control;
  envelope: EnvelopeState;
  filter: FilterState;
  cutoffMod: CutoffModState;
  lfo1: LFOState;
  lfo2: LFOState;
  findMidiControlById(id: MidiControlID): MidiControl | undefined;
}

export interface Voice extends AudioNode {
  osc1: AudioParam;
  osc2: AudioParam;
  osc1SemiShift: AudioParam;
  osc2SemiShift: AudioParam;
  osc1CentShift: AudioParam;
  osc2CentShift: AudioParam;
  osc1Cycle: AudioParam;
  osc2Cycle: AudioParam;
  frequency: AudioParam;
  amplitudeAttack: AudioParam;
  amplitudeDecay: AudioParam;
  amplitudeSustain: AudioParam;
  amplitudeRelease: AudioParam;
  filterMode: AudioParam;
  cutoff: AudioParam;
  resonance: AudioParam;
  cutoffAttack: AudioParam;
  cutoffDecay: AudioParam;
  cutoffEnvelopeAmount: AudioParam;
  osc2Amplitude: AudioParam;
  lfo1Frequency: AudioParam;
  lfo1ModAmount: AudioParam;
  lfo1Mode: AudioParam;
  lfo1Destination: AudioParam;
  lfo2Frequency: AudioParam;
  lfo2ModAmount: AudioParam;
  lfo2Mode: AudioParam;
  lfo2Destination: AudioParam;
  start(time?: number): void;
  stop(time?: number): void;
}

function findMidiControlEntries(state: VoiceState | any) {
  const midiControls = [];
  for (const value of Object.values(state)) {
    if (value instanceof MidiControl) {
      midiControls.push([value.id, value]);
    } else if (value instanceof Object) {
      midiControls.push(...findMidiControlEntries(value));
    }
  }
  return midiControls;
}

function computeMidiControlMap(state: Partial<VoiceState>) {
  const midiControlEntries = findMidiControlEntries(state);
  return new Map(midiControlEntries) as MidiControlMap;
}

export function mapState(state: Partial<VoiceState>): Partial<VoiceState> {
  return {
    osc1: {
      mode: new SelectControl(state.osc1.mode.value),
      semiShift: new MidiControl(
        MidiControlID.OSC1_SEMI,
        state.osc1.semiShift.value
      ),
      centShift: new MidiControl(
        MidiControlID.OSC1_CENT,
        state.osc1.centShift.value
      ),
      cycle: new MidiControl(
        MidiControlID.OSC1_CYCLE,
        state.osc1.cycle.value
      )
    },
    osc2: {
      mode: new SelectControl(state.osc2.mode.value),
      semiShift: new MidiControl(
        MidiControlID.OSC2_SEMI,
        state.osc2.semiShift.value
      ),
      centShift: new MidiControl(
        MidiControlID.OSC2_CENT,
        state.osc2.centShift.value
      ),
      cycle: new MidiControl(
        MidiControlID.OSC2_CYCLE,
        state.osc2.cycle.value
      )
    },
    osc2Amplitude: new MidiControl(
      MidiControlID.OSC_MIX,
      state.osc2Amplitude.value
    ),
    envelope: {
      attack: new MidiControl(
        MidiControlID.ATTACK,
        state.envelope.attack.value
      ),
      decay: new MidiControl(MidiControlID.DECAY, state.envelope.decay.value),
      sustain: new MidiControl(
        MidiControlID.SUSTAIN,
        state.envelope.sustain.value
      ),
      release: new MidiControl(
        MidiControlID.RELEASE,
        state.envelope.release.value
      ),
    },
    filter: {
      mode: new SelectControl(state.filter.mode.value),
      cutoff: new MidiControl(MidiControlID.CUTOFF, state.filter.cutoff.value),
      resonance: new MidiControl(
        MidiControlID.RESONANCE,
        state.filter.resonance.value
      ),
    },
    cutoffMod: {
      attack: new MidiControl(
        MidiControlID.CUT_ATTACK,
        state.cutoffMod.attack.value
      ),
      decay: new MidiControl(
        MidiControlID.CUT_DECAY,
        state.cutoffMod.decay.value
      ),
      amount: new MidiControl(
        MidiControlID.CUT_MOD,
        state.cutoffMod.amount.value
      ),
    },
    lfo1: {
      mode: new SelectControl(state.lfo1.mode.value),
      destination: new SelectControl(state.lfo1.destination.value),
      frequency: new MidiControl(
        MidiControlID.LFO1_FREQ,
        state.lfo1.frequency.value
      ),
      modAmount: new MidiControl(
        MidiControlID.LFO1_MOD,
        state.lfo1.modAmount.value
      ),
    },
    lfo2: {
      mode: new SelectControl(state.lfo2.mode.value),
      destination: new SelectControl(state.lfo2.destination.value),
      frequency: new MidiControl(
        MidiControlID.LFO2_FREQ,
        state.lfo2.frequency.value
      ),
      modAmount: new MidiControl(
        MidiControlID.LFO2_MOD,
        state.lfo2.modAmount.value
      ),
    },
  };
}
export function createVoiceState(state: Partial<VoiceState>): VoiceState {
  const newState = mapState(state);
  const midiControlMap = computeMidiControlMap(newState);

  return Object.assign(newState as VoiceState, {
    findMidiControlById(id: MidiControlID): MidiControl {
      return midiControlMap.get(id);
    },
  });
}
