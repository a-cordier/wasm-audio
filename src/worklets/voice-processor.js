import wasm from "./voice-kernel.wasmmodule.js";

import {
  RENDER_QUANTUM_FRAMES, // 128
  MAX_CHANNEL_COUNT, // 32
  HeapAudioBuffer,
  HeapParameterBuffer,
} from "./wasm-audio-helper.js";

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

const parameterDescriptors = [
  {
    name: "frequency",
    defaultValue: 440,
    minValue: 0,
    maxValue: 0.5 * sampleRate,
    automationRate: "a-rate",
  },
  {
    name: "amplitude",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 1,
    automationRate: "a-rate",
  },
  {
    name: "amplitudeAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeSustain",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "amplitudeRelease",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoff",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "resonance",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "cutoffAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoffDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "cutoffEnvelopeAmount",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc1SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc1CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate",
  },
  {
    name: "osc2Amplitude",
    defaultValue: 127 / 2,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo1Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo1ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo2Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
  {
    name: "lfo2ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate",
  },
];

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

  parameterBuffers = new Map();

  // noinspection JSUnresolvedFunction
  kernel = new wasm.VoiceKernel();

  // noinspection JSUnusedGlobalSymbols
  static get parameterDescriptors() {
    return parameterDescriptors;
  }

  constructor() {
    super();
    this.parameterBuffers = createParameterBuffers(parameterDescriptors);
    this.registerPortMessages();
  }

  registerPortMessages() {
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "START":
          return (this.startTime = event.data.time);
        case "STOP":
          return (this.stopTime = event.data.time);
        case "WAVEFORM":
          if (event.data.target === "osc1") {
            const oscillatorMode = waveforms[event.data.waveform];
            return this.kernel.setOsc1Mode(oscillatorMode);
          }
          if (event.data.target === "osc2") {
            const oscillatorMode = waveforms[event.data.waveform];
            return this.kernel.setOsc2Mode(oscillatorMode);
          }
          if (event.data.target === "lfo1") {
            const oscillatorMode = waveforms[event.data.waveform];
            return this.kernel.setLfo1Mode(oscillatorMode);
          }
          if (event.data.target === "lfo2") {
            const oscillatorMode = waveforms[event.data.waveform];
            return this.kernel.setLfo2Mode(oscillatorMode);
          }
        case "FILTER_MODE":
          const filterMode = FilterMode[event.data.mode];
          return this.kernel.setFilterMode(filterMode);
        case "LFO_DESTINATION":
          if (event.data.target === "lfo1") {
            const lfoDestination = LfoDestination[event.data.destination];
            return this.kernel.setLfo1Destination(lfoDestination);
          }
          if (event.data.target === "lfo2") {
            const lfoDestination = LfoDestination[event.data.destination];
            return this.kernel.setLfo2Destination(lfoDestination);
          }
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (this.startTime > currentTime) {
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
      output[channel].set(this.outputBuffer.getChannelData(channel)); // wasm to audio thread copy
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
    this.parameterBuffers.forEach((buffer) => {
      buffer.free();
    });
    this.outputBuffer.free();
  }
}

// noinspection JSUnresolvedFunction
registerProcessor("voice", VoiceProcessor);
