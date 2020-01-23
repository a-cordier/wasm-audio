import { LitElement, html, css, customElement, property } from 'lit-element'

import "./keys-element";
import "./visualizer-element";
import "./knob-element";
import "./switch-element";
import "./button-element";
import "./sawtooth-wave-icon";
import "./square-wave-icon";
import "./sine-wave-icon";
import "./triangle-wave-icon";
import "./wave-selector-element";

import { VoiceManager, createNativeVoiceGenerator, createVoiceGenerator } from "../core/voice-manager";
import { MidiLearn } from "../stores/midi-learn";

import { Voice } from "../types/voice";
import { Envelope } from "../types/envelope";

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

    private waveForm = "square";

    private voiceManager: VoiceManager;

    private channels: Map<number, Voice>[] = Array.from({ length: 16 }).map(() => new Map<number, Voice>())

    private amplitudeEnvelope = { attack: 1, decay: 33, sustain: 70, release: 33 };

    private cutoff = 127;
    private resonance = 0;
    private cutoffEnvelope = { attack: 1, decay: 25, amount: 0 };

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

        await this.audioContext.audioWorklet.addModule('voice-processor.js');

        this.gain.gain.value = 0.5;

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

        const voice = this.voiceManager.next({ type: this.waveForm, frequency });

        voice.amplitudeAttack.value = this.amplitudeEnvelope.attack;
        voice.amplitudeDecay.value = this.amplitudeEnvelope.decay;
        voice.amplitudeSustain.value = this.amplitudeEnvelope.sustain;
        voice.amplitudeRelease.value = this.amplitudeEnvelope.release;
        voice.cutoff.value = this.cutoff;
        voice.resonance.value = this.resonance;
        voice.cutoffAttack.value = this.cutoffEnvelope.attack;
        voice.cutoffDecay.value = this.cutoffEnvelope.decay;
        voice.cutoffEnvelopeAmount.value = this.cutoffEnvelope.amount;

        voice.connect(this.gain);
        voice.start();
        notes.set(midiValue, voice);
    }

    onKeyOff(event: CustomEvent) {
        const { midiValue, channel } = event.detail;

        const notes = this.channels[channel - 1];
        if (notes.has(midiValue)) {
            notes.get(midiValue).stop();
            notes.delete(midiValue);
        }
    }

    onAmplitudeAttackChange(event: CustomEvent) {
        const { value } = event.detail;
        this.amplitudeEnvelope.attack = value;
    }

    onAmplitudeDecayChange(event: CustomEvent) {
        const { value } = event.detail;
        this.amplitudeEnvelope.decay = value;
    }

    onAmplitudeSustainChange(event: CustomEvent) {
        const { value } = event.detail;
        this.amplitudeEnvelope.sustain = value;
    }

    onAmplitudeReleaseChange(event: CustomEvent) {
        const { value } = event.detail;
        this.amplitudeEnvelope.release = value;
    }

    onCutoffChange(event: CustomEvent) {
        const { value } = event.detail;
        this.cutoff = value;
    }

    onResonanceChange(event: CustomEvent) {
        const { value } = event.detail;
        this.resonance = value;
    }

    onCutoffAttackChange(event: CustomEvent) {
        const { value } = event.detail;
        this.cutoffEnvelope.attack = value;
    }

    onCutoffDecayChange(event: CustomEvent) {
        const { value } = event.detail;
        this.cutoffEnvelope.decay = value;
    }

    onCutoffEnvelopeAmountChange(event: CustomEvent) {
        const { value } = event.detail;
        this.cutoffEnvelope.amount = value;
    }

    notifyMidiLearners(event: CustomEvent) {
        MidiLearn.notifyMidiLearners(event.detail.active);
    }

    registerMidiLearners() {
        MidiLearn.onMidiLearn((shouldLearn) => this.shouldMidiLearn = shouldLearn);
    }

    onWaveFormChange(event: CustomEvent) {
        this.waveForm = event.detail.value;
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
                    <knob-element label="attack" @change="${this.onAmplitudeAttackChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.amplitudeEnvelope.attack}"></knob-element>
                    <knob-element label="decay" @change="${this.onAmplitudeDecayChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.amplitudeEnvelope.decay}"></knob-element>
                    <knob-element label="sustain" @change="${this.onAmplitudeSustainChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.amplitudeEnvelope.sustain}"></knob-element>
                    <knob-element label="release" @change="${this.onAmplitudeReleaseChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.amplitudeEnvelope.release}"></knob-element>
                    <knob-element label="cutoff" @change="${this.onCutoffChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.cutoff}"></knob-element>
                    <knob-element label="resonance" @change="${this.onResonanceChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.resonance}"></knob-element>
                    <knob-element label="envelope" @change="${this.onCutoffEnvelopeAmountChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.cutoffEnvelope.amount}"></knob-element>
                    <knob-element label="attack" @change="${this.onCutoffAttackChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.cutoffEnvelope.attack}"></knob-element>
                    <knob-element label="decay" @change="${this.onCutoffDecayChange}" .shouldMidiLearn="${this.shouldMidiLearn}" .value="${this.cutoffEnvelope.decay}"></knob-element>
                </div>


                <div class="sequencer">
                    <div class="keys">
                        <keys-element 
                            midiChannel="1"
                            @keyOn=${this.onKeyOn}, 
                            @keyOff=${this.onKeyOff}></keys-element>
                    </div>
                      
                    <wave-selector-element .wave="${this.waveForm}" @change=${this.onWaveFormChange}></wave-selector-element>
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
                width: 100%;
                justify-content: space-evenly;
            }

            .control-panel knob-element {
                --knob-size: 50px;
                        
            }

            .sequencer {
                display: flex;
            }

            .sequencer .keys {
                width: 30%;
                --key-height: 100px;
            }

            .sequencer .octave, .sequencer .step {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
            }

            .sequencer label {
                color: var(--lighter-color);
            }

        `
    }

}