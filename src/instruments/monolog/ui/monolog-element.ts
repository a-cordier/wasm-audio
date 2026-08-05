import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { MonologController } from "../monolog-controller";
import { MonologState } from "../types/monolog-state";
import { MonologEvent } from "../types/monolog-event";
import { MonologLfoDestination } from "../types/lfo-destination";
import { ControlID } from "../../../control/types";
import { MidiBus } from "../../../midi/bus/bus";
import { Channel } from "../../../midi/types";
import type { Plugin } from "../../../core/types";

import "../../../components/common/controls/knob-element";
import "../../../components/common/controls/fader-element";
import "../../../components/common/controls/keys-element";
import "../../../components/common/controls/control-learn-wrapper";
import "../../../components/common/panel-wrapper-element";
import "../../../components/common/row-element";
import "../../poly-ticks/ui/panels/oscillator/wave-selector-element";
import { OscillatorMode } from "../../poly-ticks/types/oscillator-mode";
import "./filter-model-selector-element";

@customElement("monolog-element")
export class MonologElement extends LitElement {
  private oscState: MonologState["osc"] | null = null;
  private filterState: MonologState["filter"] | null = null;
  private ampEnvState: MonologState["ampEnv"] | null = null;
  private filterEnvState: MonologState["filterEnv"] | null = null;
  private lfoState: MonologState["lfo"] | null = null;
  private perfState: MonologState["performance"] | null = null;

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

