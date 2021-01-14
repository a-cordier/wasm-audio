import { RENDER_QUANTUM_FRAMES, MAX_CHANNEL_COUNT, HeapAudioBuffer, HeapParameterBuffer } from "./wasm-audio-helper.js";

import {
  staticParameterDescriptors,
  automatedParameterDescriptors,
  VoiceState,
  WaveFormParam,
  FilterModeParam,
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
  [LfoDestinationParam.OSC1_CYCLE]: wasm.LfoDestination.OSC1_CYCLE,
  [LfoDestinationParam.OSC2_CYCLE]: wasm.LfoDestination.OSC2_CYCLE,
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

function isStarted(parameters) {
  return kValueOf(parameters.state) === VoiceState.STARTED;
}

function isStopped(parameters) {
  return kValueOf(parameters.state) === VoiceState.STOPPED;
}

class KernelPool {
  pool = [];

  constructor(length = 8) {
    this.pool = Array.from({ length }).map(() => new wasm.VoiceKernel(sampleRate, RENDER_QUANTUM_FRAMES));
  }

  acquire() {
    return this.pool.shift();
  }

  release(kernel) {
    kernel.reset();
    this.pool.push(kernel);
  }
}

const pool = new KernelPool(128);

class VoiceProcessor extends AudioWorkletProcessor {
  outputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);

  parameterBuffers = createParameterBuffers(automatedParameterDescriptors);

  kernel = pool.acquire();

  state = VoiceState.DISPOSED;

  static get parameterDescriptors() {
    return [...staticParameterDescriptors, ...automatedParameterDescriptors];
  }

  process(inputs, outputs, parameters) {
    if (!isStarted(parameters) && this.state === VoiceState.DISPOSED) {
      return true;
    }

    if (this.state === VoiceState.DISPOSED) {
      this.state = VoiceState.STARTED;
    }

    if (this.kernel.isStopped()) {
      this.freeBuffers();
      pool.release(this.kernel);
      return false;
    }

    const output = outputs[0];
    const channelCount = output.length;

    this.allocateBuffers(channelCount, parameters);

    if (isStopped(parameters) && this.state !== VoiceState.STOPPING) {
      this.kernel.enterReleaseStage();
      this.state = VoiceState.STOPPING;
    }

    this.kernel.setVelocity(kValueOf(parameters.velocity));

    // Envelope parameters
    this.kernel.setAmplitudeAttack(this.parameterBuffers.get("amplitudeAttack").getHeapAddress());
    this.kernel.setAmplitudeDecay(this.parameterBuffers.get("amplitudeDecay").getHeapAddress());
    this.kernel.setAmplitudeSustain(this.parameterBuffers.get("amplitudeSustain").getHeapAddress());
    this.kernel.setAmplitudeRelease(this.parameterBuffers.get("amplitudeRelease").getHeapAddress());

    // First oscillator parameters
    this.kernel.setOsc1Mode(waveforms[kValueOf(parameters.osc1)]);
    this.kernel.setOsc1SemiShift(this.parameterBuffers.get("osc1SemiShift").getHeapAddress());
    this.kernel.setOsc1CentShift(this.parameterBuffers.get("osc1CentShift").getHeapAddress());
    this.kernel.setOsc1Cycle(this.parameterBuffers.get("osc1Cycle").getHeapAddress());

    // Second oscillator parameters
    this.kernel.setOsc2Mode(waveforms[kValueOf(parameters.osc2)]);
    this.kernel.setOsc2SemiShift(this.parameterBuffers.get("osc2SemiShift").getHeapAddress());
    this.kernel.setOsc2CentShift(this.parameterBuffers.get("osc2CentShift").getHeapAddress());
    this.kernel.setOsc2Cycle(this.parameterBuffers.get("osc2Cycle").getHeapAddress());
    this.kernel.setOsc2Amplitude(this.parameterBuffers.get("osc2Amplitude").getHeapAddress());

    this.kernel.setNoiseLevel(this.parameterBuffers.get("noiseLevel").getHeapAddress());

    // Filter parameters
    this.kernel.setFilterMode(FilterMode[kValueOf(parameters.filterMode)]);
    this.kernel.setCutoff(this.parameterBuffers.get("cutoff").getHeapAddress());
    this.kernel.setResonance(this.parameterBuffers.get("resonance").getHeapAddress());
    this.kernel.setDrive(this.parameterBuffers.get("drive").getHeapAddress());

    // Filter cutoff modulation parameters
    this.kernel.setCutoffEnvelopeAmount(this.parameterBuffers.get("cutoffEnvelopeAmount").getHeapAddress());
    this.kernel.setCutoffEnvelopeVelocity(this.parameterBuffers.get("cutoffEnvelopeVelocity").getHeapAddress());
    this.kernel.setCutoffEnvelopeAttack(this.parameterBuffers.get("cutoffAttack").getHeapAddress());
    this.kernel.setCutoffEnvelopeDecay(this.parameterBuffers.get("cutoffDecay").getHeapAddress());

    // First LFO parameters
    this.kernel.setLfo1Destination(LfoDestination[kValueOf(parameters.lfo1Destination)]);
    this.kernel.setLfo1Mode(waveforms[kValueOf(parameters.lfo1Mode)]);
    this.kernel.setLfo1Frequency(this.parameterBuffers.get("lfo1Frequency").getHeapAddress());
    this.kernel.setLfo1ModAmount(this.parameterBuffers.get("lfo1ModAmount").getHeapAddress());

    // Second LFO parameters
    this.kernel.setLfo2Destination(LfoDestination[kValueOf(parameters.lfo2Destination)]);
    this.kernel.setLfo2Mode(waveforms[kValueOf(parameters.lfo2Mode)]);
    this.kernel.setLfo2Frequency(this.parameterBuffers.get("lfo2Frequency").getHeapAddress());
    this.kernel.setLfo2ModAmount(this.parameterBuffers.get("lfo2ModAmount").getHeapAddress());

    // Web Assembly computation
    this.kernel.process(
      this.outputBuffer.getHeapAddress(),
      channelCount,
      this.parameterBuffers.get("frequency").getHeapAddress()
    );

    // Web Audio rendering
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
