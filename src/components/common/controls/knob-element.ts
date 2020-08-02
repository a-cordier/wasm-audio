import { LitElement, html, css, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";

import { createMidiController } from "../../../core/midi/midi-controller";
import {
  newMidiMessage,
  isControlChange,
} from "../../../core/midi/midi-message";
import { GlobalDispatcher } from "../../../core/dispatcher";
import { clamp } from "./clamp";

function scale(value: number, range: ValueRange, newRange: ValueRange): number {
  return Math.round(
    newRange.min +
      ((value - range.min) * (newRange.max - newRange.min)) /
        (range.max - range.min)
  );
}

const ANGLE_RANGE = {
  min: -135,
  max: 135,
};

const MIDI_RANGE = {
  min: 0,
  max: 127,
};

export interface ValueRange {
  min: number;
  max: number;
}

@customElement("knob-element")
export class Knob extends LitElement {
  @property({ type: Object })
  public range = MIDI_RANGE;

  @property({ type: Number })
  public value = 64;

  @property({ type: Number })
  public step = 1;

  @property({ type: Number })
  private angle = 0;

  @property({ type: String })
  private label: string;

  async connectedCallback() {
    super.connectedCallback();
    this.updateAngle();
  }

  toggleActive() {
    const drag = (event: DragEvent) => {
      event.preventDefault();
      this.updateValue(this.computeStep(-event.movementY, event.altKey));
    };

    const destroy = () => {
      document.removeEventListener("mouseup", destroy);
      document.removeEventListener("mousemove", drag);
    };

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", destroy);
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    this.updateValue(this.computeStep(event.deltaY, event.altKey));
  }

  updateAngle() {
    this.angle = scale(this.value, this.range, ANGLE_RANGE);
  }

  updateValue(step) {
    this.value = clamp(this.range, this.value + step);
  }

  computeStep(increment, sharp = false) {
    return this.computeStepMultiplier(increment, sharp) * this.step;
  }

  computeStepMultiplier(increment, sharp = false) {
    const multiplier = increment < 0 ? -1 : 1;
    return sharp ? multiplier * 0.25 : multiplier;
  }

  updated(changedProperties) {
    if (changedProperties.get("value")) {
      this.updateAngle();
      this.dispatchEvent(
        new CustomEvent("change", { detail: { value: this.value } })
      );
    }
  }

  render() {
    return html`
      <div class="knob-wrapper" class="knob-wrapper">
        <svg
          class="knob"
          shape-rendering="geometricPrecision"
          version="1.1"
          viewBox="0 0 500 500.00012"
          @mousedown="${this.toggleActive}"
          @wheel="${this.onWheel}"
        >
          <circle class="knob__background" r="250" cy="250" cx="250" />

          <g transform="rotate(${this.angle}, 250, 250)">
            <path
              class="knob__handle"
              d="M 249.52539,5.6313593e-5 A 250,250 0 0 0 
                    206.31836,3.8477125 60,60 0 0 1 146.44141,60.005915 
                    60,60 0 0 1 106.82227,45.062556 250,250 0 0 0 
                    45.056641,106.83209 60,60 0 0 1 60,146.45318 60,60 
                    0 0 1 3.84375,206.33014 250,250 0 0 0 0,250.00006 
                    250,250 0 0 0 3.8457031,293.6817 60,60 0 0 1 60.005859,353.55865 
                    60,60 0 0 1 45.0625,393.17779 a 250,250 0 0 0 61.76953,61.76563 
                    60,60 0 0 1 39.62109,-14.94336 60,60 0 0 1 59.87696,56.15625 250,
                    250 0 0 0 43.66992,3.84375 250,250 0 0 0 43.68164,-3.8457 60,60 
                    0 0 1 59.87695,-56.16016 60,60 0 0 1 39.61914,14.94336 250,250 
                    0 0 0 61.76563,-61.76953 A 60,60 0 0 1 440,353.54694 60,60 0 0 1 
                    496.15625,293.66998 250,250 0 0 0 500,250.00006 250,250 0 0 0 
                    496.1543,206.31842 60,60 0 0 1 439.99414,146.44147 60,60 0 0 1 
                    454.9375,106.82233 250,250 0 0 0 393.41992,45.232478 60,60 0 0 1 
                    354,60.000056 60,60 0 0 1 294.12891,3.9258375 250,250 0 0 0 
                    250,5.6313593e-5 a 250,250 0 0 0 -0.47461,0 z"
            />

            <path
              class="knob__cursor"
              id="path837-1"
              d="M 249.37207,1.108327e-4 A 250,273.78195 0 0 0 
                    244.34472,0.06636606 V 53.60947 h 11.31055 V 0.07497377 a 
                    250,273.78195 0 0 0 -5.80859,-0.07490674242 250,273.78195 
                    0 0 0 -0.47461,0 z"
            />

            <circle class="knob__top" r="150" cy="250" cx="250" />
          </g>
        </svg>
        <div class="label">${this.label}</div>
      </div>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      :host {
        user-select: none;
        outline: none;
      }

      .knob-wrapper {
        position: relative;
        max-width: var(--knob-size, 100px);
      }

      .knob {
        height: var(--knob-size, 100px);
        width: var(--knob-size, 100px);
        cursor: pointer;
      }

      .knob__background {
        fill: transparent;
      }

      .knob__handle {
        fill: var(--control-handle-color, #ccc);
      }

      .knob__top {
        fill: var(--control-top-color, #ccc);
      }

      .knob__cursor {
        fill: var(--control-cursor-color, #ccc);
      }

      .label {
        font-size: 0.8em;
        color: var(--lighter-color);
        display: flex;
        justify-content: center;
      }
    `;
  }
}
