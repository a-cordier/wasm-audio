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
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { Plugin } from "../../../core/types";
import { ControlID } from "../../../control/types";
import { DrumlinController } from "../drumlin-controller";
import { DrumlinState } from "../types/drumlin-state";
import { DrumlinEvent } from "../types/drumlin-event";
import { DrumVoice } from "../types/drumlin-notes";

import "../../../components/common/controls/knob-element";
import "../../../components/common/controls/control-learn-wrapper";
import "../../../components/common/lcd/lcd-element";

const FLASH_MS = 110;

// Note names in the C4 = 60 convention — matches sequels' step grid LCDs.
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/**
 * DRUMLIN panel: one zone per voice (the camaïeu follows function = voice),
 * each headed by its trigger pad — the pad is the zone label AND the mouse
 * audition path, flashing on every trigger from any source.
 */
@customElement("drumlin-element")
export class DrumlinElement extends LitElement {
  @property({ attribute: false })
  plugin?: Plugin;

  @property({ attribute: false })
  audioContext!: AudioContext;

  @state() private kick: DrumlinState["kick"] | null = null;
  @state() private snare: DrumlinState["snare"] | null = null;
  @state() private clap: DrumlinState["clap"] | null = null;
  @state() private hats: DrumlinState["hats"] | null = null;
  @state() private tom: DrumlinState["tom"] | null = null;
  @state() private rim: DrumlinState["rim"] | null = null;
  @state() private ride: DrumlinState["ride"] | null = null;
  @state() private crash: DrumlinState["crash"] | null = null;
  @state() private out: DrumlinState["out"] | null = null;
  @state() private flashing = new Set<DrumVoice>();

  private get controller(): DrumlinController {
    return this.plugin as DrumlinController;
  }

