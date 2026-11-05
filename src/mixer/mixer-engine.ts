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
  /** Post-fader send taps (pan output → send gain → bus), keyed by effect slot id. */
  sends: Map<string, GainNode>;
  analyser: AnalyserNode;
}

/**
 * One effect loop: every channel's send gain sums into `input`, which feeds
 * the effect device; the effect's output returns on its own mixer channel.
 * One bus per mounted effect, keyed — like channels — by slot id.
 */
export interface SendBus {
  readonly effectSlotId: string;
  label: string;
  accent?: string;
  readonly input: GainNode;
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
  /** Ordered effect-loop list — strips grow one SEND knob per entry. */
  readonly sends: SendBus[] = [];
  readonly master: MasterNodes;
  /** One CLICK bus for every metronome — sequencers never take a channel. */
  readonly click: ClickNodes;

  private readonly ctx: AudioContext;
  private byId = new Map<string, MixerChannel>();
  private sendsById = new Map<string, SendBus>();
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

    const channel: MixerChannel = {
      slotId,
      label,
      accent,
      strip,
      nodes: { input, inserts, eq, gain, pan, sends: new Map(), analyser },
    };
    this.channels.push(channel);
    this.byId.set(slotId, channel);

    // Hook this strip into every existing effect loop (restored send levels
    // apply; the loop's own return channel never sends to itself).
    for (const bus of this.sends) this.createChannelSend(channel, bus);

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
    for (const send of channel.nodes.sends.values()) send.disconnect();
    channel.nodes.sends.clear();
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

  // --- Effect loops (send buses) ---

  /** Open an effect loop: a bus summing every strip's send into the effect. */
  addSendBus(effectSlotId: string, label: string, effectInput: AudioNode, accent?: string): SendBus {
    const existing = this.sendsById.get(effectSlotId);
    if (existing) return existing;
    const bus: SendBus = {
      effectSlotId,
      label,
      accent,
      input: new GainNode(this.ctx, { gain: 1 }),
    };
    bus.input.connect(effectInput);
    this.sends.push(bus);
    this.sendsById.set(effectSlotId, bus);
    // The effect's own channel predates its bus (routeSlot orders channel →
    // routing → bus): it mounted as a plain channel and may hold eager taps
    // from restored levels. It is a RETURN now — re-validate each tap under
    // the DAG rule, dropping refused edges and zeroing their stale levels.
    const own = this.byId.get(effectSlotId);
    if (own) {
      for (const [busId, tap] of [...own.nodes.sends]) {
        const level = own.strip.sends[busId] ?? 0;
        if (level > 0 && !this.reaches(busId, effectSlotId)) continue;
        tap.disconnect();
        own.nodes.sends.delete(busId);
        own.strip.sends[busId] = 0;
      }
    }
    for (const channel of this.channels) this.createChannelSend(channel, bus);
    // A channel that just became a return may have been solo-gated — the
    // solo exemption (returns stay audible) must take effect now.
    this.applyAllChannelGains();
    this.dispatchEvent(new Event("channels-changed"));
    return bus;
  }

  /** Close an effect loop (the effect is unmounting): unplug every tap. */
  removeSendBus(effectSlotId: string): void {
    const bus = this.sendsById.get(effectSlotId);
    if (!bus) return;
    for (const channel of this.channels) {
      const send = channel.nodes.sends.get(effectSlotId);
      if (send) {
        send.disconnect();
        channel.nodes.sends.delete(effectSlotId);
      }
    }
    bus.input.disconnect();
    const index = this.sends.indexOf(bus);
    if (index >= 0) this.sends.splice(index, 1);
    this.sendsById.delete(effectSlotId);
    // Its channel (if it outlives the bus) is a plain strip again — plain
    // strips take the normal solo gate.
    this.applyAllChannelGains();
    this.dispatchEvent(new Event("channels-changed"));
  }

  hasSendBus(effectSlotId: string): boolean {
    return this.sendsById.has(effectSlotId);
  }

  /**
   * Whether this strip may open a send into the given loop. Plain channels
   * always may (nothing feeds them from effects, so no cycle is possible);
   * a return may iff the effect→effect edge keeps the send graph acyclic.
   * The board ghosts the knob when this says no.
   */
  canSend(channelSlotId: string, effectSlotId: string): boolean {
    if (channelSlotId === effectSlotId) return false;
    if (!this.byId.has(channelSlotId)) return false; // MASTER/CLICK/unknown
    if (!this.sendsById.has(effectSlotId)) return false; // no such loop
    if (!this.sendsById.has(channelSlotId)) return true; // plain channel
    const channel = this.byId.get(channelSlotId)!;
    if (channel.nodes.sends.has(effectSlotId)) return true; // edge already open
    return !this.reaches(effectSlotId, channelSlotId);
  }

