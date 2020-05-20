import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("triangle-wave-icon")
export class TriangleWaveIcon extends LitElement {
  render() {
    return html`
      <div class="wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewbox="0 0 15 15"
        >
          <path
            d="M1,14L1.9285714285714286,12.142490562426055L2.857142857142857,
                    10.284980468772217L3.7857142857142856,8.427469360191056L4.714285714285714,
                    6.5699573422095705L5.642857142857142,4.712444949042433L6.571428571428571,
                    2.8549329289184655L7.5,1L8.428571428571429,2.854932928918461L9.357142857142858,
                    4.712444949042433L10.285714285714286,6.569957342209566L11.214285714285714,
                    8.427469360191049L12.142857142857142,10.284980468772217L13.071428571428571,
                    12.142490562426048L14,13.999999999999995"
            stroke-width="2"
            stroke-linecap="flat"
            fill-opacity="0"
          ></path>
        </svg>
      </div>
    `;
  }

  static get styles() {
    return css`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
        margin-left: 1px;
      }
    `;
  }
}
