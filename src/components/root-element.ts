import { LitElement, html, css, customElement, property } from 'lit-element'

import './keys-element';
import './visualizer-element';
import './knob-element';
import './switch-element';

import { VoiceManager, createNativeVoiceGenerator, createVoiceGenerator } from "../core/voice-manager";
import { MidiLearn } from "../stores/midi-learn";

import { Oscillator } from "../types/oscillator";

@customElement('child-element')
export class Root extends LitElement {
    private audioContext: AudioContext;

    @property({ type: AudioParam })
    private freq: Partial<AudioParam> = { value: 440 };

    @property({ type: GainNode })
    private gain: GainNode;

    @property({ type: AnalyserNode })
    private analyzer: AnalyserNode;

    @property({ type: Boolean })
    private shouldMidiLearn = false;

    private voiceManager: VoiceManager;

    private channels: Map<number, Oscillator>[] = Array.from({ length: 16 }).map(() => new Map<number, Oscillator>())

    private attack = 0;
    private decay = 0;
    private sustain = 0;
    private release = 1;

    constructor() {
        super();
    }

    async connectedCallback() {
        super.connectedCallback();

        this.audioContext = new AudioContext();
        this.gain = this.audioContext.createGain(); // first output in chain
        this.analyzer = this.audioContext.createAnalyser();
        this.gain.connect(this.analyzer);
        this.analyzer.connect(this.audioContext.destination);
        this.voiceManager = new VoiceManager(this.audioContext, createVoiceGenerator);

        await this.audioContext.audioWorklet.addModule('oscillator-processor.js');

        this.registerMidiLearners();
    }

    async onKeyOn(event: CustomEvent) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const { frequency, midiValue, channel } = event.detail;

        const notes = this.channels[channel - 1];

        if (notes.has(midiValue)) {
            return; // avoid playing the same note twice (the note would hang forever)
        }

        const osc = this.voiceManager.next({ type: "sawtooth", frequency });
        this.gain.gain.value = notes.size > 1 ? 0.75 / notes.size : 0.5;

        osc.attack.value = this.attack;     // A
        osc.decay.value = this.decay;       // D
        osc.sustain.value = this.sustain;   // S
        osc.release.value = this.release;   // R

        osc.connect(this.gain);
        osc.start();
        notes.set(midiValue, osc);
    }

    onKeyOff(event: CustomEvent) {
        const { midiValue, channel } = event.detail;

        const notes = this.channels[channel - 1];
        if (notes.has(midiValue)) {
            notes.get(midiValue).stop();
            notes.delete(midiValue);
        }
    }

    onAttackChange(event: CustomEvent) {
        const { value } = event.detail;
        this.attack = value;
    }

    onDecayChange(event: CustomEvent) {
        const { value } = event.detail;
        this.decay = value;
    }

    onSustainChange(event: CustomEvent) {
        const { value } = event.detail;
        this.sustain = value;
    }

    onReleaseChange(event: CustomEvent) {
        const { value } = event.detail;
        this.release = value;
    }

    notifyMidiLearners(event: CustomEvent) {
        MidiLearn.notifyMidiLearners(event.detail.active);
    }

    registerMidiLearners() {
        MidiLearn.onMidiLearn((shouldLearn) => this.shouldMidiLearn = shouldLearn);
    }

    render() {
        return html`  
            <div class="content">
                <div class="visualizer">
                    <visualizer-element .analyser=${this.analyzer} width="1024" height="300"></visualizer-element>
                </div> 

                <div class="menu">
                    <switch-element @change="${this.notifyMidiLearners}"></switch-element>
                </div>

                <div class="control-panel">
                    <knob-element @change="${this.onAttackChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.attack}"></knob-element>
                    <knob-element @change="${this.onDecayChange}" .shouldMidiLearn="${this.shouldMidiLearn}"></knob-element>
                    <knob-element @change="${this.onSustainChange}" .shouldMidiLearn="${this.shouldMidiLearn}"></knob-element>
                    <knob-element @change="${this.onReleaseChange}" .shouldMidiLearn="${this.shouldMidiLearn}"></knob-element>
                </div>
                
                <div class="keys">
                    <keys-element 
                        midiChannel="1"
                        @keyOn=${this.onKeyOn}, 
                        @keyOff=${this.onKeyOff}></keys-element>
                        
                    <keys-element 
                        midiChannel="2"
                        @keyOn=${this.onKeyOn}, 
                        @keyOff=${this.onKeyOff}></keys-element>    
                </div>
            </div>          

        `
    }

    static get styles() {
        return css`
            .content {
                width: 85%;
                margin: auto;
                display: flex;
                flex-direction: column;
            }

            .visualizer {
                margin: auto;
            }

            .menu {
                margin: 10px 0;
            }

            .control-panel {
                margin: 20px 0;
                display: flex;
                width: 300px;
                justify-content: space-evenly;
            }

            .control-panel knob-element {
                --knob-size: 60px;
                        
            }

            .keys {

                width: 100%;
                --key-height: 100px;
            }

        `
    }

}