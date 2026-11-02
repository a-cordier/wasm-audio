import {
  ChannelStripState,
  MAX_CHANNELS,
  createDefaultStripState,
  EQ_GAIN_DB,
  EQ_LOW_SHELF_HZ,
  EQ_HIGH_SHELF_HZ,
  EQ_MID_FREQ_MIN,
  EQ_MID_FREQ_MAX,
  EQ_MID_Q,
} from "./types";
import { MAX_FADER_GAIN } from "./fader-law";

export type EqBand = "low" | "mid" | "midFreq" | "high";

const FFT_SIZE = 256;
const SMOOTHING = 0.8;
/** 10 ms ramp constant — every audible mixer param moves through this. */
const RAMP_TC = 0.01;
/** How long the removal ramp is given before the graph is torn down. */
const REMOVE_RAMP_MS = 40;

interface ChannelNodes {
  input: GainNode;
  /** The per-channel insert chain, in order, between input and fader.
   * Residents today: the 3-band EQ. Item 8's effects slot in here. */
  inserts: AudioNode[];
  eq: { low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode };
  gain: GainNode;
  pan: StereoPannerNode;
  analyser: AnalyserNode;
}

interface MasterNodes {
  gain: GainNode;
  limiter: DynamicsCompressorNode;
  analyser: AnalyserNode;
}

interface ClickNodes {
  input: GainNode;
  gain: GainNode;
  analyser: AnalyserNode;
}

/**
 * One live mixer channel — created when a device mounts, removed when it
 * unmounts. The slot id IS the channel identity; there are no fixed indices.
 */
export interface MixerChannel {
  readonly slotId: string;
  label: string;
  /** Device accent (CSS color or var()) for the strip nameplate. */
  accent?: string;
  readonly strip: ChannelStripState;
  /** Live audio nodes — engine-internal; the board never touches these. */
  readonly nodes: ChannelNodes;
}

/**
 * The mixer graph. Channels are dynamic (one per mounted, non-sequencer
 * device, keyed by slot id); MASTER and CLICK are fixed buses. Dispatches
 * "channels-changed" whenever the strip list the board renders moves
 * (add/remove/relabel) — value changes flow through the board's own handlers.
 */
export class MixerEngine extends EventTarget {
  /** Ordered strip list — the board renders exactly this. */
  readonly channels: MixerChannel[] = [];
  readonly master: MasterNodes;
  /** One CLICK bus for every metronome — sequencers never take a channel. */
  readonly click: ClickNodes;

  private readonly ctx: AudioContext;
  private byId = new Map<string, MixerChannel>();
  private soloActive = false;
  /** The routed source node per channel slot (disconnected on remove/swap). */
  private sources = new Map<string, AudioNode>();
  private clickRouting = new Map<string, AudioNode>();

  private _masterGain = 0.8;
  private _clickGain = 0.8;

  constructor(ctx: AudioContext) {
    super();
    this.ctx = ctx;

    this.master = {
      gain: new GainNode(ctx, { gain: this._masterGain }),
      // Safety limiter (dsp-audit, item 5): a brickwall-ish ceiling so the
      // +6 dB fader headroom and hot stacks can't clip the DAC. Hard knee,
      // steep ratio, fast attack — transparent until the mix actually slams.
      limiter: new DynamicsCompressorNode(ctx, {
        threshold: -3,
        knee: 0,
        ratio: 20,
        attack: 0.003,
        release: 0.25,
      }),
      analyser: new AnalyserNode(ctx, { fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING }),
    };
    this.master.gain.connect(this.master.limiter);
    this.master.limiter.connect(this.master.analyser);
    this.master.analyser.connect(ctx.destination);

    this.click = {
      input: new GainNode(ctx, { gain: 1 }),
      gain: new GainNode(ctx, { gain: this._clickGain }),
      analyser: new AnalyserNode(ctx, { fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING }),
    };
    this.click.input.connect(this.click.gain);
    this.click.gain.connect(this.click.analyser);
    this.click.analyser.connect(this.master.gain);
  }

  get masterGain(): number {
    return this._masterGain;
  }

  get clickGain(): number {
    return this._clickGain;
  }

  /** Mount guard: whether another device can still take a strip. */
  hasFreeChannel(): boolean {
    return this.channels.length < MAX_CHANNELS;
  }

  getChannel(slotId: string): MixerChannel | undefined {
    return this.byId.get(slotId);
  }

