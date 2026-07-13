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
import { customElement, property } from "lit/decorators.js";

export type VisualizerMode = "oscilloscope" | "spectrum";

@customElement("visualizer-element")
export class Visualizer extends LitElement {
  @property({ attribute: false })
  analyser: AnalyserNode | null = null;

  @property({ type: String, reflect: true })
  mode: VisualizerMode = "oscilloscope";

  @property({ type: Number })
  fftSize = 4096;

  @property({ type: Number })
  smoothingTimeConstant = 0.8;

  @property({ type: Boolean })
  frozen = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private timeDomainBuffer: Uint8Array<ArrayBuffer> | null = null;
  private frequencyBuffer: Uint8Array<ArrayBuffer> | null = null;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private strokeColor = "#b4d455";
  private bgColor = "#15202b";
  private gridColor = "rgba(180,212,85,0.08)";
  private lineWidth = 1.5;
  private peakHold: number[] = [];
  private peakDecay: number[] = [];
  private cssReadPending = true;

  private boundDraw = this.draw.bind(this);

  connectedCallback() {
    super.connectedCallback();
    this.cssReadPending = true;
  }

  firstUpdated() {
    this.canvas = this.shadowRoot!.getElementById("visualizer") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.resizeObserver = new ResizeObserver(() => this.syncCanvasSize());
    this.resizeObserver.observe(this.canvas);
    this.syncCanvasSize();

    this.configureAnalyser();
    this.startDrawLoop();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("analyser") || changed.has("fftSize") || changed.has("smoothingTimeConstant")) {
      this.configureAnalyser();
      if (!this.rafId && this.analyser) {
        this.startDrawLoop();
      }
    }
    if (changed.has("mode")) {
      this.cssReadPending = true;
    }
  }

  disconnectedCallback() {
    this.stopDrawLoop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    super.disconnectedCallback();
  }

  private configureAnalyser() {
    if (!this.analyser) return;
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    this.timeDomainBuffer = new Uint8Array(this.analyser.fftSize) as Uint8Array<ArrayBuffer>;
    this.frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    this.peakHold = new Array(this.analyser.frequencyBinCount).fill(0);
    this.peakDecay = new Array(this.analyser.frequencyBinCount).fill(0);
  }

  private syncCanvasSize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private readCSSProperties() {
    const cs = getComputedStyle(this);
    this.strokeColor = cs.getPropertyValue("--visualizer-stroke-color").trim()
      || cs.getPropertyValue("--lcd-led-on-color").trim()
      || "#b4d455";
    this.bgColor = cs.getPropertyValue("--visualizer-bg").trim()
      || cs.getPropertyValue("--darker").trim()
      || "#15202b";
    this.gridColor = cs.getPropertyValue("--visualizer-grid-color").trim()
      || cs.getPropertyValue("--lcd-led-off-color").trim()
      || "rgba(180,212,85,0.08)";
    const lw = cs.getPropertyValue("--visualizer-line-width").trim();
    this.lineWidth = lw ? parseFloat(lw) : 1.5;
  }

  private startDrawLoop() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.boundDraw);
  }

  private stopDrawLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private draw() {
    this.rafId = 0;
    if (!this.analyser || !this.ctx || !this.canvas) return;

    if (this.cssReadPending) {
      this.readCSSProperties();
      this.cssReadPending = false;
    }

    if (!this.frozen) {
      if (this.mode === "oscilloscope") {
        this.drawOscilloscope();
      } else {
        this.drawSpectrum();
      }
    }

    this.rafId = requestAnimationFrame(this.boundDraw);
  }

  private drawOscilloscope() {
    const { ctx, canvas, analyser, timeDomainBuffer } = this;
    if (!ctx || !canvas || !analyser || !timeDomainBuffer) return;

    const w = canvas.width;
    const h = canvas.height;

    analyser.getByteTimeDomainData(timeDomainBuffer);

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    this.drawGrid(w, h);

    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const bufferLength = timeDomainBuffer.length;
    const sliceWidth = w / bufferLength;

    ctx.beginPath();
    ctx.moveTo(0, (timeDomainBuffer[0] / 128) * (h / 2));

    for (let i = 1; i < bufferLength; i++) {
      const y = (timeDomainBuffer[i] / 128) * (h / 2);
      ctx.lineTo(i * sliceWidth, y);
    }

    ctx.lineWidth = this.lineWidth * (window.devicePixelRatio || 1);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawSpectrum() {
    const { ctx, canvas, analyser, frequencyBuffer, peakHold, peakDecay } = this;
    if (!ctx || !canvas || !analyser || !frequencyBuffer || !peakHold || !peakDecay) return;

    const w = canvas.width;
    const h = canvas.height;

    analyser.getByteFrequencyData(frequencyBuffer);

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    this.drawGrid(w, h);

    const binCount = frequencyBuffer.length;
    const barWidth = w / binCount;
    const dpr = window.devicePixelRatio || 1;
    const gap = Math.min(dpr, barWidth * 0.2);
    const bw = Math.max(barWidth - gap, 1);

    ctx.fillStyle = this.strokeColor;
    for (let i = 0; i < binCount; i++) {
      const normalized = frequencyBuffer[i] / 255;
      const barHeight = normalized * h;
      const x = i * barWidth;

      ctx.globalAlpha = 0.3 + normalized * 0.7;
      ctx.fillRect(x, h - barHeight, bw, barHeight);

      if (normalized > peakHold[i]) {
        peakHold[i] = normalized;
        peakDecay[i] = 0;
      } else {
        peakDecay[i] += 0.001;
        peakHold[i] = Math.max(0, peakHold[i] - peakDecay[i]);
      }

      const peakY = h - peakHold[i] * h;
      ctx.globalAlpha = 1;
      ctx.fillRect(x, peakY - dpr, bw, dpr);
    }
    ctx.globalAlpha = 1;
  }

  private drawGrid(w: number, h: number) {
    const ctx = this.ctx!;
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;

    if (this.mode === "spectrum") {
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  protected render() {
    return html`<canvas id="visualizer"></canvas>`;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        min-height: 80px;
        border-radius: 0.25rem;
        overflow: hidden;
        animation: viz-fade-in 0.3s ease-out;
      }

      @keyframes viz-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 0.25rem;
      }
    `;
  }
}
