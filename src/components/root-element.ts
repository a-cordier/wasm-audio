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

@customElement("child-element")
export class Root extends LitElement {
  private audioContext: AudioContext;

  @property({ type: GainNode })
  private gain: GainNode;

  @property({ type: AnalyserNode })
  private analyzer: AnalyserNode;

  @property({ type: Boolean })
  private shouldMidiLearn = false;

  private state = {
    osc1: {
      mode: OscillatorMode.SAWTOOTH,
      semiShift: 0,
      centShift: 0,
      envelope: {
        attack: 0,
        decay: 127 / 2,
        sustain: 127,
        release: 127 / 4,
      },
    },
    osc2: {
      mode: OscillatorMode.SAWTOOTH,
      semiShift: 0,
      centShift: 0,
      envelope: {
        attack: 0,
        decay: 127 / 2,
        sustain: 127,
        release: 127 / 4,
      },
    },
    osc2Amplitude: 127 / 2,
    filter: {
      mode: FilterMode.LOWPASS,
      cutoff: 127,
      resonance: 0,
      envelope: {
        attack: 0,
        decay: 127 / 2,
        amount: 0,
      },
    },
  };

  private voiceManager: VoiceManager;

  private channels: Map<number, Voice>[] = Array.from({ length: 16 }).map(
    () => new Map<number, Voice>()
  );

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
    this.voiceManager = new VoiceManager(
      this.audioContext,
      createVoiceGenerator
    );

    await this.audioContext.audioWorklet.addModule("voice-processor.js");

    this.gain.gain.value = 0.5;

    this.registerMidiLearners();
  }

  async onKeyOn(event: CustomEvent) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const { frequency, midiValue, channel } = event.detail;

    const notes = this.channels[channel - 1];

    if (notes.has(midiValue)) {
      return; // avoid playing the same note twice (the note would hang forever)
    }

    const voice = this.voiceManager.next({ frequency });
    voice.osc1 = this.state.osc1.mode;
    voice.osc1SemiShift.value = this.state.osc1.semiShift;
    voice.osc1CentShift.value = this.state.osc1.centShift;
    voice.osc2 = this.state.osc2.mode;
    voice.osc2SemiShift.value = this.state.osc2.semiShift;
    voice.osc2CentShift.value = this.state.osc2.centShift;
    voice.osc2Amplitude.value = this.state.osc2Amplitude;
    voice.amplitudeAttack.value = this.state.osc1.envelope.attack;
    voice.amplitudeDecay.value = this.state.osc1.envelope.decay;
    voice.amplitudeSustain.value = this.state.osc1.envelope.sustain;
    voice.amplitudeRelease.value = this.state.osc1.envelope.release;
    voice.filterMode = this.state.filter.mode;
    voice.cutoff.value = this.state.filter.cutoff;
    voice.resonance.value = this.state.filter.resonance;
    voice.cutoffAttack.value = this.state.filter.envelope.attack;
    voice.cutoffDecay.value = this.state.filter.envelope.decay;
    voice.cutoffEnvelopeAmount.value = this.state.filter.envelope.amount;

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
        this.state.osc1.mode = event.detail.value;
        break;
      case OscillatorEvent.SEMI_SHIFT:
        this.state.osc1.semiShift = event.detail.value;
        break;
      case OscillatorEvent.CENT_SHIFT:
        this.state.osc1.centShift = event.detail.value;
        break;
    }
  }

  onOsc1EnvelopeChange(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEnvelopeEvent.ATTACK:
        this.state.osc1.envelope.attack = event.detail.value;
        break;
      case OscillatorEnvelopeEvent.DECAY:
        this.state.osc1.envelope.decay = event.detail.value;
        break;
      case OscillatorEnvelopeEvent.SUSTAIN:
        this.state.osc1.envelope.sustain = event.detail.value;
        break;
      case OscillatorEnvelopeEvent.RELEASE:
        this.state.osc1.envelope.release = event.detail.value;
        break;
    }
  }

  onOscMixChange(event: CustomEvent) {
    this.state.osc2Amplitude = event.detail.value;
  }

  onOsc2Change(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEvent.WAVE_FORM:
        this.state.osc2.mode = event.detail.value;
        break;
      case OscillatorEvent.SEMI_SHIFT:
        console.log(event.detail.value);
        this.state.osc2.semiShift = event.detail.value;
        break;
      case OscillatorEvent.CENT_SHIFT:
        this.state.osc2.centShift = event.detail.value;
        break;
    }
  }

  onFilterChange(event: CustomEvent) {
    switch (event.detail.type) {
      case FilterEvent.MODE:
        this.state.filter.mode = event.detail.value;
        break;
      case FilterEvent.CUTOFF:
        this.state.filter.cutoff = event.detail.value;
        break;
      case FilterEvent.RESONANCE:
        this.state.filter.resonance = event.detail.value;
        break;
    }
  }

  onFilterEnvelopeChange(event: CustomEvent) {
    switch (event.detail.type) {
      case FilterEnvelopeEvent.ATTACK:
        this.state.filter.envelope.attack = event.detail.value;
        break;
      case FilterEnvelopeEvent.DECAY:
        this.state.filter.envelope.decay = event.detail.value;
        break;
      case FilterEnvelopeEvent.AMOUNT:
        this.state.filter.envelope.amount = event.detail.value;
        break;
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

        <div class="menu">
          <switch-element @change="${this.notifyMidiLearners}"></switch-element>
        </div>

        <div class="synth">
          <div class="oscillators">
            <oscillator-element
              label="Osc 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></oscillator-element>
            <knob-element
              label="Mix"
              .value=${this.state.osc2Amplitude}
              @change=${this.onOscMixChange}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></knob-element>
            <oscillator-element
              label="Osc 2"
              .state=${this.state.osc1}
              @change=${this.onOsc2Change}
              .shouldMidiLearn="${this.shouldMidiLearn}"
            ></oscillator-element>
            <filter-element
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="envelopes">
            <oscillator-envelope-element
              .state=${this.state.osc1.envelope}
              @change=${this.onOsc1EnvelopeChange}
            ></oscillator-envelope-element>
            <switch-element
              @change="${this.notifyMidiLearners}"
            ></switch-element>
            <oscillator-envelope-element></oscillator-envelope-element>
            <filter-envelope-element
              .state=${this.state.filter.envelope}
              @change=${this.onFilterEnvelopeChange}
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
