import {LitElement, html, css, customElement, property} from 'lit-element'

import './keys-element';
import './visualizer-element';

import {VoiceManager, createNativeVoiceGenerator, createVoiceGenerator} from "../core/voice-manager";

@customElement('child-element')
export class Child extends LitElement {
    private audioContext: AudioContext;

    @property({type: AudioParam})
    private freq: Partial<AudioParam> = { value: 440 };

    @property({type: GainNode})
    private gain: GainNode;

    @property({type: AnalyserNode})
    private analyzer: AnalyserNode;

    private voiceManager: VoiceManager;

    private oscs = new Map();

    @property({type: Set})
    private pressedKeys = new Set();

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

        await this.audioContext.audioWorklet.addModule('oscillator-processor.js');
        this.voiceManager = new VoiceManager(this.audioContext, createVoiceGenerator);
    }

    async onKeyOn(event: CustomEvent) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const osc = this.voiceManager.next();
        this.gain.gain.value = this.oscs.size > 1 ? 0.75 / this.oscs.size : 0.5;
        osc.frequency.value = event.detail.frequency;
        osc.connect(this.gain);
        osc.start();
        this.oscs.set(event.detail.midiValue, osc);
    }

    onKeyOff(event: CustomEvent) {
        const midiValue = event.detail.midiValue;

        if (this.oscs.has(midiValue)) {
            this.oscs.get(midiValue).stop();
            this.oscs.get(midiValue).disconnect();
            this.oscs.delete(midiValue);
        }
    }

    render() {
        return html`  
            <div class="content">
                <div class="visualizer">
                    <visualizer-element .analyser=${this.analyzer}></visualizer-element>
                </div>
                
                <div class="keys">
                    <keys-element 
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
                width: 1024px;
                margin: auto;
            }

            .keys {
                width: 100%;
                --key-height: 200px;

            }

        `
    }

}