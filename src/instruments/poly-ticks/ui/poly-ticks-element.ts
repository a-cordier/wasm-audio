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

import { SynthController } from "../synth-controller";

import { OscillatorEvent } from "../types/oscillator-event";
import { FilterEvent } from "../types/filter-event";
import { FilterEnvelopeEvent } from "../types/filter-envelope-event";
import { OscillatorEnvelopeEvent } from "../types/oscillator-envelope-event";
import { LfoEvent } from "../types/lfo-event";
import { RoutingEvent, SpaceEvent } from "../types/routing-event";
import { OscRouting } from "../types/osc-routing";
import { VoiceEvent } from "../types/voice-event";
import { VoiceState } from "../types/voice";
import { VoiceConfigEvent } from "../types/voice-config-event";
import { VoiceMode } from "../types/voice-mode";
import { SynthChangeEvent, assertNever } from "../../../types/events";

import { ControlID } from "../../../control/types";
import { MidiBus } from "../../../midi/bus/bus";
import { Channel } from "../../../midi/types";
import type { Plugin } from "../../../core/types";

@customElement("wasm-poly-element")
export class WasmPoly extends LitElement {
  private state: Partial<VoiceState> = {};
  private _pendingKeyUpdate = false;

  @property({ type: Object })
  private pressedKeys = new Set<number>();

  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @property({ attribute: false })
  bus?: MidiBus;

  @property({ attribute: false })
  midiChannel: Channel | "omni" = "omni";