  /**
   * Create the channel for a mounting device. Idempotent per slot id;
   * returns null when the soft cap is hit (callers warn and abort the mount).
   */
  addChannel(
    slotId: string,
    label: string,
    restored?: ChannelStripState,
    accent?: string
  ): MixerChannel | null {
    const existing = this.byId.get(slotId);
    if (existing) return existing;
    if (this.channels.length >= MAX_CHANNELS) return null;

    const strip = restored ? { ...restored, eq: { ...restored.eq } } : createDefaultStripState();
    const input = new GainNode(this.ctx, { gain: 1 });
    // 3-band EQ (native biquads): flat gains are identity, so there is no
    // bypass — zeroed knobs ARE the bypass.
    const eq = {
      low: new BiquadFilterNode(this.ctx, { type: "lowshelf", frequency: EQ_LOW_SHELF_HZ, gain: strip.eq.low }),
      mid: new BiquadFilterNode(this.ctx, { type: "peaking", frequency: strip.eq.midFreq, Q: EQ_MID_Q, gain: strip.eq.mid }),
      high: new BiquadFilterNode(this.ctx, { type: "highshelf", frequency: EQ_HIGH_SHELF_HZ, gain: strip.eq.high }),
    };
    const gain = new GainNode(this.ctx, { gain: strip.mute ? 0 : strip.gain });
    const pan = new StereoPannerNode(this.ctx, { pan: strip.pan });
    const analyser = new AnalyserNode(this.ctx, { fftSize: FFT_SIZE, smoothingTimeConstant: SMOOTHING });

    // input → [inserts…] → fader → pan → meter → master.
    const inserts: AudioNode[] = [eq.low, eq.mid, eq.high];
    let previous: AudioNode = input;
    for (const insert of inserts) {
      previous.connect(insert);
      previous = insert;
    }
    previous.connect(gain);
    gain.connect(pan);
    pan.connect(analyser);
    analyser.connect(this.master.gain);

    const channel: MixerChannel = { slotId, label, accent, strip, nodes: { input, inserts, eq, gain, pan, analyser } };
    this.channels.push(channel);
    this.byId.set(slotId, channel);

    // A restored solo (or joining a soloed board) must gate everyone.
    this.soloActive = this.channels.some((c) => c.strip.solo);
    this.applyAllChannelGains();

    this.dispatchEvent(new Event("channels-changed"));
    return channel;
  }

  /**
   * Tear the channel down: ramp its fader silent, wait the ramp out, then
   * disconnect and drop the strip — an eject never clicks.
   */
  async removeChannel(slotId: string): Promise<void> {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    this.byId.delete(slotId);

    channel.nodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, RAMP_TC);
    await new Promise((resolve) => setTimeout(resolve, REMOVE_RAMP_MS));

    const source = this.sources.get(slotId);
    if (source) {
      try { source.disconnect(channel.nodes.input); } catch { /* already disconnected */ }
      this.sources.delete(slotId);
    }
    channel.nodes.input.disconnect();
    for (const insert of channel.nodes.inserts) insert.disconnect();
    channel.nodes.gain.disconnect();
    channel.nodes.pan.disconnect();
    channel.nodes.analyser.disconnect();

    const index = this.channels.indexOf(channel);
    if (index >= 0) this.channels.splice(index, 1);

    // Removing the last soloed strip releases everyone else.
    this.soloActive = this.channels.some((c) => c.strip.solo);
    this.applyAllChannelGains();