  private get controller(): MonologController {
    return this.plugin as MonologController;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.plugin || !this.audioContext) return;
    const s = this.controller.getState();
    this.oscState = s.osc;
    this.filterState = s.filter;
    this.ampEnvState = s.ampEnv;
    this.filterEnvState = s.filterEnv;
    this.lfoState = s.lfo;
    this.perfState = s.performance;
    this.registerHandlers();
  }

  private scheduleKeyUpdate() {
    if (this._pendingKeyUpdate) return;
    this._pendingKeyUpdate = true;
    requestAnimationFrame(() => {
      this._pendingKeyUpdate = false;
      this.pressedKeys = new Set(this.pressedKeys);
    });
  }

  private registerHandlers() {
    this.controller
      .subscribe(MonologEvent.NOTE_ON, (d) => {
        this.pressedKeys.add(d.midiValue);
        this.scheduleKeyUpdate();
      })
      .subscribe(MonologEvent.NOTE_OFF, (d) => {
        this.pressedKeys.delete(d.midiValue);
        this.scheduleKeyUpdate();
      })
      .subscribe(MonologEvent.OSC, (s) => { this.oscState = s; this.requestUpdate(); })
      .subscribe(MonologEvent.FILTER, (s) => { this.filterState = s; this.requestUpdate(); })
      .subscribe(MonologEvent.AMP_ENV, (s) => { this.ampEnvState = s; this.requestUpdate(); })
      .subscribe(MonologEvent.FILTER_ENV, (s) => { this.filterEnvState = s; this.requestUpdate(); })
      .subscribe(MonologEvent.LFO, (s) => { this.lfoState = s; this.requestUpdate(); })
      .subscribe(MonologEvent.PERFORMANCE, (s) => { this.perfState = s; this.requestUpdate(); });
  }

  private get resolvedChannel(): Channel {
    return this.midiChannel === "omni" ? (0 as Channel) : this.midiChannel;
  }

  render() {
    return html`
      <div class="monolog">
        <row-element label="Sound">
          <div class="panels-row sound">
            ${this.renderOscPanel()}
            ${this.renderFilterPanel()}
            ${this.renderAmpEnvPanel()}
          </div>
        </row-element>
        <row-element label="Modulation">
          <div class="panels-row mod">
            ${this.renderFilterEnvPanel()}
            ${this.renderLfoPanel()}
            ${this.renderPerformancePanel()}
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
                  .lowerKey=${24}
                  .higherKey=${48}
                ></keys-element>
              </div>
            </panel-wrapper-element>
          </div>
        </row-element>
      </div>
    `;
  }

  private renderOscPanel() {
    if (!this.oscState) return nothing;
    const subOctaveLow = (this.oscState.subOctave.value ?? 0) < 64;
    return html`
      <panel-wrapper-element label="OSC" style="--panel-wrapper-background-color: var(--monolog-osc-panel-color)">
        <div class="panel-stack">
          <div class="knob-row">
            <div class="toggle-group">
              <wave-selector-element
                .value=${this.oscState.mode.value}
                .modes=${[OscillatorMode.SAWTOOTH, OscillatorMode.SQUARE, OscillatorMode.TRIANGLE]}
                @change=${(e: CustomEvent) => this.controller.setOscMode(e.detail.value)}
              ></wave-selector-element>
              <span class="toggle-label">WAVEFORM</span>
            </div>
            <control-learn-wrapper .controlID=${ControlID.ML_DETUNE}>
              <knob-element .value=${this.oscState.detune.value} .label=${"DETUNE"}
                @change=${(e: CustomEvent) => this.controller.setDetune(e.detail.value)}></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.ML_PW}>
              <knob-element .value=${this.oscState.pulseWidth.value} .label=${"PW"}
                @change=${(e: CustomEvent) => this.controller.setPulseWidth(e.detail.value)}></knob-element>
            </control-learn-wrapper>
          </div>
          <div class="knob-row sub-row">
            <div class="toggle-group">
              <wave-selector-element
                .value=${this.oscState.subWave.value}
                .modes=${[OscillatorMode.SQUARE, OscillatorMode.SAWTOOTH, OscillatorMode.SINE]}
                @change=${(e: CustomEvent) => this.controller.setSubWave(e.detail.value)}
              ></wave-selector-element>
              <span class="toggle-label">SUB WAVE</span>
            </div>
            <div class="toggle-group">
              <button
                class=${classMap({ "toggle-btn": true, active: !subOctaveLow })}
                @click=${() => this.controller.setSubOctave(subOctaveLow ? 127 : 0)}
              >${subOctaveLow ? "-1" : "-2"}</button>
              <span class="toggle-label">OCT</span>
            </div>
            <control-learn-wrapper .controlID=${ControlID.ML_SUB_LEVEL}>
              <knob-element .value=${this.oscState.subLevel.value} .label=${"SUB"}
                @change=${(e: CustomEvent) => this.controller.setSubLevel(e.detail.value)}></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.ML_NOISE_LEVEL}>
              <knob-element .value=${this.oscState.noiseLevel.value} .label=${"NOISE"}
                @change=${(e: CustomEvent) => this.controller.setNoiseLevel(e.detail.value)}></knob-element>
            </control-learn-wrapper>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderFilterPanel() {
    if (!this.filterState) return nothing;
    return html`
      <panel-wrapper-element label="FILTER" style="--panel-wrapper-background-color: var(--monolog-filter-panel-color)">
        <div class="panel-stack">
          <filter-model-selector-element
            .value=${this.filterState.model.value}
            @change=${(e: CustomEvent) => this.controller.setFilterModel(e.detail.value)}
          ></filter-model-selector-element>
          <div class="filter-knobs">
            <div class="fk">
              <div class="fk-knob filter-cutoff">
                <control-learn-wrapper .controlID=${ControlID.ML_CUTOFF}>
                  <knob-element .value=${this.filterState.cutoff.value}
                    @change=${(e: CustomEvent) => this.controller.setCutoff(e.detail.value)}></knob-element>
                </control-learn-wrapper>
              </div>
              <label>CUTOFF</label>
            </div>
            <div class="fk">
              <div class="fk-knob filter-res">
                <control-learn-wrapper .controlID=${ControlID.ML_RESONANCE}>
                  <knob-element .value=${this.filterState.resonance.value}
                    @change=${(e: CustomEvent) => this.controller.setResonance(e.detail.value)}></knob-element>
                </control-learn-wrapper>
              </div>
              <label>RES</label>
            </div>
            <div class="fk">
              <div class="fk-knob filter-drive">
                <control-learn-wrapper .controlID=${ControlID.ML_DRIVE}>
                  <knob-element .value=${this.filterState.drive.value}
                    @change=${(e: CustomEvent) => this.controller.setDrive(e.detail.value)}></knob-element>
                </control-learn-wrapper>
              </div>
              <label>DRIVE</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderAmpEnvPanel() {
    if (!this.ampEnvState) return nothing;
    return html`
      <panel-wrapper-element label="AMP" style="--panel-wrapper-background-color: var(--monolog-env-panel-color)">
        <div class="fader-row">
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_ATTACK}>
            <fader-element .value=${this.ampEnvState.attack.value} .label=${"A"}
              @change=${(e: CustomEvent) => this.controller.setAmpAttack(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_DECAY}>
            <fader-element .value=${this.ampEnvState.decay.value} .label=${"D"}
              @change=${(e: CustomEvent) => this.controller.setAmpDecay(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_SUSTAIN}>
            <fader-element .value=${this.ampEnvState.sustain.value} .label=${"S"}
              @change=${(e: CustomEvent) => this.controller.setAmpSustain(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_RELEASE}>
            <fader-element .value=${this.ampEnvState.release.value} .label=${"R"}
              @change=${(e: CustomEvent) => this.controller.setAmpRelease(e.detail.value)}></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderFilterEnvPanel() {
    if (!this.filterEnvState) return nothing;
    return html`
      <panel-wrapper-element label="MOD" style="--panel-wrapper-background-color: var(--monolog-env-panel-color)">
        <div class="fader-row">
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_ATTACK}>
            <fader-element .value=${this.filterEnvState.attack.value} .label=${"A"}
              @change=${(e: CustomEvent) => this.controller.setFilterAttack(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_DECAY}>
            <fader-element .value=${this.filterEnvState.decay.value} .label=${"D"}
              @change=${(e: CustomEvent) => this.controller.setFilterDecay(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_AMOUNT}>
            <fader-element .value=${this.filterEnvState.amount.value} .label=${"AMT"}
              @change=${(e: CustomEvent) => this.controller.setFilterAmount(e.detail.value)}></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_VELOCITY}>
            <fader-element .value=${this.filterEnvState.velocity.value} .label=${"VEL"}
              @change=${(e: CustomEvent) => this.controller.setFilterVelocity(e.detail.value)}></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderLfoPanel() {
    if (!this.lfoState) return nothing;
    const dest = this.lfoState.destination.value;
    const keySyncOn = (this.lfoState.keySync.value ?? 127) >= 64;
    return html`
      <panel-wrapper-element label="LFO" style="--panel-wrapper-background-color: var(--monolog-lfo-panel-color)">
        <div class="panel-stack lfo-stack">
          <div class="knob-row">
            <div class="dest-group">
              <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.PITCH })}
                @click=${() => this.controller.setLfoDestination(MonologLfoDestination.PITCH)}>PITCH</button>
              <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.CUTOFF })}
                @click=${() => this.controller.setLfoDestination(MonologLfoDestination.CUTOFF)}>CUT</button>
              <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.PULSE_WIDTH })}
                @click=${() => this.controller.setLfoDestination(MonologLfoDestination.PULSE_WIDTH)}>PW</button>
            </div>
            <button
              class=${classMap({ "toggle-btn": true, active: keySyncOn })}
              @click=${() => this.controller.setLfoKeySync(keySyncOn ? 0 : 127)}
            >${keySyncOn ? "SYNC" : "FREE"}</button>
          </div>
          <div class="knob-row">
            <control-learn-wrapper .controlID=${ControlID.ML_LFO_RATE}>
              <knob-element .value=${this.lfoState.rate.value} .label=${"RATE"}
                @change=${(e: CustomEvent) => this.controller.setLfoRate(e.detail.value)}></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.ML_LFO_AMOUNT}>
              <knob-element .value=${this.lfoState.amount.value} .label=${"AMT"}
                @change=${(e: CustomEvent) => this.controller.setLfoAmount(e.detail.value)}></knob-element>
            </control-learn-wrapper>
            <control-learn-wrapper .controlID=${ControlID.ML_LFO_DELAY}>
              <knob-element .value=${this.lfoState.delay.value} .label=${"DELAY"}
                @change=${(e: CustomEvent) => this.controller.setLfoDelay(e.detail.value)}></knob-element>
            </control-learn-wrapper>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderPerformancePanel() {
    if (!this.perfState) return nothing;
    const legatoActive = (this.perfState.legato.value ?? 0) >= 64;
    return html`
      <panel-wrapper-element label="EXP" style="--panel-wrapper-background-color: var(--monolog-perf-panel-color)">
        <div class="knob-row">
          <control-learn-wrapper .controlID=${ControlID.ML_GLIDE}>
            <knob-element .value=${this.perfState.glide.value} .label=${"GLIDE"}
              @change=${(e: CustomEvent) => this.controller.setGlide(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_ACCENT}>
            <knob-element .value=${this.perfState.accent.value} .label=${"ACC"}
              @change=${(e: CustomEvent) => this.controller.setAccent(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_DIRT}>
            <knob-element .value=${this.perfState.dirt.value} .label=${"DIRT"}
              @change=${(e: CustomEvent) => this.controller.setDirt(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <div class="toggle-group leg-group">
            <button
              class=${classMap({ "toggle-btn": true, active: legatoActive })}
              @click=${() => this.controller.setLegato(legatoActive ? 0 : 127)}
            >LEG</button>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    return css`
      .monolog {
        width: 100%;
        background-color: var(--monolog-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1.5em;
        box-sizing: border-box;
        --knob-size: 26px;
        --control-label-color: #939597;
        --control-label-font-size: 0.7em;
        --panel-wrapper-label-color: var(--monolog-accent, #F5DF4D);
        --control-cursor-color: var(--monolog-accent, #F5DF4D);
      }

      .panels-row {
        display: grid;
        gap: 0.5rem;
        align-items: stretch;
        grid-auto-rows: 1fr;
      }

      .panels-row > * {
        min-width: 0;
      }

      .panels-row.sound {
        grid-template-columns: 5fr 5fr 3fr;
      }

      .panels-row.mod {
        grid-template-columns: 4fr 5fr 4fr;
      }

      .knob-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-evenly;
        gap: 0.5em;
        width: 100%;
      }

      /* Two-row panels (OSC, FILTER): a selector/first row stacked over a
         controls row, so a panel can hold more than one row fits across. */
      .panel-stack {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.6em;
        width: 100%;
      }

      /* Asymmetric filter knobs (poly-ticks style): the three differ in size,
         but every knob is vertically centred on a shared line while the labels
         sit on one baseline below — each knob is centred in a flexible band
         above a fixed label row, and the row stretches all bands to equal
         height. */
      /* Space between the panel title and the type buttons. */
      .panel-stack > filter-model-selector-element {
        margin-top: 0.7em;
      }

      .filter-knobs {
        display: flex;
        justify-content: space-evenly;
        align-items: stretch;
        width: 100%;
      }

      .fk {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* Band height = the largest knob, so knobs centre on one line and labels
         sit just below (a compact knob-to-label gap) rather than the band
         stretching to fill the panel. */
      .fk-knob {
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .fk label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
        text-align: center;
        margin-top: 0.2em;
      }

      .filter-cutoff { --knob-size: 46px; }
      .filter-res { --knob-size: 34px; }
      .filter-drive { --knob-size: 28px; }

      /* AMP envelope uses faders (poly-ticks style) instead of knobs. */
      .fader-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-evenly;
        gap: 0.4em;
        width: 100%;
        --fader-width: 26px;
        --fader-height: 72px;
      }

      .toggle-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4em;
      }

      /* LEGATO has no label of its own: make the LEG button span the full cell
         height (knob + label) so it reads as a deliberate switch filling its
         column rather than a small floating button. */
      .leg-group {
        align-self: stretch;
      }

      .leg-group .toggle-btn {
        height: 100%;
      }

      .toggle-label {
        font-size: var(--control-label-font-size, 0.8em);
        color: #939597;
      }

      wave-selector-element,
      filter-model-selector-element {
        --button-border-radius: 2px;
        --button-width: auto;
        --button-height: 18px;
        --button-font-size: 0.55em;
        --button-padding: 0 8px;
        --icon-size: 10px;
        --button-disposed-background-color: #4a4a4a;
        --button-disposed-label-color: #939597;
        --button-border-color: #5a5a5a;
        --button-active-background-color: #2a2a2a;
        --button-active-label-color: var(--monolog-accent, #F5DF4D);
        --button-active-border-color: var(--monolog-accent, #F5DF4D);
        width: auto;
      }

      .dest-group {
        display: flex;
        gap: 2px;
      }

      .dest-btn {
        height: 18px;
        font-size: 0.55em;
        font-weight: 700;
        padding: 0 8px;
        background: #4a4a4a;
        color: #939597;
        border: 1px solid #5a5a5a;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: background 0.15s, color 0.15s;
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
      }

      .dest-btn.active {
        background: #2a2a2a;
        color: var(--monolog-accent, #F5DF4D);
        border-color: var(--monolog-accent, #F5DF4D);
      }

      .toggle-btn {
        height: 18px;
        font-size: 0.55em;
        font-weight: 700;
        padding: 0 8px;
        background: #4a4a4a;
        color: #939597;
        border: 1px solid #5a5a5a;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: background 0.15s, color 0.15s;
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
      }

      .toggle-btn.active {
        background: #2a2a2a;
        color: var(--monolog-accent, #F5DF4D);
        border-color: var(--monolog-accent, #F5DF4D);
      }

      /* LFO: label-less buttons, sized up a touch, with roomier knobs using the
         space freed by dropping the button labels. */
      .lfo-stack {
        --knob-size: 32px;
      }

      .lfo-stack .dest-btn,
      .lfo-stack .toggle-btn {
        height: 24px;
        font-size: 0.6em;
      }

      .keyboard {
        --key-height: 80px;
        --panel-wrapper-background-color: #2e2e2e;
      }

      row-element + row-element {
        margin-top: 0.5em;
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
        .monolog { padding: 0.75em; }
        .keyboard { --key-height: 50px; }

        .panels-row.sound,
        .panels-row.mod {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 400px) {
        .panels-row.sound,
        .panels-row.mod {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