  /**
   * DFS over the effect→effect edges (a return's live taps ARE the edges —
   * node existence is the single source of truth): does `from`'s signal
   * reach `target`'s bus? Used to refuse any edge that would close a loop:
   * even a zero-gain tap is a real audio cycle (the forward paths hold
   * DelayNodes, so Web Audio would run it) — the ×10^8 runaway of item 5,
   * now guarded per edge instead of per strip.
   */
  private reaches(from: string, target: string): boolean {
    if (from === target) return true;
    const stack = [from];
    const seen = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const channel = this.byId.get(id);
      if (!channel) continue;
      for (const busId of channel.nodes.sends.keys()) {
        if (busId === target) return true;
        if (this.sendsById.has(busId)) stack.push(busId);
      }
    }
    return false;
  }

  setSend(channelSlotId: string, effectSlotId: string, value: number): void {
    const channel = this.byId.get(channelSlotId);
    if (!channel) return;
    const level = Math.max(0, Math.min(1, value));
    const existing = channel.nodes.sends.get(effectSlotId);
    const isReturn = this.sendsById.has(channelSlotId);

    if (!existing) {
      // No tap: a return edge being opened (plain channels keep eager taps
      // while their bus lives). Build it only if the DAG stays acyclic.
      const bus = this.sendsById.get(effectSlotId);
      if (!bus || level <= 0) return;
      if (isReturn && !this.canSend(channelSlotId, effectSlotId)) return;
      const send = new GainNode(this.ctx, { gain: 0 });
      channel.nodes.pan.connect(send);
      send.connect(bus.input);
      channel.nodes.sends.set(effectSlotId, send);
      channel.strip.sends[effectSlotId] = level;
      send.gain.setTargetAtTime(level, this.ctx.currentTime, RAMP_TC);
      this.dispatchEvent(new Event("send-edges-changed"));
      return;
    }

    channel.strip.sends[effectSlotId] = level;
    existing.gain.setTargetAtTime(level, this.ctx.currentTime, RAMP_TC);
    if (isReturn && level <= 0) {
      // Zeroing a return's send frees the edge: ramp out, then drop the tap
      // (node existence = edge), so the reverse direction is legal again.
      setTimeout(() => {
        if ((channel.strip.sends[effectSlotId] ?? 0) > 0) return; // reopened
        const tap = channel.nodes.sends.get(effectSlotId);
        if (!tap) return;
        tap.disconnect();
        channel.nodes.sends.delete(effectSlotId);
        this.dispatchEvent(new Event("send-edges-changed"));
      }, REMOVE_RAMP_MS);
    }
  }

  /** Drop send entries whose effect loop is gone — called at save time. */
  pruneSends(sends: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(sends).filter(([id]) => this.sendsById.has(id)));
  }

  private createChannelSend(channel: MixerChannel, bus: SendBus): void {
    // Feedback guard, cycle-aware (item 8): a send tap on a RETURN strip
    // exists ⇔ that effect→effect edge is in the DAG. Self-sends stay
    // forbidden; plain channels keep eager taps (they can never cycle).
    // A return's tap is built lazily — here only when a persisted level
    // says so AND the edge keeps the graph acyclic; a refused edge zeroes
    // the stale level so a saved session can't smuggle a cycle back in.
    // Mount order makes the winner deterministic.
    if (channel.slotId === bus.effectSlotId) return;
    if (channel.nodes.sends.has(bus.effectSlotId)) return;
    const level = channel.strip.sends[bus.effectSlotId] ?? 0;
    if (this.sendsById.has(channel.slotId)) {
      if (level <= 0 || this.reaches(bus.effectSlotId, channel.slotId)) {
        channel.strip.sends[bus.effectSlotId] = 0;
        return;
      }
    }
    channel.strip.sends[bus.effectSlotId] = level;
    const send = new GainNode(this.ctx, { gain: level });
    channel.nodes.pan.connect(send);
    send.connect(bus.input);
    channel.nodes.sends.set(bus.effectSlotId, send);
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
    } else if (this.soloActive && !s.solo && !this.sendsById.has(channel.slotId)) {
      // Solo-safe returns (item 7's open flag): soloing a synth must keep
      // its effect tails audible, so returns are exempt from the solo gate.
      // Mute stays explicit — muting a return silences it as ever, and
      // soloing a return itself behaves like any strip.
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
      for (const send of channel.nodes.sends.values()) send.disconnect();
      channel.nodes.analyser.disconnect();
    }
    for (const bus of this.sends) bus.input.disconnect();
    this.sends.length = 0;
    this.sendsById.clear();
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
