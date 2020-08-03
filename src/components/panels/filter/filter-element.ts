import { LitElement, html, css, customElement, property } from "lit-element";
import { FilterEvent } from "../../../types/filter-event";

import "../panel-wrapper-element";
import "../../common/controls/midi-control-wrapper";
import "../../common/controls/knob-element";
import "./filter-selector-element";
import { MidiControlID } from "../../../types/midi-learn-options";

@customElement("filter-element")
export class Filter extends LitElement {
  @property({ type: Object })
  private state: any;

  @property({ type: Number })
  private currentLearnerID = MidiControlID.NONE;

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
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${this.onTypeChange}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="cutoff-control">
                <midi-control-wrapper
                  controlID=${MidiControlID.CUTOFF}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    label="cutoff"
                    .value=${this.state.cutoff.value}
                    @change=${this.onCutoffChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
            </div>
            <div class="frequency-control">
              <div class="resonance-control">
                <midi-control-wrapper
                  controlID=${MidiControlID.RESONANCE}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    label="reson."
                    .value=${this.state.resonance.value}
                    @change=${this.onResonanceChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        --panel-wrapper-background-color: #334452;
      }

      .filter-controls {
        width: 160px;
        height: 130px;
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
