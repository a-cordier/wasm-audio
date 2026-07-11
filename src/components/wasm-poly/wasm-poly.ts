/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

import { SynthController } from "../../synth/synth-controller";

import { OscillatorEvent } from "../../types/oscillator-event";
import { FilterEvent } from "../../types/filter-event";
import { FilterEnvelopeEvent } from "../../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../../types/oscillator-envelope-event";
import { LfoEvent } from "../../types/lfo-event";
import { VoiceEvent } from "../../types/voice-event";
import { VoiceState } from "../../types/voice";
import { VoiceConfigEvent } from "../../types/voice-config-event";
import { VoiceMode } from "../../types/voice-mode";
import { SynthChangeEvent, assertNever } from "../../types/events";

import { ControlID } from "../../control/types";

@customElement("wasm-poly-element")
export class WasmPoly extends LitElement {
  private analyzer: AnalyserNode | null = null;
  private state: Partial<VoiceState> = {};

  private showVizualizer = false;
  private editMode = false;
  private _pendingKeyUpdate = false;

  @property({ type: Object })
  private pressedKeys = new Set<number>();

  @property({ attribute: false })
  voiceManager!: SynthController;

  @property({ attribute: false })
  audioContext!: AudioContext;

  connectedCallback() {
    super.connectedCallback();
    if (!this.voiceManager || !this.audioContext) return;
    this.state = this.voiceManager.getState();
    this.analyzer = this.audioContext.createAnalyser();
    this.voiceManager.connect(this.analyzer);
    this.registerVoiceHandlers();
  }

  private scheduleKeyUpdate() {
    if (this._pendingKeyUpdate) return;
    this._pendingKeyUpdate = true;
    requestAnimationFrame(() => {
      this._pendingKeyUpdate = false;
      this.pressedKeys = new Set(this.pressedKeys);
    });
  }

