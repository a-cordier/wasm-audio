function createStartMessage(time) {
    return {
        type: 'START',
        time
    }
}

function createStopMessage(time) {
    return {
        type: 'STOP',
        time
    }
}

function createWaveformMessage(waveform) {
    return {
        type: 'WAVEFORM',
        waveform
    }
}

export class WasmOscillatorNode extends AudioWorkletNode {

    private params: Map<string, AudioParam>;

    constructor(audioContext: AudioContext) {
        super(audioContext, 'oscillator');
        this.params = this.parameters as Map<string, AudioParam>;
    }

    start(time = this.context.currentTime) {
        this.port.postMessage(createStartMessage(time));
    }

    stop(time = this.context.currentTime) {
        this.port.postMessage(createStopMessage(time));
    }

    get frequency() {
        return this.params.get('frequency');
    }

    get amplitude() {
        return this.params.get('amplitude');
    }

    set wave(type: string) {
        this.port.postMessage(createWaveformMessage(type));
    }
}