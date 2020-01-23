import { LitElement, html, css, customElement, property } from 'lit-element';
import { classMap } from "lit-html/directives/class-map";

import "./sine-wave-icon";
import "./square-wave-icon";
import "./sawtooth-wave-icon";
import "./triangle-wave-icon";

const wave = Object.freeze({
    sine: "sine",
    sawtooth: "sawtooth",
    square: "square",
    triangle: "triangle"
});

@customElement('wave-selector-element')
export class WaveSelector extends LitElement {
    @property({ type: String })
    public wave = wave.sine;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    async onSawSelect() {
        this.wave = wave.sawtooth;
        this.dispatchSelect();
    }

    async onSquareSelect() {
        this.wave = wave.square;
        this.dispatchSelect();
    }

    async onSineSelect() {
        this.wave = wave.sine;
        this.dispatchSelect();
    }

    async onTriangleSelect() {
        this.wave = wave.triangle;
        this.dispatchSelect();
    }

    dispatchSelect() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.wave } }));
    }

    render() {
        return html` 
            <div class="wave-selector">
                <button class="${this.computeButtonClasses(wave.sawtooth)}" @click=${this.onSawSelect}><saw-wave-icon class="icon"></saw-wave-icon></button>
                <button class="${this.computeButtonClasses(wave.square)}" @click=${this.onSquareSelect}><square-wave-icon class="icon"></square-wave-icon></button>
                <button class="${this.computeButtonClasses(wave.triangle)}" @click=${this.onTriangleSelect}><triangle-wave-icon class="icon"></triangle-wave-icon></button>
                <button class="${this.computeButtonClasses(wave.sine)}" @click=${this.onSineSelect}><sine-wave-icon class="icon"></sine-wave-icon></button>
            </div>    
        `
    }

    computeButtonClasses(wave) {
        return classMap({
            active: wave === this.wave
        })
    }

    static get styles() {
        // noinspection CssUnresolvedCustomProperty
        return css`
            .waveform-selector {
                    width: 180px;
                    display: flex;
                    justify-content: space-evenly;
            }

            button {
                width: var(--button-width, 30px);
                height: var(--button-height, 30px);
                font-size: var(--button-font-size, 1.5em);

                background-color: var(--lighter-color);
                border: 1px solid var(--light-color, #ccc);
                border-radius: 50%;
                box-shadow: 0px 1px 1px 1px  var(--control-background-color, #ccc);
                transition: all 0.1s ease-in-out;

                display: inline-flex;
                align-items: center;

                cursor: pointer;
            }

            button .icon {
                margin-top: -2px;
            }

            button:focus { 
                outline: none; 
            }

            button.active {
                background-color: #fff;
            }
        `
    }
}