
const TWO_PI = 2 * Math.PI;

class OscillatorProcessor extends AudioWorkletProcessor {
    #startTime = -1;
    #stopTime = undefined;
    #phase = 0

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

        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; ++i) {
                outputChannel[i] = Math.sin(this.#phase);
                this.updatePhase(parameters.frequency);
            }
        }
        return true;
    }

    updatePhase(frequency) {
        this.#phase += this.computePhaseIncrement(frequency);
        if (this.#phase > TWO_PI) {
            this.#phase -= TWO_PI;
        }
    }

    computePhaseIncrement(frequency) {
        return frequency * TWO_PI / sampleRate;
    }


}


registerProcessor('oscillator', OscillatorProcessor);