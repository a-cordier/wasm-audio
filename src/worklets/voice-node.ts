import { FilterMode } from "../types/filter-mode";
import { LfoDestination } from "../types/lfo-destination";

function createStartMessage(time) {
  return {
    type: "START",
    time,
  };
}

function createStopMessage(time) {
  return {
    type: "STOP",
    time,
  };
}

function createWaveformMessage(target, waveform) {
  return {
    type: "WAVEFORM",
    waveform,
    target,
  };
}

function createFilterModeMessage(mode: FilterMode) {
  return {
    type: "FILTER_MODE",
    mode,
  };
}

function createLfoDestinationMessage(target, destination: LfoDestination) {
  return {
    type: "LFO_DESTINATION",
    destination,
    target,
  };
}

export class WasmVoiceNode extends AudioWorkletNode {
  private params: Map<string, AudioParam>;

  constructor(audioContext: AudioContext) {
    super(audioContext, "voice");
    this.params = this.parameters as Map<string, AudioParam>;
  }

  start(time = this.context.currentTime) {
    this.port.postMessage(createStartMessage(time));
  }

  stop(time = this.context.currentTime) {
    this.port.postMessage(createStopMessage(time));
  }

  get frequency() {
    return this.params.get("frequency");
  }

  get amplitude() {
    return this.params.get("amplitude");
  }

  get amplitudeAttack() {
    return this.params.get("amplitudeAttack");
  }

  get amplitudeDecay() {
    return this.params.get("amplitudeDecay");
  }

  get amplitudeSustain() {
    return this.params.get("amplitudeSustain");
  }

  get amplitudeRelease() {
    return this.params.get("amplitudeRelease");
  }

  get cutoff() {
    return this.params.get("cutoff");
  }

  get resonance() {
    return this.params.get("resonance");
  }

  get cutoffEnvelopeAmount() {
    return this.params.get("cutoffEnvelopeAmount");
  }

  get cutoffAttack() {
    return this.params.get("cutoffAttack");
  }

  get cutoffDecay() {
    return this.params.get("cutoffDecay");
  }

  get osc1SemiShift() {
    return this.params.get("osc1SemiShift");
  }

  get osc1CentShift() {
    return this.params.get("osc1CentShift");
  }

  get osc2SemiShift() {
    return this.params.get("osc2SemiShift");
  }

  get osc2CentShift() {
    return this.params.get("osc2CentShift");
  }

  get osc2Amplitude() {
    return this.params.get("osc2Amplitude");
  }

  set osc1(type: string) {
    this.port.postMessage(createWaveformMessage("osc1", type));
  }

  set osc2(type: string) {
    this.port.postMessage(createWaveformMessage("osc2", type));
  }

  set filterMode(mode: FilterMode) {
    this.port.postMessage(createFilterModeMessage(mode));
  }

  get lfo1Frequency() {
    return this.params.get("lfo1Frequency");
  }

  get lfo1ModAmount() {
    return this.params.get("lfo1ModAmount");
  }

  set lfo1Mode(mode: string) {
    this.port.postMessage(createWaveformMessage("lfo1", mode));
  }

  set lfo1Destination(destination: LfoDestination) {
    this.port.postMessage(createLfoDestinationMessage("lfo1", destination));
  }

  get lfo2Frequency() {
    return this.params.get("lfo2Frequency");
  }

  get lfo2ModAmount() {
    return this.params.get("lfo2ModAmount");
  }

  set lfo2Mode(mode: string) {
    this.port.postMessage(createWaveformMessage("lfo2", mode));
  }

  set lfo2Destination(destination: LfoDestination) {
    this.port.postMessage(createLfoDestinationMessage("lfo2", destination));
  }
}
