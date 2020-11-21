import {
  RENDER_QUANTUM_FRAMES, // 128
  MAX_CHANNEL_COUNT, // 32
  HeapAudioBuffer,
  HeapParameterBuffer,
} from "./wasm-audio-helper.js";

import createModule from "./voice-kernel.wasmmodule.js";
import parameterDescriptors from "./voice-processor-parameters.js";

createModule().then(wasm => {
  const waveforms = Object.freeze({
    sine: wasm.WaveForm.SINE,
    sawtooth: wasm.WaveForm.SAW,
    square: wasm.WaveForm.SQUARE,
    triangle: wasm.WaveForm.TRIANGLE,
  });

  const FilterMode = Object.freeze({
    LOWPASS: wasm.FilterMode.LOWPASS,
    LOWPASS_PLUS: wasm.FilterMode.LOWPASS_PLUS,
    BANDPASS: wasm.FilterMode.BANDPASS,
    HIGHPASS: wasm.FilterMode.HIGHPASS,
  });

  const LfoDestination = Object.freeze({
    FREQUENCY: wasm.LfoDestination.FREQUENCY,
    OSCILLATOR_MIX: wasm.LfoDestination.OSCILLATOR_MIX,
    CUTOFF: wasm.LfoDestination.CUTOFF,
    RESONANCE: wasm.LfoDestination.RESONANCE,
    INVERSED_RESONANCE: wasm.LfoDestination.INVERSED_RESONANCE,
  });

  function createParameterBuffers(parameterDescriptors = []) {
    return new Map(parameterDescriptors.map(toParameterBufferEntry))
  }  
  
  function toParameterBufferEntry(descriptor) {
    return [
      descriptor.name, 
      new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES)
    ];
  }

  class VoiceProcessor extends AudioWorkletProcessor {
    startTime = -1;
    stopTime = undefined;
  
    outputBuffer = new HeapAudioBuffer(
      wasm,
      RENDER_QUANTUM_FRAMES,
      2,
      MAX_CHANNEL_COUNT
    );
  
    parameterBuffers = createParameterBuffers(parameterDescriptors);
  
    // noinspection JSUnresolvedFunction
    kernel = new wasm.VoiceKernel(sampleRate);
  
    // noinspection JSUnusedGlobalSymbols
    static get parameterDescriptors() {
      return parameterDescriptors;
    }
  
    constructor() {
      super();
      this.registerPortMessages();
    }
  
    registerPortMessages() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case "START":
            this.startTime = event.data.time; return;
          case "STOP":
            this.stopTime = event.data.time;  return;
          case "WAVEFORM":
            if (event.data.target === "osc1") return this.kernel.setOsc1Mode(waveforms[event.data.waveform]);
            if (event.data.target === "osc2") return this.kernel.setOsc2Mode(waveforms[event.data.waveform]);
            if (event.data.target === "lfo1") return this.kernel.setLfo1Mode(waveforms[event.data.waveform]);
            if (event.data.target === "lfo2") return this.kernel.setLfo2Mode(waveforms[event.data.waveform]);
          case "FILTER_MODE":
            return this.kernel.setFilterMode(FilterMode[event.data.mode]);
          case "LFO_DESTINATION":
            if (event.data.target === "lfo1") return this.kernel.setLfo1Destination(LfoDestination[event.data.destination]);
            if (event.data.target === "lfo2") return this.kernel.setLfo2Destination(LfoDestination[event.data.destination]);s
        }
      };
    }
  
    process(inputs, outputs, parameters) {
      if (this.startTime >= currentTime) {
        return true;
      }
  
      if (this.kernel.isStopped()) {
        this.freeBuffers();
        return false;
      }
  
      if (this.stopTime && this.stopTime <= currentTime) {
        this.kernel.enterReleaseStage();
      }
  
      const output = outputs[0];
      const channelCount = output.length;
  
      this.allocateBuffers(channelCount, parameters);  
  
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
  
      this.kernel.process(this.outputBuffer.getHeapAddress(), channelCount, this.parameterBuffers.get("frequency").getHeapAddress());
  
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
});

