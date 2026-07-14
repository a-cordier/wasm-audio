import { CHANNEL_COUNT, MixerState, createDefaultMixerState } from "./types";

const FFT_SIZE = 256;
const SMOOTHING = 0.8;

interface ChannelNodes {
  input: GainNode;
  gain: GainNode;
  pan: StereoPannerNode;
  analyser: AnalyserNode;
}

interface MasterNodes {
  gain: GainNode;
  analyser: AnalyserNode;
}

export class MixerEngine {
  readonly channels: ChannelNodes[] = [];
  readonly master: MasterNodes;
  readonly state: MixerState;

  private readonly ctx: AudioContext;
  private soloActive = false;
  private routingTable = new Map<string, { node: AudioNode; channels: Set<number> }>();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.state = createDefaultMixerState();

    this.master = {
      gain: new GainNode(ctx, { gain: this.state.masterGain }),
      analyser: new AnalyserNode(ctx, { fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING }),
    };
    this.master.gain.connect(this.master.analyser);
    this.master.analyser.connect(ctx.destination);

    for (let i = 0; i < CHANNEL_COUNT; i++) {
      const ch = this.createChannel(i);
      this.channels.push(ch);
    }
  }

  private createChannel(index: number): ChannelNodes {
    const s = this.state.channels[index];

    const input = new GainNode(this.ctx, { gain: 1 });
    const gain = new GainNode(this.ctx, { gain: s.mute ? 0 : s.gain });
    const pan = new StereoPannerNode(this.ctx, { pan: s.pan });
    const analyser = new AnalyserNode(this.ctx, { fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING });

    input.connect(gain);
    gain.connect(pan);
    pan.connect(analyser);
    analyser.connect(this.master.gain);

    return { input, gain, pan, analyser };
  }

  getChannelInput(index: number): GainNode {
    return this.channels[index].input;
  }

  connectInput(index: number, source: AudioNode): void {
    source.connect(this.channels[index].input);
  }

  disconnectInput(index: number, source: AudioNode): void {
    try { source.disconnect(this.channels[index].input); } catch { /* already disconnected */ }
  }

  setGain(index: number, value: number): void {
    const s = this.state.channels[index];
    s.gain = Math.max(0, Math.min(1, value));
    this.applyChannelGain(index);
  }

  setPan(index: number, value: number): void {
    const s = this.state.channels[index];
    s.pan = Math.max(-1, Math.min(1, value));
    this.channels[index].pan.pan.setValueAtTime(s.pan, this.ctx.currentTime);
  }

  setMute(index: number, mute: boolean): void {
    this.state.channels[index].mute = mute;
    this.applyChannelGain(index);
  }

  setSolo(index: number, solo: boolean): void {
    this.state.channels[index].solo = solo;
    this.soloActive = this.state.channels.some(c => c.solo);
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      this.applyChannelGain(i);
    }
  }

  setMasterGain(value: number): void {
    this.state.masterGain = Math.max(0, Math.min(1, value));
    this.master.gain.gain.setValueAtTime(this.state.masterGain, this.ctx.currentTime);
  }

  setLabel(index: number, label: string): void {
    this.state.channels[index].label = label;
  }

  setRouting(sourceId: string, node: AudioNode, channelIndices: number[]): void {
    const existing = this.routingTable.get(sourceId);
    const newSet = new Set(channelIndices);

    if (existing) {
      for (const ch of existing.channels) {
        if (!newSet.has(ch)) {
          this.disconnectInput(ch, existing.node);
        }
      }
    }

    for (const ch of channelIndices) {
      if (!existing?.channels.has(ch)) {
        this.connectInput(ch, node);
      }
    }

    this.routingTable.set(sourceId, { node, channels: newSet });
  }

  clearRouting(sourceId: string): void {
    const existing = this.routingTable.get(sourceId);
    if (existing) {
      for (const ch of existing.channels) {
        this.disconnectInput(ch, existing.node);
      }
      this.routingTable.delete(sourceId);
    }
  }

  getRouting(sourceId: string): number[] {
    return [...(this.routingTable.get(sourceId)?.channels ?? [])];
  }

  private applyChannelGain(index: number): void {
    const s = this.state.channels[index];
    const ch = this.channels[index];

    let effectiveGain = s.gain;
    if (s.mute) {
      effectiveGain = 0;
    } else if (this.soloActive && !s.solo) {
      effectiveGain = 0;
    }

    ch.gain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
  }

  getMeterLevel(index: number): [number, number] {
    return this.readPeak(this.channels[index].analyser);
  }

  getMasterMeterLevel(): [number, number] {
    return this.readPeak(this.master.analyser);
  }

  private peakBuf: Float32Array<ArrayBuffer> | null = null;

  private readPeak(analyser: AnalyserNode): [number, number] {
    if (!this.peakBuf || this.peakBuf.length !== analyser.fftSize) {
      this.peakBuf = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
    }
    analyser.getFloatTimeDomainData(this.peakBuf);

    let peak = 0;
    for (let i = 0; i < this.peakBuf.length; i++) {
      const abs = Math.abs(this.peakBuf[i]);
      if (abs > peak) peak = abs;
    }

    return [peak, peak];
  }

  dispose(): void {
    for (const ch of this.channels) {
      ch.input.disconnect();
      ch.gain.disconnect();
      ch.pan.disconnect();
      ch.analyser.disconnect();
    }
    this.master.gain.disconnect();
    this.master.analyser.disconnect();
  }
}
