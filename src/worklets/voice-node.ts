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

export class WasmVoiceNode extends AudioWorkletNode {

    private params: Map<string, AudioParam>;

    constructor(audioContext: AudioContext) {
        super(audioContext, 'voice');
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

    get amplitudeAttack() {
        return this.params.get('amplitudeAttack');
    }

    get amplitudeDecay() {
        return this.params.get('amplitudeDecay');
    }

    get amplitudeSustain() {
        return this.params.get('amplitudeSustain');
    }

    get amplitudeRelease() {
        return this.params.get('amplitudeRelease');
    }

    get cutoff() {
        return this.params.get('cutoff');
    }

    get resonance() {
        return this.params.get('resonance');
    }

    get cutoffEnvelopeAmount() {
        return this.params.get('cutoffEnvelopeAmount');
    }

    get cutoffAttack() {
        return this.params.get('cutoffAttack');
    }

    get cutoffDecay() {
        return this.params.get('cutoffDecay');
    }

    set wave(type: string) {
        this.port.postMessage(createWaveformMessage(type));
    }
}