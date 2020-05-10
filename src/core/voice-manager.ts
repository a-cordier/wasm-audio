import { WasmVoiceNode } from "../worklets/voice-node";

export function* createVoiceGenerator(audioContext: AudioContext, maxVoiceCount = 4096) {
    for (; ;) {
        yield new WasmVoiceNode(audioContext);
    }
}

export function* createNativeVoiceGenerator(audioContext: AudioContext) {
    for (; ;) {
        yield Object.assign(new OscillatorNode(audioContext), { type: 'triangle' })
    }
}

export class VoiceManager {
    private voiceGenerator;

    constructor(audioContext: AudioContext, createVoiceGenerator: Function) {
        this.voiceGenerator = createVoiceGenerator(audioContext);
    }

    next({ frequency, type }): WasmVoiceNode {
        const osc = this.voiceGenerator.next().value;
        osc.frequency.value = frequency;
        osc.wave = type;
        return osc;
    }
}