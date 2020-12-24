import { LitElement, html, css, customElement, property } from "lit-element";

import "../common/controls/keys-element";
import "./visualizer-element";
import "./panels/oscillator/wave-selector-element";
import "./panels/oscillator/oscillator-element";
import "./panels/oscillator-mix/oscillator-mix";
import "./panels/filter/filter-element";
import "./panels/envelope/envelope-element";
import "./panels/filter-mod/filter-envelope-element";
import "./panels/lfo/lfo-element";
import "./panels/menu/menu-element";
import "./panels/panel-wrapper-element";
import "../common/controls/midi-control-wrapper";

import { VoiceManager } from "../../core/voice-manager";

import { OscillatorEvent } from "../../types/oscillator-event";
import { FilterEvent } from "../../types/filter-event";
import { FilterEnvelopeEvent } from "../../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../../types/oscillator-envelope-event";
import { LfoEvent } from "../../types/lfo-event";
import { createMidiController } from "../../core/midi/midi-controller";
import { MidiOmniChannel } from "../../core/midi/midi-channels";
import { Dispatcher } from "../../core/dispatcher";
import { MidiController } from "../../types/midi-controller";
import { MenuMode } from "../../types/menu-mode";
import { VoiceEvent } from "../../types/voice-event";
import { VoiceState } from "../../types/voice";
import { MidiControlID } from "../../types/midi-learn-options";
import { KeyBoardController } from "../../core/keyboard-controller";

@customElement("wasm-poly-element")
export class WasmPoly extends LitElement {
  private audioContext: AudioContext;
  private analyzer: AnalyserNode;
  private midiController: MidiController & Dispatcher;
  private voiceManager: VoiceManager;
  private state: Partial<VoiceState>;

  private currentLearnerID = MidiControlID.NONE;

  private showVizualizer = false;

  @property({ type: Object })
  private pressedKeys = new Set<number>();

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
      .setKeyBoardcontroller(new KeyBoardController())
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
      .subscribe(VoiceEvent.NOTE_ON, (note) => {
        this.pressedKeys.add(note.midiValue);
        this.pressedKeys = new Set([...this.pressedKeys.values()]);
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.NOTE_OFF, (note) => {
        this.pressedKeys.delete(note.midiValue);
        this.pressedKeys = new Set([...this.pressedKeys.values()]);
        this.requestUpdate();
      })
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
      case OscillatorEvent.CYCLE:
        this.voiceManager.setOsc1Cycle(event.detail.value);  
    }
  }

  onAmplitudeEnvelopeChange(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEnvelopeEvent.ATTACK:
        this.voiceManager.setAmplitudeEnvelopeAttack(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.DECAY:
        this.voiceManager.setAmplitudeEnvelopeDecay(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.SUSTAIN:
        this.voiceManager.setAmplitudeEnvelopeSustain(event.detail.value);
        break;
      case OscillatorEnvelopeEvent.RELEASE:
        this.voiceManager.setAmplitudeEnvelopeRelease(event.detail.value);
        break;
    }
  }

  onOscMixChange(event: CustomEvent) {
    switch (event.detail.type) {
      case OscillatorEvent.MIX:
        this.voiceManager.setOsc2Amplitude(event.detail.value);
        break;
      case OscillatorEvent.NOISE:
        this.voiceManager.setNoiseLevel(event.detail.value);
        break;
    }
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
      case OscillatorEvent.CYCLE:
        this.voiceManager.setOsc2Cycle(event.detail.value);    
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
        this.currentLearnerID = option.value;
        this.midiController.setCurrentLearnerID(this.currentLearnerID);
        break;
      case MenuMode.MIDI_CHANNEL:
        this.currentLearnerID = MidiControlID.NONE;
        this.midiController.setCurrentLearnerID(this.currentLearnerID);
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
          <div class="panels-row">
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${MidiControlID.OSC1_SEMI}
              .centControlID=${MidiControlID.OSC1_CENT}
              .cycleControlID=${MidiControlID.OSC1_CYCLE}
              label="Osc. 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
            ></oscillator-element>
            <oscillator-mix-element 
              .state=${this.state} 
              .currentLearnerID=${this.currentLearnerID}
              @change=${this.onOscMixChange}
            ></oscillator-mix-element>
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${MidiControlID.OSC2_SEMI}
              .centControlID=${MidiControlID.OSC2_CENT}
              .cycleControlID=${MidiControlID.OSC2_CYCLE}
              label="Osc. 2"
              .state=${this.state.osc2}
              @change=${this.onOsc2Change}
            ></oscillator-element>
            <filter-element
              .currentLearnerID=${this.currentLearnerID}
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="panels-row lower">
            <envelope-element
              .currentLearnerID=${this.currentLearnerID}
              label="Envelope"
              .state=${this.state.envelope}
              @change=${this.onAmplitudeEnvelopeChange}
            ></envelope-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${MidiControlID.LFO1_FREQ}
              .modAmountControlID=${MidiControlID.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${MidiControlID.LFO2_FREQ}
              .modAmountControlID=${MidiControlID.LFO2_MOD}
              label="LFO 2"
              .state=${this.state.lfo2}
              @change=${this.onLfo2Change}
            ></lfo-element>
            <filter-envelope-element
              .currentLearnerID=${this.currentLearnerID}
              .state=${this.state.cutoffMod}
              @change=${this.onFilterEnvelopeChange}
            ></filter-envelope-element>
          </div>
          <div class="keyboard">
            <panel-wrapper-element>
              <div class="keys">
                <keys-element
                  .pressedKeys=${this.pressedKeys}
                  @keyOn=${this.onKeyOn}
                  @keyOff=${this.onKeyOff}
                ></keys-element>
              </div>
            </panel-wrapper-element>
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
        margin: 0 0 15px 0;
      }

      .synth {
        margin: 20px auto;
        width: 650px;

        background-color: var(--main-panel-color);

        border-radius: 0.5rem;
        padding: 1.5em;
      }

      .synth .panels-row {
        display: flex;
        justify-content: space-between;
        align-items: center; 
      }

      .synth .panels-row.lower {
        margin-top: 1em;
      }

      .synth .keyboard {
        --key-height: 100px;
        --panel-wrapper-background-color: var(--keyboard-panel-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 15px;
      }

      .synth .keyboard .keys {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 635px;
        margin: -1.5em auto 0.5em 0.6em;
      }
    `;
  }
}
