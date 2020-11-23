import {
  RENDER_QUANTUM_FRAMES, // 128
  MAX_CHANNEL_COUNT, // 32
  HeapAudioBuffer,
  HeapParameterBuffer,
} from "./wasm-audio-helper.js";

import {
  staticParameterDescriptors,
  automatedParameterDescriptors,
  WaveFormParam,
  FilterModeParam,
  BooleanParam,
  LfoDestinationParam,
} from "./voice-processor-parameters.js";

import wasm from "./voice-kernel.wasmmodule.js";

const waveforms = Object.freeze({
  [WaveFormParam.SINE]: wasm.WaveForm.SINE,
  [WaveFormParam.SAWTOOTH]: wasm.WaveForm.SAW,
  [WaveFormParam.SQUARE]: wasm.WaveForm.SQUARE,
  [WaveFormParam.TRIANGLE]: wasm.WaveForm.TRIANGLE,
});

const FilterMode = Object.freeze({
  [FilterModeParam.LOWPASS]: wasm.FilterMode.LOWPASS,
  [FilterModeParam.LOWPASS_PLUS]: wasm.FilterMode.LOWPASS_PLUS,
  [FilterModeParam.BANDPASS]: wasm.FilterMode.BANDPASS,
  [FilterModeParam.HIGHPASS]: wasm.FilterMode.HIGHPASS,
});

const LfoDestination = Object.freeze({
  [LfoDestinationParam.FREQUENCY]: wasm.LfoDestination.FREQUENCY,
  [LfoDestinationParam.OSCILLATOR_MIX]: wasm.LfoDestination.OSCILLATOR_MIX,
  [LfoDestinationParam.CUTOFF]: wasm.LfoDestination.CUTOFF,
  [LfoDestinationParam.RESONANCE]: wasm.LfoDestination.RESONANCE,
});

function createParameterBuffers(parameterDescriptors = []) {
  return new Map(parameterDescriptors.map(toParameterBufferEntry));
}

function toParameterBufferEntry(descriptor) {
  return [descriptor.name, new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES)];
}

function kValueOf(param) {
  return param[0];
}

function isStarting(parameters) {
  return parameters.startTime >= currentTime;
}

function isStopping(parameters) {
  return kValueOf(parameters.stopped) === BooleanParam.TRUE && parameters.stopTime <= currentTime;
}

class VoiceProcessor extends AudioWorkletProcessor {
  outputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);

  parameterBuffers = createParameterBuffers(automatedParameterDescriptors);

  // noinspection JSUnresolvedFunction
  kernel = new wasm.VoiceKernel(sampleRate, RENDER_QUANTUM_FRAMES);

  static get parameterDescriptors() {
    return [...staticParameterDescriptors, ...automatedParameterDescriptors];
  }

  process(inputs, outputs, parameters) {
    if (isStarting(parameters)) {
      return true;
    }

    if (this.kernel.isStopped()) {
      this.freeBuffers();
      return false;
    }

    if (isStopping(parameters)) {
      this.kernel.enterReleaseStage();
    }

    const output = outputs[0];
    const channelCount = output.length;

    this.allocateBuffers(channelCount, parameters);

    // Static parameters
    this.kernel.setOsc1Mode(waveforms[kValueOf(parameters.osc1)]);
    this.kernel.setOsc2Mode(waveforms[kValueOf(parameters.osc2)]);
    this.kernel.setFilterMode(FilterMode[kValueOf(parameters.filterMode)]);
    this.kernel.setLfo1Mode(waveforms[kValueOf(parameters.lfo1Mode)]);
    this.kernel.setLfo2Mode(waveforms[kValueOf(parameters.lfo2Mode)]);
    this.kernel.setLfo1Destination(LfoDestination[kValueOf(parameters.lfo1Destination)]);
    this.kernel.setLfo2Destination(LfoDestination[kValueOf(parameters.lfo2Destination)]);

    // Oscillators parameters
    this.kernel.setAmplitudeAttack(this.parameterBuffers.get("amplitudeAttack").getHeapAddress());
    this.kernel.setAmplitudeDecay(this.parameterBuffers.get("amplitudeDecay").getHeapAddress());
    this.kernel.setAmplitudeSustain(this.parameterBuffers.get("amplitudeSustain").getHeapAddress());
    this.kernel.setAmplitudeRelease(this.parameterBuffers.get("amplitudeRelease").getHeapAddress());
    this.kernel.setOsc1SemiShift(this.parameterBuffers.get("osc1SemiShift").getHeapAddress());
    this.kernel.setOsc1CentShift(this.parameterBuffers.get("osc1CentShift").getHeapAddress());
    this.kernel.setOsc2SemiShift(this.parameterBuffers.get("osc2SemiShift").getHeapAddress());
    this.kernel.setOsc2CentShift(this.parameterBuffers.get("osc2CentShift").getHeapAddress());
    this.kernel.setOsc2Amplitude(this.parameterBuffers.get("osc2Amplitude").getHeapAddress());

    // Filter parameters
    this.kernel.setCutoff(this.parameterBuffers.get("cutoff").getHeapAddress());
    this.kernel.setResonance(this.parameterBuffers.get("resonance").getHeapAddress());
    this.kernel.setCutoffEnvelopeAmount(this.parameterBuffers.get("cutoffEnvelopeAmount").getHeapAddress());
    this.kernel.setCutoffEnvelopeAttack(this.parameterBuffers.get("cutoffAttack").getHeapAddress());
    this.kernel.setCutoffEnvelopeDecay(this.parameterBuffers.get("cutoffDecay").getHeapAddress());

    // LFO parameters
    this.kernel.setLfo1Frequency(this.parameterBuffers.get("lfo1Frequency").getHeapAddress());
    this.kernel.setLfo1ModAmount(this.parameterBuffers.get("lfo1ModAmount").getHeapAddress());
    this.kernel.setLfo2Frequency(this.parameterBuffers.get("lfo2Frequency").getHeapAddress());
    this.kernel.setLfo2ModAmount(this.parameterBuffers.get("lfo2ModAmount").getHeapAddress());

    // Web Assembly rendering
    this.kernel.process(
      this.outputBuffer.getHeapAddress(),
      channelCount,
      this.parameterBuffers.get("frequency").getHeapAddress()
    );

    for (let channel = 0; channel < channelCount; ++channel) {
      output[channel].set(this.outputBuffer.getChannelData(channel));
    }

    return true;
  }

  allocateBuffers(channelCount, parameters) {
    this.outputBuffer.adaptChannel(channelCount);
    this.parameterBuffers.forEach((buffer, name) => {
      buffer.getData().set(parameters[name]);
    });
  }

  freeBuffers() {
    this.outputBuffer.free();
    this.parameterBuffers.forEach((buffer) => {
      buffer.free();
    });
  }
}
// noinspection JSUnresolvedFunction
registerProcessor("voice", VoiceProcessor);
