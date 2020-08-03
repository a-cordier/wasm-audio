import { LitElement, html, css, customElement, property } from "lit-element";

import "./common/controls/keys-element";
import "./visualizer-element";
import "./common/controls/knob-element";
import "./common/icons/sawtooth-wave-icon";
import "./common/icons/square-wave-icon";
import "./common/icons/sine-wave-icon";
import "./common/icons/triangle-wave-icon";
import "./panels/oscillator/wave-selector-element";
import "./panels/oscillator/oscillator-element";
import "./panels/filter/filter-element";
import "./panels/envelope/envelope-element";
import "./panels/filter-mod/filter-envelope-element";
import "./panels/lfo/lfo-element";
import "./panels/menu/menu-element";
import "./panels/panel-wrapper-element";
import "./common/controls/midi-control-wrapper";

import { VoiceManager } from "../core/voice-manager";

import { OscillatorEvent } from "../types/oscillator-event";
import { FilterEvent } from "../types/filter-event";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../types/oscillator-envelope-event";
import { LfoEvent } from "../types/lfo-event";
import { createMidiController } from "../core/midi/midi-controller";
import { MidiOmniChannel } from "../core/midi/midi-channels";
import { Dispatcher } from "../core/dispatcher";
import { MidiController } from "../types/midi-controller";
import { MenuMode } from "../types/menu-mode";
import { VoiceEvent } from "../types/voice-event";
import { VoiceState } from "../types/voice";
import { MidiControlID } from "../types/midi-learn-options";

@customElement("child-element")
export class Root extends LitElement {
  private audioContext: AudioContext;
  private analyzer: AnalyserNode;
  private midiController: MidiController & Dispatcher;
  private voiceManager: VoiceManager;
  private state: Partial<VoiceState>;

  private currentLearnerID = MidiControlID.NONE;

  private showVizualizer = false;

  constructor() {
    super();
    this.audioContext = new AudioContext();
    this.analyzer = this.audioContext.createAnalyser();
    this.voiceManager = new VoiceManager(this.audioContext);
    this.state = this.voiceManager.getState();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.midiController = await createMidiController(MidiOmniChannel);
    this.setUpVoiceManager();
    this.analyzer.connect(this.audioContext.destination);
    await this.audioContext.audioWorklet.addModule("voice-processor.js");
    this.registerVoiceHandlers();
  }

  setUpVoiceManager() {
    this.voiceManager
      .setMidiController(this.midiController)
      .connect(this.analyzer);
  }

  async onKeyOn(event: CustomEvent) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    const { frequency, midiValue } = event.detail;
    this.voiceManager.next({ frequency, midiValue });
  }

  onKeyOff(event: CustomEvent) {
    const { midiValue } = event.detail;
    this.voiceManager.stop({ midiValue });
  }

  registerVoiceHandlers() {
    this.voiceManager
      .subscribe(VoiceEvent.OSC1, (newState) => {
        this.state.osc1 = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.OSC_MIX, (newState) => {
        this.state.osc2Amplitude = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.OSC2, (newState) => {
        this.state.osc2 = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.FILTER, (newState) => {
        this.state.filter = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.ENVELOPE, (newState) => {
        this.state.envelope = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.LFO1, (newState) => {
        this.state.lfo1 = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.LFO2, (newState) => {
        this.state.lfo2 = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.CUTOFF_MOD, (newState) => {
        this.state.cutoffMod = newState;
        this.requestUpdate();
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

  onMenuChange(event: CustomEvent) {
    const { type, option } = event.detail;
    switch (type) {
      case MenuMode.MIDI_LEARN:
        this.midiController.setCurrentLearnerID(option.value);
        this.currentLearnerID = option.value;
        break;
      case MenuMode.MIDI_CHANNEL:
        this.midiController.setCurrentChannel(option.value);
        break;
    }
    this.requestUpdate();
  }

  computeVizualizerIfEnabled() {
    if (this.showVizualizer) {
      return html`
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `;
    }
  }

  render() {
    return html`
      <div class="content">
        <div class="synth">
          <div class="menu">
            <menu-element
              .analyser=${this.analyzer}
              @change=${this.onMenuChange}
            ></menu-element>
          </div>
          <div class="oscillators">
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${MidiControlID.OSC1_SEMI}
              .centControlID=${MidiControlID.OSC1_CENT}
              label="Osc 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
            ></oscillator-element>
            <div class="oscillator-mix">
              <panel-wrapper-element class="oscillator-mix-wrapper">
                <div class="oscillator-mix-control">
                  <midi-control-wrapper
                    .controlID=${MidiControlID.OSC_MIX}
                    .currentLearnerID=${this.currentLearnerID}
                  >
                    <knob-element
                      label="osc mix"
                      .value=${this.state.osc2Amplitude.value as number}
                      @change=${this.onOscMixChange}
                    ></knob-element>
                  </midi-control-wrapper>
                </div>
              </panel-wrapper-element>
            </div>
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${MidiControlID.OSC2_SEMI}
              .centControlID=${MidiControlID.OSC2_CENT}
              label="Osc 2"
              .state=${this.state.osc2}
              @change=${this.onOsc2Change}
            ></oscillator-element>
            <filter-element
              .currentLearnerID=${this.currentLearnerID}
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="envelopes">
            <envelope-element
              .currentLearnerID=${this.currentLearnerID}
              label="envelope"
              .state=${this.state.envelope}
              @change=${this.onOsc1EnvelopeChange}
            ></envelope-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${MidiControlID.LFO1_FREQ}
              .modAmountControlID=${MidiControlID.LFO1_MOD}
              label="lfo 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${MidiControlID.LFO2_FREQ}
              .modAmountControlID=${MidiControlID.LFO2_MOD}
              label="lfo 2"
              .state=${this.state.lfo2}
              @change=${this.onLfo2Change}
            ></lfo-element>
            <filter-envelope-element
              .currentLearnerID=${this.currentLearnerID}
              .state=${this.state.cutoffMod}
              @change=${this.onFilterEnvelopeChange}
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
        ${this.computeVizualizerIfEnabled()}
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
        margin: 0 0 10px 0;
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

      .synth .oscillator-mix.focused {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: #abbdcd;
          --control-top-color: #252525;
        }
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
