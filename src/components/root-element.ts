import {LitElement, html, css, customElement, property} from 'lit-element'

import './keys-element';
import './visualizer-element';

import {VoiceManager, createNativeVoiceGenerator, createVoiceGenerator} from "../core/voice-manager";

@customElement('child-element')
export class Root extends LitElement {
    private audioContext: AudioContext;

    @property({type: AudioParam})
    private freq: Partial<AudioParam> = { value: 440 };

    @property({type: GainNode})
    private gain: GainNode;

    @property({type: AnalyserNode})
    private analyzer: AnalyserNode;

    private voiceManager: VoiceManager;

    private channel_1 = new Map();
    private channel_2 = new Map();

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
        this.voiceManager = new VoiceManager(this.audioContext, createVoiceGenerator);

        await this.audioContext.audioWorklet.addModule('oscillator-processor.js');
    }

    async onKeyOn_ch1(event: CustomEvent) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const { frequency, midiValue } = event.detail;

        if (this.channel_1.has(midiValue)) {
            return; // avoid playing the same note twice (the note would hang forever)
        }

        const osc = this.voiceManager.next({ type: "sine", frequency});
        this.gain.gain.value = this.channel_1.size > 1 ? 0.75 / this.channel_1.size : 0.5;
        osc.connect(this.gain);
        osc.start();
        this.channel_1.set(midiValue, osc);
    }

    onKeyOff_ch1(event: CustomEvent) {
        const midiValue = event.detail.midiValue;

        if (this.channel_1.has(midiValue)) {
            this.channel_1.get(midiValue).stop();
            this.channel_1.delete(midiValue);
        }
    }

    async onKeyOn_ch2(event: CustomEvent) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const { frequency, midiValue } = event.detail;

        if (this.channel_2.has(midiValue)) {
            return; // avoid playing the same note twice (the note would hang forever)
        }

        const osc = this.voiceManager.next({ type: "square", frequency});

        this.gain.gain.value = this.channel_2.size > 1 ? 0.75 / this.channel_2.size : 0.5;

        osc.connect(this.gain);
        osc.start();
        this.channel_2.set(midiValue, osc);
    }

    onKeyOff_ch2(event: CustomEvent) {
        const midiValue = event.detail.midiValue;

        if (this.channel_2.has(midiValue)) {
            this.channel_2.get(midiValue).stop();
            this.channel_2.delete(midiValue);
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
                        midiChannel="1"
                        @keyOn=${this.onKeyOn_ch1 }, 
                        @keyOff=${this.onKeyOff_ch1}></keys-element>
                        
                    <keys-element 
                        midiChannel="2"
                        @keyOn=${this.onKeyOn_ch2}, 
                        @keyOff=${this.onKeyOff_ch2}></keys-element>    
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
                --key-height: 100px;

            }

        `
    }

}