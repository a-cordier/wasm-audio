import { LitElement, html, css, customElement, property } from "lit-element";

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
import "./oscillator-element";
import "./filter-element";
import "./oscillator-envelope-element";
import "./filter-envelope-element";
import "./lfo-element";

import { VoiceManager, createVoiceGenerator } from "../core/voice-manager";
import { MidiLearn } from "../stores/midi-learn";

import { Voice } from "../types/voice";
import { Envelope } from "../types/envelope";
import { OscillatorEvent } from "../types/oscillator-event";
import { OscillatorMode } from "../types/oscillator-mode";
import { FilterMode } from "../types/filter-mode";
import { FilterEvent } from "../types/filter-event";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../types/oscillator-envelope-event";
import { LfoEvent } from "../types/lfo-event";
import { LfoDestination } from "../types/lfo-destination";
import { Lfo } from "./lfo-element";

@customElement("child-element")
export class Root extends LitElement {
  private audioContext: AudioContext;

  @property({ type: AnalyserNode })
  private analyzer: AnalyserNode;

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  private voiceManager: VoiceManager;

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.audioContext = new AudioContext();
    this.analyzer = this.audioContext.createAnalyser();
    this.voiceManager = new VoiceManager(this.audioContext);
    this.voiceManager.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);
    await this.audioContext.audioWorklet.addModule("voice-processor.js");
    this.registerMidiLearners();

    // TODO remove when LFO destination has a UI
    this.voiceManager.toggleLfoDestination({
      value: LfoDestination.OSCILLATOR_MIX,
      isEnabled: true,
    });
  }

  async onKeyOn(event: CustomEvent) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    const { frequency, midiValue, channel } = event.detail;
    this.voiceManager.next({ frequency, midiValue, channel });
  }

  onKeyOff(event: CustomEvent) {
    const { midiValue, channel } = event.detail;
    this.voiceManager.stop({ midiValue, channel });
  }

  notifyMidiLearners(event: CustomEvent) {
    MidiLearn.notifyMidiLearners(event.detail.active);
  }

  registerMidiLearners() {
    MidiLearn.onMidiLearn(
      (shouldLearn) => (this.shouldMidiLearn = shouldLearn)
    );
  }

  onOsc1Change(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEvent.WAVE_FORM:
        this.voiceManager.setOsc1Mode(event.detail.value);
        break;
      case OscillatorEvent.SEMI_SHIFT:
        this.voiceManager.setOsc1SemiShift(event.detail.value);
        break;
      case OscillatorEvent.CENT_SHIFT:
        this.voiceManager.setOsc1CentShift(event.detail.value);
        break;
    }
  }

  onOsc1EnvelopeChange(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEnvelopeEvent.ATTACK:
        this.voiceManager.setOsc1EnvelopeAttack(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.DECAY:
        this.voiceManager.setOsc1EnvelopeDecay(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.SUSTAIN:
        this.voiceManager.setOsc1EnvelopeSustain(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.RELEASE:
        this.voiceManager.setOsc1EnvelopeRelease(event.detail.value);
        break;
    }
  }

  onOscMixChange(event: CustomEvent) {
    this.voiceManager.setOsc2Amplitude(event.detail.value);
  }

  onOsc2Change(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEvent.WAVE_FORM:
        this.voiceManager.setOsc2Mode(event.detail.value);
        break;
      case OscillatorEvent.SEMI_SHIFT:
        this.voiceManager.setOsc2SemiShift(event.detail.value);
        break;
      case OscillatorEvent.CENT_SHIFT:
        this.voiceManager.setOsc2CentShift(event.detail.value);
        break;
    }
  }

  onFilterChange(event: CustomEvent) {
    switch (event.detail.type) {
      case FilterEvent.MODE:
        this.voiceManager.setFilterMode(event.detail.value);
        break;
      case FilterEvent.CUTOFF:
        this.voiceManager.setFilterCutoff(event.detail.value);
        break;
      case FilterEvent.RESONANCE:
        this.voiceManager.setFilterResonance(event.detail.value);
        break;
    }
  }

  onFilterEnvelopeChange(event: CustomEvent) {
    switch (event.detail.type) {
      case FilterEnvelopeEvent.ATTACK:
        this.voiceManager.setCutoffEnvelopeAttack(event.detail.value);
        break;
      case FilterEnvelopeEvent.DECAY:
        this.voiceManager.setCutoffEnvelopeDecay(event.detail.value);
        break;
      case FilterEnvelopeEvent.AMOUNT:
        this.voiceManager.setCutoffEnvelopeAmount(event.detail.value);
        break;
    }
  }

  onLfoChange(event: CustomEvent) {
    switch (event.detail.type) {
      case LfoEvent.WAVE_FORM:
        this.voiceManager.setLfoMode(event.detail.value);
        break;
      case LfoEvent.FREQUENCY:
        this.voiceManager.setLfoFrequency(event.detail.value);
        break;
      case LfoEvent.MOD_AMOUNT:
        this.voiceManager.setLfoModAmount(event.detail.value);
        break;
      case LfoEvent.DESTINATION:
        this.voiceManager.toggleLfoDestination(event.detail);
    }
  }

  render() {
    return html`
      <div class="content">
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="1024"
            height="300"
          ></visualizer-element>
        </div>

        <div class="synth">
          <div class="oscillators">
            <oscillator-element
              label="Osc 1"
              .state=${this.voiceManager.osc1}
              @change=${this.onOsc1Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></oscillator-element>
            <knob-element
              label="Mix"
              .value=${this.voiceManager.osc2Amplitude}
              @change=${this.onOscMixChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></knob-element>
            <oscillator-element
              label="Osc 2"
              .state=${this.voiceManager.osc1}
              @change=${this.onOsc2Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></oscillator-element>
            <filter-element
              .state=${this.voiceManager.filter}
              @change=${this.onFilterChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></filter-element>
          </div>
          <div class="envelopes">
            <oscillator-envelope-element
              label="Amplitude"
              .state=${this.voiceManager.osc1Envelope}
              @change=${this.onOsc1EnvelopeChange}
            ></oscillator-envelope-element>
            <switch-element
              @change="${this.notifyMidiLearners}"
            ></switch-element>
            <lfo-element
              @change=${this.onLfoChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></lfo-element>
            <filter-envelope-element
              .state=${this.voiceManager.cutoffEnvelope}
              @change=${this.onFilterEnvelopeChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></filter-envelope-element>
          </div>

          <div class="sequencer">
            <div class="keys">
              <keys-element
                midiChannel="1"
                @keyOn="${this.onKeyOn},"
                @keyOff=${this.onKeyOff}
              ></keys-element>
            </div>
          </div>
        </div>
      </div>
    `;
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

      .synth {
        margin: 20px auto;
        width: 650px;
      }

      .synth .oscillators {
        display: flex;

        justify-content: space-between;
        align-items: center;
        --knob-size: 60px;
      }

      .synth .envelopes {
        display: flex;
        justify-content: space-between;
        align-items: center;

        margin-top: 1em;
      }

      .sequencer {
        width: 40%;
        margin: 2em auto;
        --key-height: 60px;
      }
    `;
  }
}
