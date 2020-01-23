import wasm from './oscillator-kernel.wasmmodule.js';

import {
    RENDER_QUANTUM_FRAMES, // 128
    MAX_CHANNEL_COUNT, // 32
    HeapAudioBuffer
} from './wasm-audio-helper.js';

class OscillatorProcessor extends AudioWorkletProcessor {
    #startTime = -1;
    #stopTime = undefined;
    #heapOutputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);
    #kernel = new wasm.OscillatorKernel();

    static get parameterDescriptors() {
        return [
            {
                name: 'frequency',
                defaultValue: 440,
                minValue: 0,
                maxValue: 0.5 * sampleRate,
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
                case "START_MESSAGE": return this.#startTime = event.data.time;
                case "STOP_MESSAGE": return this.#stopTime = event.data.time;
            }
        }
    }


    process(inputs, outputs, parameters) {
        if (this.#startTime > currentTime) {
            return true;
        }

        if (this.#stopTime && this.#stopTime <= currentTime) {
            this.port.postMessage('STOP');
            this.#stopTime = undefined;
            return true;
        }

        let output = outputs[0];

        let channelCount = output.length;

        this.#heapOutputBuffer.adaptChannel(channelCount);

        const frequencyValues = parameters.frequency;
        const frequency = frequencyValues[0];

        // No input = no copy from audio thread to wasm but if we were building an effect, there would be one!

        this.#kernel.process(this.#heapOutputBuffer.getHeapAddress(), channelCount, frequency, currentTime);

        for (let channel = 0; channel < channelCount; ++channel) {
            output[channel].set(this.#heapOutputBuffer.getChannelData(channel)); // wasm to audio thread copy
        }

        return true;
    }
}


registerProcessor('oscillator', OscillatorProcessor);