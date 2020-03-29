import { LitElement, html, css, customElement, property } from 'lit-element'

import './keys-element';
import './visualizer-element';
import './knob-element';
import './fader-element';

import { VoiceManager, createNativeVoiceGenerator, createVoiceGenerator } from "../core/voice-manager";

@customElement('child-element')
export class Root extends LitElement {
    private audioContext: AudioContext;

    @property({ type: AudioParam })
    private freq: Partial<AudioParam> = { value: 440 };

    @property({ type: GainNode })
    private gain: GainNode;

    @property({ type: AnalyserNode })
    private analyzer: AnalyserNode;

    private voiceManager: VoiceManager;

    private channel_1 = new Map();
    private channel_2 = new Map();

    private channels = Array.from({ length: 16 }).map(() => new Map())

    @property({ type: Set })
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
        console.log(value);

    }

    render() {
        return html`  
            <div class="content">
                <div class="visualizer">
                    <visualizer-element .analyser=${this.analyzer}></visualizer-element>
                </div> 

                <div class="control-panel">
                    <knob-element @change="${this.onAttackChange}"></knob-element>
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
                width: 1024px;
                margin: auto;
            }

            .control-panel knob-element {
                --knob-size: 50px;
            }

            .fader-group {
                margin-top: 5em;
                
                width: 160px;
                
                display: flex;
                justify-content: space-evenly;
                --fader-height: 150px;
            }

            .keys {
                width: 100%;
                --key-height: 100px;

            }

        `
    }

}