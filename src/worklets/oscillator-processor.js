import wasm from './oscillator-kernel.wasmmodule.js';

import {
    RENDER_QUANTUM_FRAMES, // 128
    MAX_CHANNEL_COUNT, // 32
    HeapAudioBuffer,
    HeapParameterBuffer
} from './wasm-audio-helper.js';

const waveforms = Object.freeze({
    "sine": wasm.WaveForm.SINE,
    "sawtooth": wasm.WaveForm.SAW,
    "square": wasm.WaveForm.SQUARE
});

const OscillatorState = Object.freeze({
    STOPPING: "STOPPING",
    STOPPED: "STOPPED"
});

class OscillatorProcessor extends AudioWorkletProcessor {
    #startTime = -1;
    #stopTime = undefined;

    #outputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);
    #frequencyBuffer = new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES);

    // noinspection JSUnresolvedFunction
    #kernel = new wasm.OscillatorKernel();

    // noinspection JSUnusedGlobalSymbols
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
            },
            {
                name: 'attack',
                defaultValue: 1,
                minValue: 0,
                maxValue: 127,
                automationRate: "a-rate"
            },
            {
                name: 'decay',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: "a-rate"
            },
            {
                name: 'sustain',
                defaultValue: 0.5,
                minValue: 0,
                maxValue: 1,
                automationRate: "a-rate"
            },
            {
                name: 'release',
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

        if (this.#kernel.isStopped()) {
            this.#kernel.reset();
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

        this.#kernel.process(outputPtr, channelCount, frequencyPtr);

        for (let channel = 0; channel < channelCount; ++channel) {
            output[channel].set(this.#outputBuffer.getChannelData(channel)); // wasm to audio thread copy
        }

        return true;
    }
}


// noinspection JSUnresolvedFunction
registerProcessor('oscillator', OscillatorProcessor);