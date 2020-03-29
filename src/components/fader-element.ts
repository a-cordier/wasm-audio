import { LitElement, html, css, customElement, property } from 'lit-element';

function scale(value: number, range: ValueRange, newRange: ValueRange): number {
    return Math.round(newRange.min + (value - range.min) * (newRange.max - newRange.min) / (range.max - range.min));
}

const POSITION_RANGE = {
    min: 225,
    max: -225,
};

const MIDI_RANGE = {
    min: 0,
    max: 127
};

export interface ValueRange {
    min: number,
    max: number
}

@customElement('fader-element')
export class Fader extends LitElement {
    @property({ type: Object })
    public range = MIDI_RANGE;

    @property({ type: Number })
    public value = 0;

    @property({ type: Number })
    public step = 1;

    @property({ type: Number })
    private position = 0;

    constructor() {
        super();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.updatePosition();
    }

    toggleActive() {
        const drag = (event: DragEvent) => {
            event.preventDefault();
            this.updateValue(-event.movementY);
        };

        const destroy = () => {
            document.removeEventListener('mouseup', destroy);
            document.removeEventListener('mousemove', drag);
        };

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', destroy);
    }

    onWheel(event: WheelEvent) {
        event.preventDefault();
        this.updateValue(event.deltaY);
    }

    updatePosition() {
        this.position = scale(this.value, this.range, POSITION_RANGE);
    }

    updateValue(increment) {
        if (increment < 0 && this.value > this.range.min) {
            this.value -= this.step;
        }
        if (increment > 0 && this.value < this.range.max) {
            this.value += this.step;
        }
    }

    updated(changedProperties) {
        if (changedProperties.get('value')) {
            this.updatePosition();
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
        }
    }

    render() {
        return html` 
            <svg class="fader"
               viewBox="0 0 100 500"
               version="1.1"
               @mousedown="${this.toggleActive}"
               @wheel="${this.onWheel}">
              <g>
                <rect class="fader__background"
                   y="0"
                   x="0"
                   height="500"
                   width="100"/>
                <rect class="fader__slide"
                   y="0"
                   x="45"
                   height="500"
                   width="10"/>
                <g transform="translate(0, ${this.position})">
                  <rect class="fader__handle"
                     width="100"
                     height="50"
                     x="0"
                     y="225" />
                  <rect class="fader__cursor"
                     width="100"
                     height="5"
                     x="0"
                     y="247.5" />
                </g>
              </g>
            </svg>
        `
    }

    static get styles() {
        // noinspection CssUnresolvedCustomProperty
        return css`

            :host {
                user-select: none;
                outline: none;
            }

            .fader {
                height: var(--fader-height, 200px);
            }
            
            .fader__background {
                fill: var(--darker-color, #ccc);
            }

            .fader__handle {
                fill: var(--control-handle-color, #ccc);
            }

            .fader__slide {
                fill: var(--control-handle-color, #ccc);
            }

            .fader__cursor {
                fill: var(--primary-color, #ccc);
            }
        `
    }
}