  // Stable handler identities so add/removeEventListener stay symmetric.
  private onKick = (e: Event) => { this.kick = { ...(e as CustomEvent).detail }; };
  private onSnare = (e: Event) => { this.snare = { ...(e as CustomEvent).detail }; };
  private onClap = (e: Event) => { this.clap = { ...(e as CustomEvent).detail }; };
  private onHats = (e: Event) => { this.hats = { ...(e as CustomEvent).detail }; };
  private onTom = (e: Event) => { this.tom = { ...(e as CustomEvent).detail }; };
  private onRim = (e: Event) => { this.rim = { ...(e as CustomEvent).detail }; };
  private onRide = (e: Event) => { this.ride = { ...(e as CustomEvent).detail }; };
  private onCrash = (e: Event) => { this.crash = { ...(e as CustomEvent).detail }; };
  private onOut = (e: Event) => { this.out = { ...(e as CustomEvent).detail }; };
  private onTrigger = (e: Event) => {
    const voice = (e as CustomEvent).detail.voice as DrumVoice;
    const next = new Set(this.flashing);
    next.add(voice);
    this.flashing = next;
    setTimeout(() => {
      const after = new Set(this.flashing);
      after.delete(voice);
      this.flashing = after;
    }, FLASH_MS);
  };

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin) return;
    const s = this.controller.getState();
    this.kick = s.kick;
    this.snare = s.snare;
    this.clap = s.clap;
    this.hats = s.hats;
    this.tom = s.tom;
    this.rim = s.rim;
    this.ride = s.ride;
    this.crash = s.crash;
    this.out = s.out;
    const c = this.controller;
    c.addEventListener(DrumlinEvent.KICK, this.onKick);
    c.addEventListener(DrumlinEvent.SNARE, this.onSnare);
    c.addEventListener(DrumlinEvent.CLAP, this.onClap);
    c.addEventListener(DrumlinEvent.HATS, this.onHats);
    c.addEventListener(DrumlinEvent.TOM, this.onTom);
    c.addEventListener(DrumlinEvent.RIM, this.onRim);
    c.addEventListener(DrumlinEvent.RIDE, this.onRide);
    c.addEventListener(DrumlinEvent.CRASH, this.onCrash);
    c.addEventListener(DrumlinEvent.OUT, this.onOut);
    c.addEventListener(DrumlinEvent.TRIGGER, this.onTrigger);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!this.plugin) return;
    const c = this.controller;
    c.removeEventListener(DrumlinEvent.KICK, this.onKick);
    c.removeEventListener(DrumlinEvent.SNARE, this.onSnare);
    c.removeEventListener(DrumlinEvent.CLAP, this.onClap);
    c.removeEventListener(DrumlinEvent.HATS, this.onHats);
    c.removeEventListener(DrumlinEvent.TOM, this.onTom);
    c.removeEventListener(DrumlinEvent.RIM, this.onRim);
    c.removeEventListener(DrumlinEvent.RIDE, this.onRide);
    c.removeEventListener(DrumlinEvent.CRASH, this.onCrash);
    c.removeEventListener(DrumlinEvent.OUT, this.onOut);
    c.removeEventListener(DrumlinEvent.TRIGGER, this.onTrigger);
  }

  render() {
    if (!this.kick || !this.snare || !this.clap || !this.hats || !this.tom || !this.out) return html``;
    if (!this.rim || !this.ride || !this.crash) return html``;
    return html`
      <div class="synth">
        <div class="row top">
        <div class="zone kick">
          ${this.pad("KICK", "kick")}
          ${this.noteSel("kick", this.kick.note.value)}
          <div class="knobs">
            ${this.knob("TUN", ControlID.DRM_KICK_TUNE, this.kick.tune.value)}
            ${this.knob("PCH", ControlID.DRM_KICK_PUNCH, this.kick.punch.value, "pitch sweep + click")}
            ${this.knob("DEC", ControlID.DRM_KICK_DECAY, this.kick.decay.value)}
            ${this.knob("LVL", ControlID.DRM_KICK_LEVEL, this.kick.level.value)}
          </div>
          ${this.routeBtn("kick", this.kick.route.value)}
        </div>

        <div class="zone snare">
          ${this.pad("SNARE", "snare")}
          ${this.noteSel("snare", this.snare.note.value)}
          <div class="knobs">
            ${this.knob("TUN", ControlID.DRM_SNARE_TUNE, this.snare.tune.value)}
            ${this.knob("SNP", ControlID.DRM_SNARE_SNAP, this.snare.snap.value, "noise / tone balance")}
            ${this.knob("DEC", ControlID.DRM_SNARE_DECAY, this.snare.decay.value)}
            ${this.knob("LVL", ControlID.DRM_SNARE_LEVEL, this.snare.level.value)}
          </div>
          ${this.routeBtn("snare", this.snare.route.value)}
        </div>

        <div class="zone clap">
          ${this.pad("CLAP", "clap")}
          ${this.noteSel("clap", this.clap.note.value)}
          <div class="knobs">
            ${this.knob("TON", ControlID.DRM_CLAP_TONE, this.clap.tone.value)}
            ${this.knob("DEC", ControlID.DRM_CLAP_DECAY, this.clap.decay.value)}
            ${this.knob("LVL", ControlID.DRM_CLAP_LEVEL, this.clap.level.value)}
          </div>
          ${this.routeBtn("clap", this.clap.route.value)}
        </div>

        <div class="zone hats">
          <div class="hat-cols">
            <div class="hat-col">
              ${this.pad("CH", "ch")}
              ${this.noteSel("ch", this.hats.chNote.value)}
              <div class="knobs">
                ${this.knob("TON", ControlID.DRM_CH_TONE, this.hats.tone.value, "metal bank tuning")}
                ${this.knob("DEC", ControlID.DRM_CH_DECAY, this.hats.chDecay.value)}
                ${this.knob("LVL", ControlID.DRM_CH_LEVEL, this.hats.chLevel.value)}
              </div>
              ${this.routeBtn("ch", this.hats.chRoute.value)}
            </div>
            <div class="hat-col">
              ${this.pad("OH", "oh")}
              ${this.noteSel("oh", this.hats.ohNote.value)}
              <div class="knobs">
                ${this.knob("TON", ControlID.DRM_OH_TONE, this.hats.ohTone.value, "metal bank tuning")}
                ${this.knob("DEC", ControlID.DRM_OH_DECAY, this.hats.ohDecay.value)}
                ${this.knob("LVL", ControlID.DRM_OH_LEVEL, this.hats.ohLevel.value)}
              </div>
              ${this.routeBtn("oh", this.hats.ohRoute.value)}
            </div>
          </div>
        </div>
        </div>

        <div class="row bottom">
        <div class="zone tom">
          ${this.pad("TOM", "tom")}
          ${this.noteSel("tom", this.tom.note.value, "receive note — ±2 play low / high")}
          <div class="knobs">
            ${this.knob("TUN", ControlID.DRM_TOM_TUNE, this.tom.tune.value)}
            ${this.knob("DEC", ControlID.DRM_TOM_DECAY, this.tom.decay.value)}
            ${this.knob("LVL", ControlID.DRM_TOM_LEVEL, this.tom.level.value)}
          </div>
          ${this.routeBtn("tom", this.tom.route.value)}
        </div>

        <div class="zone rim">
          ${this.pad("RIM", "rim")}
          ${this.noteSel("rim", this.rim.note.value)}
          <div class="knobs">
            ${this.knob("TUN", ControlID.DRM_RIM_TUNE, this.rim.tune.value)}
            ${this.knob("DEC", ControlID.DRM_RIM_DECAY, this.rim.decay.value)}
            ${this.knob("LVL", ControlID.DRM_RIM_LEVEL, this.rim.level.value)}
          </div>
          ${this.routeBtn("rim", this.rim.route.value)}
        </div>

        <div class="zone ride">
          ${this.pad("RIDE", "ride")}
          ${this.noteSel("ride", this.ride.note.value)}
          <div class="knobs">
            ${this.knob("TON", ControlID.DRM_RIDE_TONE, this.ride.tone.value)}
            ${this.knob("DEC", ControlID.DRM_RIDE_DECAY, this.ride.decay.value)}
            ${this.knob("LVL", ControlID.DRM_RIDE_LEVEL, this.ride.level.value)}
          </div>
          ${this.routeBtn("ride", this.ride.route.value)}
        </div>

        <div class="zone crash">
          ${this.pad("CRASH", "crash")}
          ${this.noteSel("crash", this.crash.note.value)}
          <div class="knobs">
            ${this.knob("TON", ControlID.DRM_CRASH_TONE, this.crash.tone.value)}
            ${this.knob("DEC", ControlID.DRM_CRASH_DECAY, this.crash.decay.value)}
            ${this.knob("LVL", ControlID.DRM_CRASH_LEVEL, this.crash.level.value)}
          </div>
          ${this.routeBtn("crash", this.crash.route.value)}
        </div>

        <div class="zone out">
          <label class="zone-label">OUT</label>
          <div class="knobs">
            ${this.knob("ACC", ControlID.DRM_ACCENT, this.out.accent.value, "velocity sensitivity")}
          </div>
        </div>
        </div>
      </div>
    `;
  }

  private pad(label: string, voice: DrumVoice) {
    return html`
      <button
        class=${classMap({ pad: true, lit: this.flashing.has(voice) })}
        title="trigger"
        @pointerdown=${() => this.controller.triggerVoice(voice)}
      >
        ${label}
      </button>
    `;
  }

  /** Separate-out toggle: lit = the voice plays on its own mixer strip.
   * A full board refuses — the shell reverts the state and this unlights. */
  private routeBtn(voice: DrumVoice, routed: number) {
    return html`
      <button
        class=${classMap({ "route-btn": true, on: routed > 0 })}
        title="route to its own mixer strip"
        @click=${() => this.controller.setVoiceRouting(voice, !(routed > 0))}
      >
        STRIP
      </button>
    `;
  }

  /** Receive-note stepper — a discrete selector, so an LCD, not a knob. */
  private noteSel(voice: DrumVoice, value: number, title = "receive note") {
    return html`
      <div class="note-sel" title=${title}>
        <button class="note-btn" @click=${() => this.controller.setVoiceNote(voice, value - 1)}>-</button>
        <lcd-element .text=${noteName(value)}></lcd-element>
        <button class="note-btn" @click=${() => this.controller.setVoiceNote(voice, value + 1)}>+</button>
      </div>
    `;
  }

  private knob(label: string, controlID: ControlID, value: number, title = "") {
    return html`
      <control-learn-wrapper .controlID=${controlID} title=${title}>
        <knob-element
          .value=${value}
          .range=${{ min: 0, max: 127 }}
          .step=${1}
          .label=${label}
          @change=${(e: CustomEvent) => this.controller.setControl(controlID, e.detail.value)}
        ></knob-element>
      </control-learn-wrapper>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --control-cursor-color: var(--drumlin-accent, #e8833a);
      --control-label-color: var(--light-secondary);
    }

    /* Nine zones in a fixed-width slot: two rows, compact-first. */
    .synth {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      background: var(--main-panel-color);
      border-radius: 0 0 0.5rem 0.5rem;
      padding: 1em;
      box-sizing: border-box;
    }
    .row {
      display: grid;
      gap: 0.5em;
      min-width: 0;
    }
    .row.top { grid-template-columns: 1fr 1fr 0.9fr 1.9fr; }
    .row.bottom { grid-template-columns: 1fr 1fr 1fr 1fr 0.5fr; }

    /* Neutral charcoal zones, one tint per voice — the camaïeu. */
    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6em;
      padding: 0.7em 0.5em;
      border-radius: 0.4rem;
    }
    .zone.kick { background: var(--drumlin-kick-panel-color, #2f2f31); }
    .zone.snare { background: var(--drumlin-snare-panel-color, #2f2f31); }
    .zone.clap { background: var(--drumlin-clap-panel-color, #2f2f31); }
    .zone.hats { background: var(--drumlin-hats-panel-color, #2f2f31); }
    .zone.tom { background: var(--drumlin-tom-panel-color, #2f2f31); }
    .zone.rim { background: var(--drumlin-rim-panel-color, #2f2f31); }
    .zone.ride { background: var(--drumlin-ride-panel-color, #2f2f31); }
    .zone.crash { background: var(--drumlin-crash-panel-color, #2f2f31); }
    .zone.out { background: var(--drumlin-out-panel-color, #2f2f31); }

    .zone-label {
      font-size: 0.7em;
      font-weight: bold;
      letter-spacing: 0.08em;
      color: var(--light-secondary);
      padding: 0.35em 0;
      border: 1px solid transparent; /* same box as a pad: labels share the baseline */
    }

    /* The pad: full-width name button, zone label and trigger in one. */
    .pad {
      width: 100%;
      padding: 0.35em 0;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.62em;
      font-weight: bold;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }
    .pad:hover { background: var(--medium); }
    .pad.lit {
      background: var(--drumlin-accent, #e8833a);
      border-color: var(--drumlin-accent, #e8833a);
      color: var(--darker);
      transition: none;
    }

    .knobs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.6em 0.8em;
      --knob-size: 34px;
      --control-label-font-size: 0.62em;
    }

    .hat-cols {
      display: flex;
      width: 100%;
      gap: 0.5em;
    }
    .hat-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6em;
    }
    /* Receive-note stepper: discrete choice → LCD, per the control idioms.
       The LCD's 120px default width would blow the zone's min-content — the
       token shrinks it to the zone instead. */
    .note-sel {
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 2px;
      width: 100%;
      height: 18px;
      --lcd-screen-width: 100%;
    }
    .note-sel lcd-element {
      flex: 1;
      min-width: 0;
    }
    .note-btn {
      width: 14px;
      border: none;
      border-radius: 2px;
      background: var(--dark-secondary);
      color: var(--light-secondary);
      font-size: 0.6em;
      padding: 0;
      cursor: pointer;
    }
    .note-btn:hover {
      background: var(--medium);
      color: var(--lighter);
    }

    /* Separate-out toggle: lit = the voice sits on its own mixer strip. */
    .route-btn {
      width: 100%;
      padding: 0.2em 0;
      border: 1px solid var(--dark-secondary);
      border-radius: 2px;
      background: transparent;
      color: var(--light-secondary);
      font-size: 0.55em;
      font-weight: bold;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }
    .route-btn:hover { background: var(--dark-secondary); }
    .route-btn.on {
      background: var(--drumlin-accent, #e8833a);
      border-color: var(--drumlin-accent, #e8833a);
      color: var(--darker);
    }
  `;
}