    this.dispatchEvent(new Event("channels-changed"));
  }

  /** Connect a device's output to its channel (replacing any previous source). */
  setRouting(slotId: string, node: AudioNode): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    const previous = this.sources.get(slotId);
    if (previous === node) return;
    if (previous) {
      try { previous.disconnect(channel.nodes.input); } catch { /* already disconnected */ }
    }
    node.connect(channel.nodes.input);
    this.sources.set(slotId, node);
  }

  /** Unplug a slot's source (channel stays) and any CLICK-bus route it holds. */
  clearRouting(slotId: string): void {
    const channel = this.byId.get(slotId);
    const source = this.sources.get(slotId);
    if (channel && source) {
      try { source.disconnect(channel.nodes.input); } catch { /* already disconnected */ }
    }
    this.sources.delete(slotId);

    const clickNode = this.clickRouting.get(slotId);
    if (clickNode) {
      try { clickNode.disconnect(this.click.input); } catch { /* already disconnected */ }
      this.clickRouting.delete(slotId);
    }
  }

  routeToClick(sourceId: string, node: AudioNode): void {
    if (this.clickRouting.has(sourceId)) return;
    node.connect(this.click.input);
    this.clickRouting.set(sourceId, node);
  }

  setGain(slotId: string, value: number): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    channel.strip.gain = Math.max(0, Math.min(MAX_FADER_GAIN, value));
    this.applyChannelGain(channel);
  }

  setPan(slotId: string, value: number): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    channel.strip.pan = Math.max(-1, Math.min(1, value));
    // setTargetAtTime, not setValueAtTime: an instant step under signal is a
    // click, and dragging emits one step per pointer event (zipper).
    channel.nodes.pan.pan.setTargetAtTime(channel.strip.pan, this.ctx.currentTime, RAMP_TC);
  }

  setMute(slotId: string, mute: boolean): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    channel.strip.mute = mute;
    this.applyChannelGain(channel);
  }

  setSolo(slotId: string, solo: boolean): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    channel.strip.solo = solo;
    this.soloActive = this.channels.some((c) => c.strip.solo);
    this.applyAllChannelGains();
  }

  setEq(slotId: string, band: EqBand, value: number): void {
    const channel = this.byId.get(slotId);
    if (!channel) return;
    const now = this.ctx.currentTime;
    switch (band) {
      case "low":
        channel.strip.eq.low = Math.max(-EQ_GAIN_DB, Math.min(EQ_GAIN_DB, value));
        channel.nodes.eq.low.gain.setTargetAtTime(channel.strip.eq.low, now, RAMP_TC);
        break;
      case "mid":
        channel.strip.eq.mid = Math.max(-EQ_GAIN_DB, Math.min(EQ_GAIN_DB, value));
        channel.nodes.eq.mid.gain.setTargetAtTime(channel.strip.eq.mid, now, RAMP_TC);
        break;
      case "midFreq":
        channel.strip.eq.midFreq = Math.max(EQ_MID_FREQ_MIN, Math.min(EQ_MID_FREQ_MAX, value));
        channel.nodes.eq.mid.frequency.setTargetAtTime(channel.strip.eq.midFreq, now, RAMP_TC);
        break;
      case "high":
        channel.strip.eq.high = Math.max(-EQ_GAIN_DB, Math.min(EQ_GAIN_DB, value));
        channel.nodes.eq.high.gain.setTargetAtTime(channel.strip.eq.high, now, RAMP_TC);
        break;
    }
  }

  setLabel(slotId: string, label: string): void {
    const channel = this.byId.get(slotId);
    if (!channel || channel.label === label) return;
    channel.label = label;
    this.dispatchEvent(new Event("channels-changed"));
  }

  setMasterGain(value: number): void {
    this._masterGain = Math.max(0, Math.min(MAX_FADER_GAIN, value));
    this.master.gain.gain.setTargetAtTime(this._masterGain, this.ctx.currentTime, RAMP_TC);
  }

  setClickGain(value: number): void {
    this._clickGain = Math.max(0, Math.min(MAX_FADER_GAIN, value));
    this.click.gain.gain.setTargetAtTime(this._clickGain, this.ctx.currentTime, RAMP_TC);
  }

  /** Limiter gain reduction in dB (negative while limiting) — the GR LED. */
  getLimiterReduction(): number {
    return this.master.limiter.reduction;
  }

  getMeterLevel(slotId: string): [number, number] {
    const channel = this.byId.get(slotId);
    return channel ? this.readPeak(channel.nodes.analyser) : [0, 0];
  }

  getMasterMeterLevel(): [number, number] {
    return this.readPeak(this.master.analyser);
  }

  getClickMeterLevel(): [number, number] {
    return this.readPeak(this.click.analyser);
  }

  private applyAllChannelGains(): void {
    for (const channel of this.channels) this.applyChannelGain(channel);
  }

  private applyChannelGain(channel: MixerChannel): void {
    const s = channel.strip;
    let effectiveGain = s.gain;
    if (s.mute) {
      effectiveGain = 0;
    } else if (this.soloActive && !s.solo) {
      effectiveGain = 0;
    }

    // 10 ms ramp: fader zipper and hard mute/solo clicks both come from
    // stepping this value instantly under a sustaining signal.
    channel.nodes.gain.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, RAMP_TC);
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
    for (const channel of this.channels) {
      channel.nodes.input.disconnect();
      for (const insert of channel.nodes.inserts) insert.disconnect();
      channel.nodes.gain.disconnect();
      channel.nodes.pan.disconnect();
      channel.nodes.analyser.disconnect();
    }
    this.channels.length = 0;
    this.byId.clear();
    this.sources.clear();
    this.clickRouting.clear();
    this.master.gain.disconnect();
    this.master.limiter.disconnect();
    this.master.analyser.disconnect();
    this.click.input.disconnect();
    this.click.gain.disconnect();
    this.click.analyser.disconnect();
  }
}
