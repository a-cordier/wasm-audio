import { LitElement, html, css, customElement, property } from "lit-element";
import { FilterMode } from "../types/filter-mode";
import { FilterEvent } from "../types/filter-event";
import "./wrapper-element";
import "./knob-element";
import "./filter-selector-element";

interface FilterState {
  mode: FilterMode;
  cutoff: number;
  resonance: number;
}

@customElement("filter-element")
export class Filter extends LitElement {
  @property({ type: Boolean })
  private shouldMidiLearn = false;

  @property({ type: Object })
  private state: FilterState = {
    mode: FilterMode.LOWPASS,
    cutoff: 0,
    resonance: 0,
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onCutoffChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.CUTOFF, event.detail.value);
  }

  onResonanceChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.RESONANCE, event.detail.value);
  }

  onTypeChange(event: CustomEvent) {
    this.dispatchChange(FilterEvent.MODE, event.detail.value);
  }

  dispatchChange(type: FilterEvent, value: number) {
    this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
  }

  render() {
    return html`
      <wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode}
              @change=${this.onTypeChange}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="cutoff-control">
                <knob-element
                  .value=${this.state.cutoff}
                  @change=${this.onCutoffChange}
                ></knob-element>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="resonance-control">
                <knob-element
                  .value=${this.state.resonance}
                  @change=${this.onResonanceChange}
                ></knob-element>
              </div>
              <label>reson.</label>
            </div>
          </div>
        </div>
      </wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      .filter-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        width: 100%;
      }

      .filter-controls .mode-control {
        width: 100%;
        display: block;
      }

      .filter-controls .frequency-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;

        margin-top: 1em;
      }

      .frequency-controls .frequency-control {
        width: 50%;
        height: 90%;
        --knob-size: 50px;

        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .frequency-control .cutoff-control {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      label {
        display: block;
        color: white;
        font-size: 0.8em;
      }
    `;
  }
}
