import wasm from "./voice-kernel.wasmmodule.js";

import {
  RENDER_QUANTUM_FRAMES, // 128
  MAX_CHANNEL_COUNT, // 32
  HeapAudioBuffer,
  HeapParameterBuffer,
} from "./wasm-audio-helper.js";
import Module from "./voice-kernel.wasmmodule.js";

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

class VoiceProcessor extends AudioWorkletProcessor {
  #startTime = -1;
  #stopTime = undefined;

  #outputBuffer = new HeapAudioBuffer(
    wasm,
    RENDER_QUANTUM_FRAMES,
    2,
    MAX_CHANNEL_COUNT
  );
  #frequencyBuffer = new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES);

  // noinspection JSUnresolvedFunction
  #kernel = new wasm.VoiceKernel();

  // noinspection JSUnusedGlobalSymbols
  static get parameterDescriptors() {
    return [
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
        automationRate: "k-rate",
      },
      {
        name: "resonance",
        defaultValue: 0,
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate",
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
        minValue: -24,
        maxValue: 24,
        automationRate: "k-rate",
      },
      {
        name: "osc1CentShift",
        defaultValue: 0,
        minValue: -50,
        maxValue: 50,
        automationRate: "k-rate",
      },
      {
        name: "osc2SemiShift",
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
        automationRate: "k-rate",
      },
      {
        name: "osc2CentShift",
        defaultValue: 0,
        minValue: -50,
        maxValue: 50,
        automationRate: "k-rate",
      },
      {
        name: "osc2Amplitude",
        defaultValue: 127 / 2,
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate",
      },
    ];
  }

  constructor() {
    super();
    this.registerPortMessages();
  }

  registerPortMessages() {
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "START":
          return (this.#startTime = event.data.time);
        case "STOP":
          return (this.#stopTime = event.data.time);
        case "WAVEFORM":
          if (event.data.destination === "osc1") {
            const oscillatorMode = waveforms[event.data.waveform];
            return this.#kernel.setOsc1Mode(oscillatorMode);
          }
          const oscillatorMode = waveforms[event.data.waveform];
          return this.#kernel.setOsc2Mode(oscillatorMode);
        case "FILTER_MODE":
          const filterMode = FilterMode[event.data.mode];
          return this.#kernel.setFilterMode(filterMode);
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (this.#startTime > currentTime) {
      return true;
    }

    if (this.#kernel.isStopped()) {
      this.#outputBuffer.free();
      this.#frequencyBuffer.free();
      return false;
    }

    if (this.#stopTime && this.#stopTime <= currentTime) {
      this.#kernel.enterReleaseStage();
    }

    let output = outputs[0];

    let channelCount = output.length;

    this.#outputBuffer.adaptChannel(channelCount);
    this.#frequencyBuffer.getData().set(parameters.frequency);

    const [outputPtr, frequencyPtr] = [
      this.#outputBuffer.getHeapAddress(),
      this.#frequencyBuffer.getHeapAddress(),
    ];

    // Amplitude envelope parameters
    this.#kernel.setAmplitudeAttack(Number(parameters.amplitudeAttack));
    this.#kernel.setAmplitudeDecay(Number(parameters.amplitudeDecay));
    this.#kernel.setAmplitudeSustain(Number(parameters.amplitudeSustain));
    this.#kernel.setAmplitudeRelease(Number(parameters.amplitudeRelease));
    this.#kernel.setOsc1SemiShift(Number(parameters.osc1SemiShift));
    this.#kernel.setOsc1CentShift(Number(parameters.osc1CentShift));
    this.#kernel.setOsc2SemiShift(Number(parameters.osc2SemiShift));
    this.#kernel.setOsc2CentShift(Number(parameters.osc2CentShift));
    this.#kernel.setOsc2Amplitude(Number(parameters.osc2Amplitude));

    // Filter parameters
    this.#kernel.setCutoff(Number(parameters.cutoff));
    this.#kernel.setResonance(Number(parameters.resonance));
    this.#kernel.setCutoffEnvelopeAmount(
      Number(parameters.cutoffEnvelopeAmount)
    );
    this.#kernel.setCutoffEnvelopeAttack(Number(parameters.cutoffAttack));
    this.#kernel.setCutoffEnvelopeDecay(Number(parameters.cutoffDecay));

    this.#kernel.process(outputPtr, channelCount, frequencyPtr);

    for (let channel = 0; channel < channelCount; ++channel) {
      output[channel].set(this.#outputBuffer.getChannelData(channel)); // wasm to audio thread copy
    }

    return true;
  }
}

// noinspection JSUnresolvedFunction
registerProcessor("voice", VoiceProcessor);
