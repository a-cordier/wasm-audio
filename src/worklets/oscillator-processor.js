import wasm from './oscillator-kernel.wasmmodule.js';

import {
    RENDER_QUANTUM_FRAMES, // 128
    MAX_CHANNEL_COUNT, // 32
    HeapAudioBuffer,
    HeapParameterBuffer
} from './wasm-audio-helper.js';

const waveforms = Object.freeze({
    "sine": wasm.mode.SINE,
    "saw": wasm.mode.SAW,
    "triangle": wasm.mode.TRIANGLE,
    "square": wasm.mode.SQUARE
});

class OscillatorProcessor extends AudioWorkletProcessor {
    #startTime = -1;
    #stopTime = undefined;
    #outputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);
    #frequencyBuffer = new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES);
    #amplitudeBuffer = new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES);

    #kernel = new wasm.OscillatorKernel();

    static get parameterDescriptors() {
        return [
            {
                name: 'frequency',
                defaultValue: 440,
                minValue: 0,
                maxValue: 0.5 * sampleRate,
                automationRate: "a-rate"
            },
            {
                name: 'amplitude',
                defaultValue: 0.5,
                minValue: 0,
                maxValue: 1,
                automationRate: "a-rate"
            }
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
                    return this.#startTime = event.data.time;
                case "STOP":
                    return this.#stopTime = event.data.time;
                case "WAVEFORM":
                    return this.#kernel.setMode(waveforms[event.data.waveform]);
            }
        }
    }


    process(inputs, outputs, parameters) {
        if (this.#startTime > currentTime) {
            return true;
        }

        if (this.#stopTime && this.#stopTime <= currentTime) {
            this.port.postMessage('STOP');
            return false;
        }

        let output = outputs[0];

        let channelCount = output.length;

        this.#outputBuffer.adaptChannel(channelCount);
        this.#frequencyBuffer.getData().set(parameters.frequency);
        this.#amplitudeBuffer.getData().set(parameters.amplitude);

        const [outputPtr, frequencyPtr, amplitudePtr] = [
            this.#outputBuffer.getHeapAddress(),
            this.#frequencyBuffer.getHeapAddress(),
            this.#amplitudeBuffer.getHeapAddress()
        ];

        this.#kernel.process(outputPtr, channelCount, frequencyPtr, amplitudePtr);

        for (let channel = 0; channel < channelCount; ++channel) {
            output[channel].set(this.#outputBuffer.getChannelData(channel)); // wasm to audio thread copy
        }

        return true;
    }
}


registerProcessor('oscillator', OscillatorProcessor);