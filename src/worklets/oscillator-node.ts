function createStartMessage(time) {
    return {
        type: 'START_MESSAGE',
        time
    }
}

function createStopMessage(time) {
    return {
        type: 'STOP_MESSAGE',
        time
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
}