  private get voiceManager(): SynthController {
    return this.plugin as SynthController;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin || !this.audioContext) return;
    this.state = this.voiceManager.getState();
    this.registerVoiceHandlers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.plugin) this.unregisterVoiceHandlers();
  }

  private scheduleKeyUpdate() {
    if (this._pendingKeyUpdate) return;
    this._pendingKeyUpdate = true;
    requestAnimationFrame(() => {
      this._pendingKeyUpdate = false;
      this.pressedKeys = new Set(this.pressedKeys);
    });
  }

  // Stable handler identities so add/removeEventListener stay symmetric.
  private onNoteOn = (e: Event) => {
    this.pressedKeys.add((e as CustomEvent).detail.midiValue);
    this.scheduleKeyUpdate();
  };
  private onNoteOff = (e: Event) => {
    this.pressedKeys.delete((e as CustomEvent).detail.midiValue);
    this.scheduleKeyUpdate();
  };
  private onOsc1 = (e: Event) => { this.state.osc1 = (e as CustomEvent).detail; this.requestUpdate(); };
  private onOscMix = (e: Event) => { this.state.osc2Amplitude = (e as CustomEvent).detail; this.requestUpdate(); };
  private onNoise = (e: Event) => { this.state.noiseLevel = (e as CustomEvent).detail; this.requestUpdate(); };
  private onOsc2 = (e: Event) => { this.state.osc2 = (e as CustomEvent).detail; this.requestUpdate(); };
  private onFilter = (e: Event) => { this.state.filter = (e as CustomEvent).detail; this.requestUpdate(); };
  private onEnvelope = (e: Event) => { this.state.envelope = (e as CustomEvent).detail; this.requestUpdate(); };
  private onLfo1 = (e: Event) => { this.state.lfo1 = (e as CustomEvent).detail; this.requestUpdate(); };
  private onLfo2 = (e: Event) => { this.state.lfo2 = (e as CustomEvent).detail; this.requestUpdate(); };
  private onCutoffMod = (e: Event) => { this.state.cutoffMod = (e as CustomEvent).detail; this.requestUpdate(); };
  private onVoiceConfig = (e: Event) => { this.state.voiceConfig = (e as CustomEvent).detail; this.requestUpdate(); };
  private onRouting = (e: Event) => { this.state.routing = (e as CustomEvent).detail; this.requestUpdate(); };
  private onSpace = (e: Event) => { this.state.space = (e as CustomEvent).detail; this.requestUpdate(); };

  private registerVoiceHandlers() {
    const vm = this.voiceManager;
    vm.addEventListener(VoiceEvent.NOTE_ON, this.onNoteOn);
    vm.addEventListener(VoiceEvent.NOTE_OFF, this.onNoteOff);
    vm.addEventListener(VoiceEvent.OSC1, this.onOsc1);
    vm.addEventListener(VoiceEvent.OSC_MIX, this.onOscMix);
    vm.addEventListener(VoiceEvent.NOISE, this.onNoise);
    vm.addEventListener(VoiceEvent.OSC2, this.onOsc2);
    vm.addEventListener(VoiceEvent.FILTER, this.onFilter);
    vm.addEventListener(VoiceEvent.ENVELOPE, this.onEnvelope);
    vm.addEventListener(VoiceEvent.LFO1, this.onLfo1);
    vm.addEventListener(VoiceEvent.LFO2, this.onLfo2);
    vm.addEventListener(VoiceEvent.CUTOFF_MOD, this.onCutoffMod);
    vm.addEventListener(VoiceEvent.VOICE_CONFIG, this.onVoiceConfig);
    vm.addEventListener(VoiceEvent.ROUTING, this.onRouting);
    vm.addEventListener(VoiceEvent.SPACE, this.onSpace);
  }

  private unregisterVoiceHandlers() {
    const vm = this.voiceManager;
    vm.removeEventListener(VoiceEvent.NOTE_ON, this.onNoteOn);
    vm.removeEventListener(VoiceEvent.NOTE_OFF, this.onNoteOff);
    vm.removeEventListener(VoiceEvent.OSC1, this.onOsc1);
    vm.removeEventListener(VoiceEvent.OSC_MIX, this.onOscMix);
    vm.removeEventListener(VoiceEvent.NOISE, this.onNoise);
    vm.removeEventListener(VoiceEvent.OSC2, this.onOsc2);
    vm.removeEventListener(VoiceEvent.FILTER, this.onFilter);
    vm.removeEventListener(VoiceEvent.ENVELOPE, this.onEnvelope);
    vm.removeEventListener(VoiceEvent.LFO1, this.onLfo1);
    vm.removeEventListener(VoiceEvent.LFO2, this.onLfo2);
    vm.removeEventListener(VoiceEvent.CUTOFF_MOD, this.onCutoffMod);
    vm.removeEventListener(VoiceEvent.VOICE_CONFIG, this.onVoiceConfig);
    vm.removeEventListener(VoiceEvent.ROUTING, this.onRouting);
    vm.removeEventListener(VoiceEvent.SPACE, this.onSpace);
  }

  private get resolvedChannel(): Channel {
    return this.midiChannel === "omni" ? (0 as Channel) : this.midiChannel;
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

  onVoicePanelChange(event: SynthChangeEvent<OscillatorEvent | RoutingEvent>) {
    switch (event.detail.type) {
      case OscillatorEvent.MIX: this.voiceManager.setOsc2Amplitude(event.detail.value as number); break;
      case OscillatorEvent.NOISE: this.voiceManager.setNoiseLevel(event.detail.value as number); break;
      case RoutingEvent.ROUTING: this.voiceManager.setOscRouting(event.detail.value as OscRouting); break;
      case RoutingEvent.FM_INDEX: this.voiceManager.setFmIndex(event.detail.value as number); break;
      case RoutingEvent.SUB_LEVEL: this.voiceManager.setSubLevel(event.detail.value as number); break;
      case OscillatorEvent.WAVE_FORM: break;
      case OscillatorEvent.SEMI_SHIFT: break;
      case OscillatorEvent.CENT_SHIFT: break;
      case OscillatorEvent.CYCLE: break;
      default: assertNever(event.detail.type);
    }
  }

  onSpaceChange(event: SynthChangeEvent<SpaceEvent>) {
    switch (event.detail.type) {
      case SpaceEvent.SPREAD: this.voiceManager.setStereoSpread(event.detail.value as number); break;
      case SpaceEvent.WIDTH: this.voiceManager.setStereoWidth(event.detail.value as number); break;
      case SpaceEvent.DRIFT: this.voiceManager.setPhaseDrift(event.detail.value as number); break;
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

  render() {
    return html`
      <div class="content">
        <div class="synth">
          <row-element label="Oscillators">
            <div class="panels-row upper">
              <envelope-element
                label="Envelope"
                .state=${this.state.envelope}
                @change=${this.onAmplitudeEnvelopeChange}
              ></envelope-element>
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
                .routing=${this.state.routing}
                @change=${this.onVoicePanelChange}
              ></oscillator-mix-element>
              <oscillator-element
                .semiControlID=${ControlID.OSC2_SEMI}
                .centControlID=${ControlID.OSC2_CENT}
                .cycleControlID=${ControlID.OSC2_CYCLE}
                label="Osc. 2"
                .state=${this.state.osc2}
                @change=${this.onOsc2Change}
              ></oscillator-element>
            </div>
          </row-element>
          <row-element label="Modulation">
            <div class="panels-row lower">
              <filter-element
                .state=${this.state.filter}
                @change=${this.onFilterChange}
              ></filter-element>
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
              <space-element
                label="Space"
                .state=${this.state.space}
                @change=${this.onSpaceChange}
              ></space-element>
            </div>
          </row-element>
          <row-element label="Keyboard" ?collapsed=${true}>
            <div class="keyboard">
              <panel-wrapper-element>
                <div class="keys">
                  <keys-element
                    .pressedKeys=${this.pressedKeys}
                    .bus=${this.bus}
                    .channel=${this.resolvedChannel}
                  ></keys-element>
                </div>
              </panel-wrapper-element>
            </div>
          </row-element>
        </div>
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

      .synth {
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1em;
        box-sizing: border-box;

        /* Neutral + accent treatment, à la monolog: a single cyan accent
           carries the identity across labels, knob cursors, active toggles and
           the LCDs; everything else reads as muted charcoal. */
        --panel-wrapper-label-color: var(--poly-accent);
        --control-label-color: #9aa0a6;
        --control-cursor-color: var(--poly-accent);

        --lcd-text-color: var(--poly-accent);
        --lcd-led-on-color: var(--poly-accent);
        --lcd-led-off-color: color-mix(in srgb, var(--poly-accent) 10%, transparent);
        --lcd-screen-border-color: #55575b;
        --lcd-screen-border-radius: 4px;

        --button-active-label-color: var(--poly-accent);
        --button-active-border-color: var(--poly-accent);
        --button-active-background-color: #24272b;
        --button-disposed-background-color: #3a3b3f;
        --button-disposed-label-color: #9aa0a6;
        --button-border-color: #4a4b50;

        /* Neutral gutter so the tinted charcoal panels read as raised cards. */
        --row-toggle-bg: #1e2023;
        --row-padding: 7px;
      }

      .panels-row {
        display: grid;
        gap: 0.4rem;
        align-items: stretch;
        grid-auto-rows: 1fr;
      }

      .panels-row > * {
        min-width: 0;
      }

      .panels-row.upper {
        grid-template-columns: 8fr 8fr 5fr 8fr;
      }

      .panels-row.lower {
        grid-template-columns: 6fr 5fr 5fr 6fr 3fr;
      }

      .keyboard {
        --key-height: 100px;
        --panel-wrapper-background-color: var(--keyboard-panel-color);
      }

      row-element + row-element {
        margin-top: 0.4em;
      }

      .keyboard .keys {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
        padding: 0.5em 5%;
        box-sizing: border-box;
      }

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
