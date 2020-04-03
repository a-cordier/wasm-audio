export interface Oscillator {
    frequency: AudioParam;
    attack: AudioParam;
    decay: AudioParam;
    sustain: AudioParam;
    release: AudioParam;
    start(time?: number): void;
    stop(time?: number): void;
}