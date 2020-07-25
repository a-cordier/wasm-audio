import { LitElement, html, css, customElement, property } from "lit-element";

import "./keys-element";
import "./visualizer-element";
import "./knob-element";
import "./switch-element";
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
import "./panel-wrapper-element";

import { VoiceManager } from "../core/voice-manager";
import { GlobalDispatcher, DispatcherEvent } from "../core/dispatcher";

import { OscillatorEvent } from "../types/oscillator-event";
import { FilterEvent } from "../types/filter-event";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../types/oscillator-envelope-event";
import { LfoEvent } from "../types/lfo-event";

@customElement("child-element")
export class Root extends LitElement {
  private audioContext: AudioContext;

  @property({ type: Object })
  private analyzer: AnalyserNode;

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  private voiceManager: VoiceManager;

  async connectedCallback() {
    super.connectedCallback();
    this.audioContext = new AudioContext();
    this.analyzer = this.audioContext.createAnalyser();
    this.voiceManager = new VoiceManager(this.audioContext);
    this.voiceManager.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);
    await this.audioContext.audioWorklet.addModule("voice-processor.js");
    this.registerMidiLearners();
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
    GlobalDispatcher.dispatch(DispatcherEvent.SHOULD_MIDI_LEARN, event.detail);
  }

  registerMidiLearners() {
    GlobalDispatcher.subscribe(DispatcherEvent.SHOULD_MIDI_LEARN, (event) => {
      this.shouldMidiLearn = event.detail.value;
    });
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

  onLfo1Change(event: CustomEvent) {
    switch (event.detail.type) {
      case LfoEvent.WAVE_FORM:
        this.voiceManager.setLfo1Mode(event.detail.value);
        break;
      case LfoEvent.FREQUENCY:
        this.voiceManager.setLfo1Frequency(event.detail.value);
        break;
      case LfoEvent.MOD_AMOUNT:
        this.voiceManager.setLfo1ModAmount(event.detail.value);
        break;
      case LfoEvent.DESTINATION:
        this.voiceManager.setLfo1Destination(event.detail.value);
    }
  }

  onLfo2Change(event: CustomEvent) {
    switch (event.detail.type) {
      case LfoEvent.WAVE_FORM:
        this.voiceManager.setLfo2Mode(event.detail.value);
        break;
      case LfoEvent.FREQUENCY:
        this.voiceManager.setLfo2Frequency(event.detail.value);
        break;
      case LfoEvent.MOD_AMOUNT:
        this.voiceManager.setLfo2ModAmount(event.detail.value);
        break;
      case LfoEvent.DESTINATION:
        this.voiceManager.setLfo2Destination(event.detail.value);
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
        <switch-element @change="${this.notifyMidiLearners}"></switch-element>
        <div class="synth">
          <div class="oscillators">
            <oscillator-element
              label="Osc 1"
              .state=${this.voiceManager.osc1}
              @change=${this.onOsc1Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></oscillator-element>
            <div class="oscillator-mix">
              <panel-wrapper-element class="oscillator-mix-wrapper">
                <div class="oscillator-mix-control">
                  <knob-element
                    label="osc mix"
                    .value=${this.voiceManager.osc2Amplitude}
                    @change=${this.onOscMixChange}
                    .shouldMidiLearn="${this.shouldMidiLearn}"
                  ></knob-element>
                </div>
              </panel-wrapper-element>
            </div>
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
              label="envelope"
              .state=${this.voiceManager.osc1Envelope}
              @change=${this.onOsc1EnvelopeChange}
            ></oscillator-envelope-element>
            <lfo-element
              label="lfo 1"
              @change=${this.onLfo1Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></lfo-element>
            <lfo-element
              label="lfo 2"
              @change=${this.onLfo2Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></lfo-element>
            <filter-envelope-element
              .state=${this.voiceManager.cutoffEnvelope}
              @change=${this.onFilterEnvelopeChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></filter-envelope-element>
          </div>
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
    `;
  }

  static get styles() {
    return css`
      .content {
        width: 85%;
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
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

        background-color: #d7893b;

        border-radius: 0.5rem;
        padding: 1rem;
      }

      .synth .oscillators {
        display: flex;

        justify-content: space-between;
        align-items: center;
      }

      .synth .oscillator-mix {
        --knob-size: 60px;
        --panel-wrapper-background-color: #7a1621;

        display: inline-flex;
        justify-content: center;
      }

      .synth .oscillator-mix .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      .synth .envelopes {
        display: flex;
        justify-content: space-between;
        align-items: center;

        margin-top: 1em;
      }

      .sequencer {
        width: 30%;
        margin: 1em auto;
        --key-height: 100px;
      }
    `;
  }
}
