import { LitElement, html, css, customElement, property } from "lit-element";

@customElement("visualizer-element")
export class Visualizer extends LitElement {
  @property({ attribute: false })
  analyser;

  private canvas: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;

  private buffer: Uint8Array;

  @property({ type: Number })
  private width = 1024;

  @property({ type: Number })
  private height = 512;

  firstUpdated() {
    this.canvas = this.shadowRoot.getElementById(
      "visualizer"
    ) as HTMLCanvasElement;
    this.canvasContext = this.canvas.getContext("2d");
    this.draw();
  }

  connectedCallback() {
    super.connectedCallback();
    this.analyser.fftSize = 2048 * 2;
    this.buffer = new Uint8Array(this.analyser.fftSize);
  }

  draw() {
    if (!this.analyser) {
      return;
    }
    this.drawOscilloscope();
  }

  drawOscilloscope() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const sliceWidth = (this.canvas.width / this.analyser.fftSize) * 4;
    this.analyser.getByteTimeDomainData(this.buffer);

    this.canvasContext.beginPath();
    this.buffer.forEach((v, i) => {
      const y = (v / 128) * (this.canvas.height / 2);
      const x = i * sliceWidth;
      this.canvasContext.lineTo(x, y);
    });
    this.canvasContext.lineWidth = 1;
    this.canvasContext.strokeStyle = "#b4d455";
    this.canvasContext.stroke();
    requestAnimationFrame(this.drawOscilloscope.bind(this));
  }

  protected render() {
    return html`
      <canvas
        class="test"
        id="visualizer"
        width=${this.width}
        height=${this.height}
      ></canvas>
    `;
  }

  static get styles() {
    // noinspection CssUnresolvedCustomProperty
    return css`
      canvas {
        border: 1px solid grey;
        border-radius: 0.25rem;
      }
    `;
  }
}
