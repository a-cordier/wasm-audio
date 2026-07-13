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
import "../../../components/common/controls/keys-element";
import "../../../components/common/controls/control-learn-wrapper";
import "../../../components/common/panel-wrapper-element";
import "../../../components/common/row-element";
import "../../poly-ticks/ui/panels/oscillator/wave-selector-element";

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
    return html`
      <panel-wrapper-element label="OSC" style="--panel-wrapper-background-color: var(--monolog-osc-panel-color)">
        <div class="knob-row">
          <wave-selector-element
            .value=${this.oscState.mode.value}
            @change=${(e: CustomEvent) => this.controller.setOscMode(e.detail.value)}
          ></wave-selector-element>
          <control-learn-wrapper .controlID=${ControlID.ML_SUB_LEVEL}>
            <knob-element .value=${this.oscState.subLevel.value} .label=${"SUB"}
              @change=${(e: CustomEvent) => this.controller.setSubLevel(e.detail.value)}></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderFilterPanel() {
    if (!this.filterState) return nothing;
    return html`
      <panel-wrapper-element label="FILTER" style="--panel-wrapper-background-color: var(--monolog-filter-panel-color)">
        <div class="knob-row">
          <control-learn-wrapper .controlID=${ControlID.ML_CUTOFF}>
            <knob-element .value=${this.filterState.cutoff.value} .label=${"CUTOFF"}
              @change=${(e: CustomEvent) => this.controller.setCutoff(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_RESONANCE}>
            <knob-element .value=${this.filterState.resonance.value} .label=${"RES"}
              @change=${(e: CustomEvent) => this.controller.setResonance(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_DRIVE}>
            <knob-element .value=${this.filterState.drive.value} .label=${"DRIVE"}
              @change=${(e: CustomEvent) => this.controller.setDrive(e.detail.value)}></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderAmpEnvPanel() {
    if (!this.ampEnvState) return nothing;
    return html`
      <panel-wrapper-element label="AMP" style="--panel-wrapper-background-color: var(--monolog-env-panel-color)">
        <div class="knob-row">
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_ATTACK}>
            <knob-element .value=${this.ampEnvState.attack.value} .label=${"A"}
              @change=${(e: CustomEvent) => this.controller.setAmpAttack(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_DECAY}>
            <knob-element .value=${this.ampEnvState.decay.value} .label=${"D"}
              @change=${(e: CustomEvent) => this.controller.setAmpDecay(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_AMP_SUSTAIN}>
            <knob-element .value=${this.ampEnvState.sustain.value} .label=${"S"}
              @change=${(e: CustomEvent) => this.controller.setAmpSustain(e.detail.value)}></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderFilterEnvPanel() {
    if (!this.filterEnvState) return nothing;
    return html`
      <panel-wrapper-element label="FILTER ENV" style="--panel-wrapper-background-color: var(--monolog-env-panel-color)">
        <div class="knob-row">
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_ATTACK}>
            <knob-element .value=${this.filterEnvState.attack.value} .label=${"A"}
              @change=${(e: CustomEvent) => this.controller.setFilterAttack(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_DECAY}>
            <knob-element .value=${this.filterEnvState.decay.value} .label=${"D"}
              @change=${(e: CustomEvent) => this.controller.setFilterDecay(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_AMOUNT}>
            <knob-element .value=${this.filterEnvState.amount.value} .label=${"AMT"}
              @change=${(e: CustomEvent) => this.controller.setFilterAmount(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_FLT_VELOCITY}>
            <knob-element .value=${this.filterEnvState.velocity.value} .label=${"VEL"}
              @change=${(e: CustomEvent) => this.controller.setFilterVelocity(e.detail.value)}></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderLfoPanel() {
    if (!this.lfoState) return nothing;
    const dest = this.lfoState.destination.value;
    return html`
      <panel-wrapper-element label="LFO" style="--panel-wrapper-background-color: var(--monolog-lfo-panel-color)">
        <div class="knob-row">
          <div class="dest-group">
            <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.PITCH })}
              @click=${() => this.controller.setLfoDestination(MonologLfoDestination.PITCH)}>PIT</button>
            <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.CUTOFF })}
              @click=${() => this.controller.setLfoDestination(MonologLfoDestination.CUTOFF)}>CUT</button>
            <button class=${classMap({ "dest-btn": true, active: dest === MonologLfoDestination.PULSE_WIDTH })}
              @click=${() => this.controller.setLfoDestination(MonologLfoDestination.PULSE_WIDTH)}>PW</button>
          </div>
          <control-learn-wrapper .controlID=${ControlID.ML_LFO_RATE}>
            <knob-element .value=${this.lfoState.rate.value} .label=${"RATE"}
              @change=${(e: CustomEvent) => this.controller.setLfoRate(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${ControlID.ML_LFO_AMOUNT}>
            <knob-element .value=${this.lfoState.amount.value} .label=${"AMT"}
              @change=${(e: CustomEvent) => this.controller.setLfoAmount(e.detail.value)}></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `;
  }

  private renderPerformancePanel() {
    if (!this.perfState) return nothing;
    const legatoActive = (this.perfState.legato.value ?? 0) >= 64;
    return html`
      <panel-wrapper-element label="PERF" style="--panel-wrapper-background-color: var(--monolog-perf-panel-color)">
        <div class="knob-row">
          <control-learn-wrapper .controlID=${ControlID.ML_GLIDE}>
            <knob-element .value=${this.perfState.glide.value} .label=${"GLIDE"}
              @change=${(e: CustomEvent) => this.controller.setGlide(e.detail.value)}></knob-element>
          </control-learn-wrapper>
          <div class="legato-toggle">
            <label class="toggle-label">LEGATO</label>
            <button
              class=${classMap({ "toggle-btn": true, active: legatoActive })}
              @click=${() => this.controller.setLegato(legatoActive ? 0 : 127)}
            >${legatoActive ? "ON" : "OFF"}</button>
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
        --knob-size: var(--control-size-sm);
        --control-label-color: #939597;
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
        grid-template-columns: 4fr 5fr 4fr;
      }

      .panels-row.mod {
        grid-template-columns: 5fr 5fr 3fr;
      }

      .knob-row {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        gap: 0.5em;
        width: 100%;
      }

      .dest-group {
        display: flex;
        gap: 2px;
        margin-bottom: 0.8em;
      }

      .dest-btn {
        font-size: 0.55em;
        font-weight: 700;
        padding: 2px 8px;
        background: #4a4a4a;
        color: #939597;
        border: 1px solid #5a5a5a;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: background 0.15s, color 0.15s;
      }

      .dest-btn.active {
        background: #2a2a2a;
        color: var(--monolog-accent, #F5DF4D);
        border-color: var(--monolog-accent, #F5DF4D);
      }

      .legato-toggle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3em;
      }

      .toggle-label {
        font-size: var(--control-label-font-size, 0.8em);
        color: #939597;
      }

      .toggle-btn {
        font-size: 0.6em;
        font-weight: 700;
        padding: 4px 12px;
        background: #4a4a4a;
        color: #939597;
        border: 1px solid #5a5a5a;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: background 0.15s, color 0.15s;
      }

      .toggle-btn.active {
        background: #2a2a2a;
        color: var(--monolog-accent, #F5DF4D);
        border-color: var(--monolog-accent, #F5DF4D);
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
