import { SelectOptions } from "./select-option";

enum MidiLearnOption {
  OSC1_SEMI,
  OSC1_CENT,
  OSC_MIX,
  OSC2_SEMI,
  OSC2_CENT,
  CUTOFF,
  RESONANCE,
  ATTACK,
  DECAY,
  SUSTAIN,
  RELEASE,
  LFO1_FREQ,
  LFO1_MOD,
  LFO2_FREQ,
  LFO2_MOD,
  CUT_MOD,
  CUT_ATTACK,
  CUT_DECAY,
}

function toSelectOption(option: MidiLearnOption) {
  return {
    name: MidiLearnOption[option].replace(/_/g, " "),
    value: option,
  };
}

export const MidiLearnOptions = new SelectOptions([
  toSelectOption(MidiLearnOption.OSC1_SEMI),
  toSelectOption(MidiLearnOption.OSC1_CENT),
  toSelectOption(MidiLearnOption.OSC_MIX),
  toSelectOption(MidiLearnOption.OSC2_SEMI),
  toSelectOption(MidiLearnOption.OSC2_CENT),
  toSelectOption(MidiLearnOption.CUTOFF),
  toSelectOption(MidiLearnOption.RESONANCE),
  toSelectOption(MidiLearnOption.ATTACK),
  toSelectOption(MidiLearnOption.DECAY),
  toSelectOption(MidiLearnOption.SUSTAIN),
  toSelectOption(MidiLearnOption.RELEASE),
  toSelectOption(MidiLearnOption.LFO1_FREQ),
  toSelectOption(MidiLearnOption.LFO1_MOD),
  toSelectOption(MidiLearnOption.LFO2_FREQ),
  toSelectOption(MidiLearnOption.LFO2_MOD),
  toSelectOption(MidiLearnOption.CUT_MOD),
  toSelectOption(MidiLearnOption.CUT_ATTACK),
  toSelectOption(MidiLearnOption.CUT_DECAY),
]);
