import {WasmOscillatorNode} from "../worklets/oscillator-node";

export function *createVoiceGenerator(audioContext: AudioContext, maxVoiceCount = 16) {
    const voices = Array.from({ length: maxVoiceCount }, () => new WasmOscillatorNode(audioContext));

    for (let i = 0;;++i) {
        yield voices[i % maxVoiceCount];
    }
}

export function *createNativeVoiceGenerator(audioContext: AudioContext) {
    for (;;) {
        yield Object.assign(new OscillatorNode(audioContext), { type: 'triangle' })
    }
}

export class VoiceManager {
    private voiceGenerator;

    constructor(audioContext: AudioContext, createVoiceGenerator: Function) {
        this.voiceGenerator = createVoiceGenerator(audioContext);
    }

    next(): WasmOscillatorNode {
        return this.voiceGenerator.next().value;
    }
}