  private registerVoiceHandlers() {
    this.voiceManager
      .subscribe(VoiceEvent.NOTE_ON, (note) => {
        this.pressedKeys.add(note.midiValue);
        this.scheduleKeyUpdate();
      })
      .subscribe(VoiceEvent.NOTE_OFF, (note) => {
        this.pressedKeys.delete(note.midiValue);
        this.scheduleKeyUpdate();
      })
      .subscribe(VoiceEvent.OSC1, (newState) => {
        this.state.osc1 = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.OSC_MIX, (newState) => {
        this.state.osc2Amplitude = newState;
        this.requestUpdate();
      })
      .subscribe(VoiceEvent.NOISE, (newState) => {
        this.state.noiseLevel = newState;
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
      })
      .subscribe(VoiceEvent.VOICE_CONFIG, (newState) => {
        this.state.voiceConfig = newState;
        this.requestUpdate();
      });
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

  onOsc1Change(event: SynthChangeEvent<OscillatorEvent>) {
    switch (event.detail.type) {
      case OscillatorEvent.WAVE_FORM: this.voiceManager.setOsc1Mode(event.detail.value as number); break;
      case OscillatorEvent.SEMI_SHIFT: this.voiceManager.setOsc1SemiShift(event.detail.value as number); break;
      case OscillatorEvent.CENT_SHIFT: this.voiceManager.setOsc1CentShift(event.detail.value as number); break;
      case OscillatorEvent.CYCLE: this.voiceManager.setOsc1Cycle(event.detail.value as number); break;
      case OscillatorEvent.MIX: break;
      case OscillatorEvent.NOISE: break;
      default: assertNever(event.detail.type);
    }
  }

  onOsc2Change(event: SynthChangeEvent<OscillatorEvent>) {
    switch (event.detail.type) {
      case OscillatorEvent.WAVE_FORM: this.voiceManager.setOsc2Mode(event.detail.value as number); break;
      case OscillatorEvent.SEMI_SHIFT: this.voiceManager.setOsc2SemiShift(event.detail.value as number); break;
      case OscillatorEvent.CENT_SHIFT: this.voiceManager.setOsc2CentShift(event.detail.value as number); break;
      case OscillatorEvent.CYCLE: this.voiceManager.setOsc2Cycle(event.detail.value as number); break;
      case OscillatorEvent.MIX: break;
      case OscillatorEvent.NOISE: break;
      default: assertNever(event.detail.type);
    }
  }

  onOscMixChange(event: SynthChangeEvent<OscillatorEvent>) {
    switch (event.detail.type) {
      case OscillatorEvent.MIX: this.voiceManager.setOsc2Amplitude(event.detail.value as number); break;
      case OscillatorEvent.NOISE: this.voiceManager.setNoiseLevel(event.detail.value as number); break;
      case OscillatorEvent.WAVE_FORM: break;
      case OscillatorEvent.SEMI_SHIFT: break;
      case OscillatorEvent.CENT_SHIFT: break;
      case OscillatorEvent.CYCLE: break;
      default: assertNever(event.detail.type);
    }
  }

  onFilterChange(event: SynthChangeEvent<FilterEvent>) {
    switch (event.detail.type) {
      case FilterEvent.MODE: this.voiceManager.setFilterMode(event.detail.value as number); break;
      case FilterEvent.CUTOFF: this.voiceManager.setFilterCutoff(event.detail.value as number); break;
      case FilterEvent.RESONANCE: this.voiceManager.setFilterResonance(event.detail.value as number); break;
      case FilterEvent.DRIVE: this.voiceManager.setDrive(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
  }

  onAmplitudeEnvelopeChange(event: SynthChangeEvent<OscillatorEnvelopeEvent>) {
    switch (event.detail.type) {
      case OscillatorEnvelopeEvent.ATTACK: this.voiceManager.setAmplitudeEnvelopeAttack(event.detail.value as number); break;
      case OscillatorEnvelopeEvent.DECAY: this.voiceManager.setAmplitudeEnvelopeDecay(event.detail.value as number); break;
      case OscillatorEnvelopeEvent.SUSTAIN: this.voiceManager.setAmplitudeEnvelopeSustain(event.detail.value as number); break;
      case OscillatorEnvelopeEvent.RELEASE: this.voiceManager.setAmplitudeEnvelopeRelease(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
  }

  onFilterEnvelopeChange(event: SynthChangeEvent<FilterEnvelopeEvent>) {
    switch (event.detail.type) {
      case FilterEnvelopeEvent.ATTACK: this.voiceManager.setCutoffEnvelopeAttack(event.detail.value as number); break;
      case FilterEnvelopeEvent.DECAY: this.voiceManager.setCutoffEnvelopeDecay(event.detail.value as number); break;
      case FilterEnvelopeEvent.AMOUNT: this.voiceManager.setCutoffEnvelopeAmount(event.detail.value as number); break;
      case FilterEnvelopeEvent.VELOCITY: this.voiceManager.setCutoffEnvelopeVelocity(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
  }

  onLfo1Change(event: SynthChangeEvent<LfoEvent>) {
    switch (event.detail.type) {
      case LfoEvent.WAVE_FORM: this.voiceManager.setLfo1Mode(event.detail.value as number); break;
      case LfoEvent.FREQUENCY: this.voiceManager.setLfo1Frequency(event.detail.value as number); break;
      case LfoEvent.MOD_AMOUNT: this.voiceManager.setLfo1ModAmount(event.detail.value as number); break;
      case LfoEvent.DESTINATION: this.voiceManager.setLfo1Destination(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
  }

  onLfo2Change(event: SynthChangeEvent<LfoEvent>) {
    switch (event.detail.type) {
      case LfoEvent.WAVE_FORM: this.voiceManager.setLfo2Mode(event.detail.value as number); break;
      case LfoEvent.FREQUENCY: this.voiceManager.setLfo2Frequency(event.detail.value as number); break;
      case LfoEvent.MOD_AMOUNT: this.voiceManager.setLfo2ModAmount(event.detail.value as number); break;
      case LfoEvent.DESTINATION: this.voiceManager.setLfo2Destination(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
  }

  onVoiceConfigChange(event: SynthChangeEvent<VoiceConfigEvent>) {
    switch (event.detail.type) {
      case VoiceConfigEvent.VOICE_MODE: this.voiceManager.setVoiceMode(event.detail.value as VoiceMode); break;
      case VoiceConfigEvent.GLIDE_TIME: this.voiceManager.setGlideTime(event.detail.value as number); break;
      case VoiceConfigEvent.RETRIGGER: this.voiceManager.setRetrigger(event.detail.value as number); break;
      default: assertNever(event.detail.type);
    }
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

  computeDumpButtonIfEnabled() {
    if (this.editMode) {
      return html`<button @click=${this.voiceManager.dumpState}>Dump</button>`;
    }
  }

  render() {
    return html`
      <div class="content">
        <div class="synth">
          <div class="panels-row upper">
            <oscillator-element
              .semiControlID=${ControlID.OSC1_SEMI}
              .centControlID=${ControlID.OSC1_CENT}
              .cycleControlID=${ControlID.OSC1_CYCLE}
              label="Osc. 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
            ></oscillator-element>
            <oscillator-mix-element
              .mix=${this.state.osc2Amplitude}
              .noise=${this.state.noiseLevel}
              @change=${this.onOscMixChange}
            ></oscillator-mix-element>
            <oscillator-element
              .semiControlID=${ControlID.OSC2_SEMI}
              .centControlID=${ControlID.OSC2_CENT}
              .cycleControlID=${ControlID.OSC2_CYCLE}
              label="Osc. 2"
              .state=${this.state.osc2}
              @change=${this.onOsc2Change}
            ></oscillator-element>
            <filter-element
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="panels-row lower">
            <envelope-element
              label="Envelope"
              .state=${this.state.envelope}
              @change=${this.onAmplitudeEnvelopeChange}
            ></envelope-element>
            <lfo-element
              .frequencyControlID=${ControlID.LFO1_FREQ}
              .modAmountControlID=${ControlID.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .frequencyControlID=${ControlID.LFO2_FREQ}
              .modAmountControlID=${ControlID.LFO2_MOD}
              label="LFO 2"
              .state=${this.state.lfo2}
              @change=${this.onLfo2Change}
            ></lfo-element>
            <filter-envelope-element
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
        ${this.computeDumpButtonIfEnabled()}
      </div>
    `;
  }

  static get styles() {
    return css`
      .content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .visualizer {
        margin: auto;
      }

      .synth {
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1.5em;
        box-sizing: border-box;
      }

      /* ── Grid rows ── */

      .panels-row {
        display: grid;
        gap: 0.5rem;
        align-items: stretch;
      }

      .panels-row > * {
        min-width: 0;
      }

      /* Upper: Osc1 Mix Osc2 Filter → 8:3:8:8 */
      .panels-row.upper {
        grid-template-columns: 8fr 3fr 8fr 8fr;
      }

      /* Lower: Env LFO1 LFO2 FilterMod → 6:5:5:5 */
      .panels-row.lower {
        grid-template-columns: 6fr 5fr 5fr 5fr;
        margin-top: 1em;
      }

      /* ── Keyboard ── */

      .keyboard {
        --key-height: 100px;
        --panel-wrapper-background-color: var(--keyboard-panel-color);
        margin-top: 2em;
      }

      .keyboard .keys {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 90%;
        margin: -1em auto 0.5em auto;
      }

      /* ── Responsive breakpoints ── */

      @media (max-width: 600px) {
        .synth { padding: 0.75em; }
        .keyboard { --key-height: 60px; }

        .panels-row.upper,
        .panels-row.lower {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 400px) {
        .panels-row.upper,
        .panels-row.lower {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
