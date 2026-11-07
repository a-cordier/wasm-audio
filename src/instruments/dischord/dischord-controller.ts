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

import { Channel, INTERNAL_SOURCE, MidiEvent, Status } from "../../midi/types";
import { MidiBus } from "../../midi/bus/bus";
import { MIDI_EVENT_SIZE } from "../../midi/transport/ring-buffer";
import { DischordNode } from "./dischord-node";
import { DischordPresets } from "./presets";
import { applyState, clearStoredState, loadStoredState, saveState, serializeState } from "./storage";
import {
  BANK_COUNT,
  BANK_NAMES,
  BANK_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  DischordState,
  EmitOrder,
  MAX_STEPS,
  MAX_STRUM_MS,
  PATTERN_COUNT,
  Quality,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
  TransportState,
  Voicing,
} from "./types";
import { ChordStepData, EMPTY_STEP } from "./pattern-buffer";
import {
  HasPresets,
  Learnable,
  LearnableParam,
  MidiConsumer,
  MidiSourcePlugin,
  PatternAddressable,
  PluginDescriptor,
  PresetEntry,
  TransportAnchor,
  TransportChild,
} from "../../core/types";
import { TransportController } from "../../midi/transport/transport-controller";
import { ControlID } from "../../control/types";

const DRAIN_INTERVAL_MS = 10;
const HEADER_BYTES = 2 * Int32Array.BYTES_PER_ELEMENT;
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Main-thread chord-sequencer API.
 * Owns the worklet node, drains MIDI output from the worklet ring buffer,
 * and dispatches events into the MidiBus. Same contract surface as sequels
 * (midi-source, TransportChild, PatternAddressable, Learnable — the latter
 * is also what registers it in the ParamDirectory, which is how SONG sees
 * it), with the harmony config on top and no recorder.
 */
export class DischordController extends EventTarget implements MidiSourcePlugin, MidiConsumer, Learnable, HasPresets, TransportChild, PatternAddressable {
  readonly descriptor: PluginDescriptor = {
    id: "dischord",
    name: "DISCHORD",
    kind: "sequencer",
    accent: "var(--dischord-accent)",
    type: "midi-source",
  };

  private audioContext: AudioContext;
  private output: GainNode;
  private node: DischordNode | null = null;
  private bus: MidiBus | null = null;
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private transport: TransportState = TransportState.STOPPED;
  private _currentStep = -1;
  private _lastPositionTime = 0;
  private _bank = 0;
  private _emitting = false;

  private slotId: string | null = null;
  // The master transport, wired by the shell while this slot's SYNC is on.
  private masterTransport: TransportController | null = null;
  // PatternAddressable (song mode): mute state echoed back by the worklet,
  // and whether a frame-targeted switch is still in flight.
  private _muted = false;
  private _targetInFlight = false;
  // Notes forwarded as ON and not yet released, packed (channel << 8) | note —
  // what allNotesOff() must release on stop.
  private soundingNotes = new Set<number>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
  }

  /** Must be called before init(): state loads under the slot-scoped key. */
  setSlotId(slotId: string): void {
    this.slotId = slotId;
  }

  forgetPersisted(): void {
    // Only ever the slot-scoped key — never the unscoped legacy one.
    if (this.slotId) clearStoredState(this.slotId);
  }

  init(): void {
    this.node = new DischordNode(this.audioContext);
    // Through the mixer, not straight to destination: the metronome click must
    // obey the CLICK bus fader/mute like any other sequencer output.
    this.node.connect(this.output);

    // The worklet stops itself at the end of a non-looping sequence; without
    // this the controller would keep reporting PLAYING, which lies to the UI.
    this.node.onStopped(() => this.stop());

    this.node.onPosition((step) => {
      this._currentStep = step;
      this._lastPositionTime = performance.now();
      // Piggyback a drain: port messages are NOT throttled in hidden tabs,
      // while the 10 ms interval clamps to ~1 s there — without this, a
      // backgrounded tab delivered sequenced chords in one-second batches.
      this.drain();
      this.dispatchEvent(new CustomEvent("position", { detail: { step } }));
    });

    // A frame-targeted switch landed on its boundary: NOW sync the config
    // buffer (the worklet suppressed its per-block check until this write
    // catches up) and run the ordinary selection bookkeeping — the panel
    // highlight flips exactly on the bar.
    this.node.onPatternApplied((index) => {
      this._targetInFlight = false;
      this.selectPattern(index);
    });

    this.node.onMuteApplied((muted) => {
      if (muted === this._muted) return;
      this._muted = muted;
      this.dispatchEvent(new CustomEvent("mute-change", { detail: { muted } }));
    });

    const stored = loadStoredState(this.slotId ?? undefined);
    if (stored) {
      const { bank } = applyState(stored, this.node.config, this.node.pattern);
      this._bank = bank;
    }
  }

  connectMidiOutput(bus: MidiBus): void {
    this.bus = bus;
  }

  connectAudio(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnectAudio(): void {
    this.output.disconnect();
  }

  getOutputNode(): AudioNode {
    return this.output;
  }

  setOutputChannel(ch: Channel): void {
    this.node?.config.setOutputChannel(ch);
    this.scheduleAutosave();
  }

  getState(): DischordState {
    if (!this.node) {
      return {
        version: STATE_VERSION,
        config: { ...DEFAULT_CONFIG },
        patterns: [],
        activePattern: 0,
        bank: this._bank,
      };
    }
    return serializeState(this.node.config, this.node.pattern, this.selectedPattern, this._bank);
  }

  loadState(state: unknown): void {
    if (!this.node) return;
    const { bank } = applyState(state, this.node.config, this.node.pattern);
    this._bank = bank;
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("config-change"));
    this.dispatchEvent(new CustomEvent("pattern-change"));
  }

  getFactoryPresets(): PresetEntry[] {
    return DischordPresets;
  }

  dispose(): void {
    this.stop();
    this.flushAutosave();
    this.node?.dispose();
    this.node = null;
    this.output.disconnect();
    this.bus = null;
  }

  get currentStep(): number {
    return this._currentStep;
  }

  /** performance.now() at which the worklet last reported a step. */
  get lastPositionTime(): number {
    return this._lastPositionTime;
  }

  get isPlaying(): boolean {
    return this.transport === TransportState.PLAYING;
  }

  get transportState(): TransportState {
    return this.transport;
  }

  /**
   * True while the sequencer is synchronously pushing its own output into
   * the bus — receive() uses it to ignore its own echo.
   */
  get isEmitting(): boolean {
    return this._emitting;
  }

  // --- Transport ---

  /** Wired by the shell alongside addChild/removeChild (SYNC toggle). */
  setTransport(transport: TransportController | null): void {
    this.masterTransport = transport;
  }

  start(): void {
    if (!this.node) return;
    // Local start while a running master is attached: join on the master's
    // next beat (quantized launch). Otherwise start free.
    const startAtFrame = this.masterTransport?.isPlaying
      ? this.masterTransport.nextBeatFrame()
      : 0;

    this.transport = TransportState.PLAYING;
    this.node.start(startAtFrame);
    this.startDrain();
    this.emitTransport();
  }

  // --- TransportChild (master transport commands) ---

  onMasterStart(anchor: TransportAnchor): void {
    if (!this.node) return;
    // Restart from step 0 on the shared downbeat; the master owns the timeline.
    this.transport = TransportState.PLAYING;
    this.node.start(anchor.startFrame);
    this.startDrain();
    this.emitTransport();
  }

  onMasterStop(): void {
    this.stop();
  }

  onMasterTempo(bpm: number): void {
    this.node?.config.setBpm(bpm);
    this.scheduleAutosave();
    // The (ghosted) BPM display follows the master.
    this.dispatchEvent(new CustomEvent("config-change"));
  }

  stop(): void {
    if (!this.node) return;
    this.transport = TransportState.STOPPED;
    this._targetInFlight = false; // the worklet drops targets on __stop
    this.node.stop();
    this.stopDrain();
    this.allNotesOff();
    this._currentStep = -1;
    this.emitTransport();
  }

  pause(): void {
    if (!this.node || this.transport !== TransportState.PLAYING) return;
    this.transport = TransportState.PAUSED;
    this.node.pause();
    // The drain timer keeps running: the worklet flushes the held chord's
    // note-offs on the audio thread, after this call has already returned,
    // so stopping the drain here would strand them until the next start.
    this.emitTransport();
  }

  resume(): void {
    if (!this.node || this.transport !== TransportState.PAUSED) return;
    this.transport = TransportState.PLAYING;
    this.node.resume();
    this.startDrain();
    this.emitTransport();
  }

  togglePlayPause(): void {
    switch (this.transport) {
      case TransportState.PLAYING:
        this.pause();
        break;
      case TransportState.PAUSED:
        this.resume();
        break;
      default:
        this.start();
    }
  }

  private emitTransport(): void {
    this.dispatchEvent(new CustomEvent("transport", { detail: { state: this.transport } }));
  }

  // --- Config setters ---

  setBpm(bpm: number): void {
    this.node?.config.setBpm(bpm);
    this.scheduleAutosave();
  }

  setSubdivision(sub: Subdivision): void {
    this.node?.config.setSubdivision(sub);
    this.scheduleAutosave();
  }

  setSwing(swing: number): void {
    this.node?.config.setSwing(swing);
    this.scheduleAutosave();
  }

  setGate(gate: number): void {
    this.node?.config.setGate(gate);
    this.scheduleAutosave();
  }

  setDirection(dir: Direction): void {
    this.node?.config.setDirection(dir);
    this.scheduleAutosave();
  }

  setLoop(loop: boolean): void {
    this.node?.config.setLoop(loop);
    this.scheduleAutosave();
  }

  setSwitchMode(mode: SwitchMode): void {
    this.node?.config.setSwitchMode(mode);
    this.scheduleAutosave();
  }

  setMetronome(on: boolean): void {
    this.node?.config.setMetronome(on);
    this.scheduleAutosave();
  }

  setKey(key: number): void {
    this.node?.config.setKey(key);
    this.scheduleAutosave();
  }

  setScale(scale: number): void {
    this.node?.config.setScale(scale);
    this.scheduleAutosave();
  }

  setVoices(voices: number): void {
    this.node?.config.setVoices(voices);
    this.scheduleAutosave();
  }

  setVoicing(voicing: Voicing): void {
    this.node?.config.setVoicing(voicing);
    this.scheduleAutosave();
  }

  setOrder(order: EmitOrder): void {
    this.node?.config.setOrder(order);
    this.scheduleAutosave();
  }

  setStrum(ms: number): void {
    this.node?.config.setStrum(ms);
    this.scheduleAutosave();
  }

  // --- Patterns ---

  get patternCount(): number {
    return PATTERN_COUNT;
  }

  get selectedPattern(): number {
    return this.node?.config.getActivePattern() ?? 0;
  }

  get bank(): number {
    return this._bank;
  }

  set bank(value: number) {
    this._bank = Math.max(0, Math.min(BANK_COUNT - 1, Math.round(value)));
    this.scheduleAutosave();
  }

  /**
   * Selects the pattern to play and edit. The worklet applies the change at
   * the next step boundary (or the next cycle end in CYCLE mode) without
   * restarting the clock.
   */
  selectPattern(index: number): void {
    if (!this.node) return;
    const clamped = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
    if (clamped === this.selectedPattern) return;
    this.node.config.setActivePattern(clamped);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index: clamped } }));
  }

  // --- PatternAddressable (song mode) ---

  /**
   * Frame-targeted pattern switch: the worklet lands the new pattern's step 0
   * exactly on `frame` — the song's bar line — and only THEN reports back for
   * the config/UI sync (writing ACTIVE_PATTERN up front would race the
   * per-block config check and could switch a step early). Re-asserting the
   * playing pattern leaves its phase alone (polymeter-safe) and cancels any
   * switch still in flight; frame 0 or a stopped clock falls back to the
   * ordinary immediate path.
   */
  selectPatternAt(index: number, frame = 0): void {
    if (!this.node) return;
    const clamped = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
    if (frame <= 0 || !this.isPlaying) {
      this.selectPattern(clamped);
      return;
    }
    if (clamped === this.selectedPattern) {
      if (this._targetInFlight) {
        this.node.cancelPatternTarget();
        this._targetInFlight = false;
      }
      return;
    }
    this._targetInFlight = true;
    this.node.patternAt(clamped, frame);
  }

  /**
   * Scheduler-level mute: note-ons stop (a held chord is released at the
   * boundary), frame-stamped note-offs still flow, the metronome click is
   * untouched. frame 0 — or a stopped clock — applies immediately. Mute is
   * deliberately volatile: never persisted, owned by the song module.
   */
  setMuteAt(muted: boolean, frame = 0): void {
    this.node?.setMute(muted, this.isPlaying ? frame : 0);
  }

  isMuted(): boolean {
    return this._muted;
  }

  /** Bank letter + pad digit, the selector's own vocabulary ("B1" = bank B,
   * pad 1) — what the selector's address LCD and song-mode cells display. */
  patternLabel(index: number): string {
    const clamped = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
    return `${BANK_NAMES[Math.floor(clamped / BANK_SIZE)]}${clamped % BANK_SIZE}`;
  }

  getPatternSteps(index = this.selectedPattern): number {
    return this.node?.pattern.getLength(index) ?? DEFAULT_PATTERN_STEPS;
  }

  setPatternSteps(steps: number, index = this.selectedPattern): void {
    this.node?.pattern.setLength(index, steps);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  setStep(index: number, degree: number, octave: number, velocity: number, tie = false, quality: Quality = Quality.DIATONIC): void {
    this.node?.pattern.setStep(this.selectedPattern, index, degree, octave, velocity, tie, quality);
    this.scheduleAutosave();
  }

  /** Toggles the chord tie on a step, keeping the rest of the step. */
  setTie(index: number, tie: boolean): void {
    this.node?.pattern.setTie(this.selectedPattern, index, tie);
    this.scheduleAutosave();
  }

  clearStep(index: number): void {
    this.node?.pattern.clearStep(this.selectedPattern, index);
    this.scheduleAutosave();
  }

  getStep(index: number): ChordStepData {
    return this.node?.pattern.getStep(this.selectedPattern, index) ?? { ...EMPTY_STEP };
  }

  /** Snapshot of a whole pattern, for the UI to mirror. */
  readPattern(index = this.selectedPattern): ChordStepData[] {
    const out: ChordStepData[] = [];
    for (let i = 0; i < MAX_STEPS; i++) {
      out.push(this.node?.pattern.getStep(index, i) ?? { ...EMPTY_STEP });
    }
    return out;
  }

  patternHasContent(index: number): boolean {
    return this.node?.pattern.hasContent(index) ?? false;
  }

  copyPattern(from: number, to: number): void {
    this.node?.pattern.copy(from, to);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index: to } }));
  }

  clearPattern(index = this.selectedPattern): void {
    this.node?.pattern.clear(index);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  // --- MidiConsumer ---

  /**
   * MIDI in is deliberately inert for now: the method's presence is what
   * makes the shell render the KB-arm button (isMidiConsumer duck-type),
   * which gates the transport keys. Chord capture from played notes is a
   * future project — recognition, not recording.
   */
  receive(_event: MidiEvent): void {
    // no-op
  }

  // --- Learnable ---

  getLearnableParams(): LearnableParam[] {
    return [
      { id: ControlID.DIS_BPM, name: "BPM" },
      { id: ControlID.DIS_SWING, name: "SWING" },
      { id: ControlID.DIS_GATE, name: "GATE" },
      { id: ControlID.DIS_STRUM, name: "STRUM" },
    ];
  }

  handleControlChange(paramId: number, value: number): void {
    switch (paramId) {
      case ControlID.DIS_BPM:
        // Ghosted under SYNC exactly like the panel's BPM stepper: the
        // master owns the tempo, so external writers (MIDI-learn CCs,
        // automation) are inert too — this handler is where those paths
        // converge.
        if (this.masterTransport) break;
        this.setBpm(Math.round(40 + (value / 127) * 200));
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.DIS_SWING:
        this.setSwing((value / 127) * 100);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.DIS_GATE:
        this.setGate(5 + (value / 127) * 95);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.DIS_STRUM:
        this.setStrum((value / 127) * MAX_STRUM_MS);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
    }
  }

  // --- Persistence ---

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== null) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null;
      saveState(this.getState(), this.slotId ?? undefined);
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  private flushAutosave(): void {
    if (this.autosaveTimer === null) return;
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    saveState(this.getState(), this.slotId ?? undefined);
  }

  // Releases exactly the notes this sequencer has forwarded and not yet
  // released (tracked in the drain loop) — never a 128-note broadcast,
  // which would overflow the receiving instrument's MIDI ring.
  private allNotesOff(): void {
    if (!this.bus) return;
    this._emitting = true;
    try {
      for (const key of this.soundingNotes) {
        this.bus.send(Status.NOTE_OFF, ((key >> 8) & 0x0f) as Channel, key & 0x7f, 0);
      }
      this.soundingNotes.clear();
    } finally {
      this._emitting = false;
    }
  }

  // --- Drain loop ---

  private startDrain(): void {
    if (this.drainTimer !== null) return;
    this.drainTimer = setInterval(() => this.drain(), DRAIN_INTERVAL_MS);
  }

  private stopDrain(): void {
    if (this.drainTimer !== null) {
      clearInterval(this.drainTimer);
      this.drainTimer = null;
    }
    // Final drain to catch any remaining note-offs
    this.drain();
  }

  // Ring views, created once (a per-tick re-allocation would churn).
  private drainHeads: Int32Array | null = null;
  private drainData: Float32Array | null = null;
  private drainCapacity = 0;

  private drain(): void {
    if (!this.node || !this.bus) return;

    if (this.drainHeads === null) {
      const ring = this.node.outputRing;
      this.drainHeads = new Int32Array(ring.buffer, 0, 2);
      this.drainData = new Float32Array(ring.buffer, HEADER_BYTES);
      this.drainCapacity = (ring.buffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
    }
    const heads = this.drainHeads;
    const data = this.drainData!;

    let read = Atomics.load(heads, 0);
    const write = Atomics.load(heads, 1);

    // The bus dispatches synchronously, so this flag is set for exactly the
    // duration of our own emissions — see isEmitting.
    this._emitting = true;
    try {
      while (read !== write) {
        const offset = read * MIDI_EVENT_SIZE;
        const packed = data[offset];
        const timestamp = data[offset + 1];
        const frame = data[offset + 3];

        const status = ((packed >> 20) & 0x0f) as Status;
        const channel = ((packed >> 16) & 0x0f) as Channel;
        const d1 = (packed >> 8) & 0x7f;
        const d2 = packed & 0x7f;

        // Track what is sounding so stop releases exactly these notes.
        if (status === Status.NOTE_ON && d2 > 0) {
          this.soundingNotes.add((channel << 8) | d1);
        } else if (status === Status.NOTE_OFF || (status === Status.NOTE_ON && d2 === 0)) {
          this.soundingNotes.delete((channel << 8) | d1);
        }

        // The frame stamp travels intact to the receiving instrument — this
        // hop adds latency (covered by the worklet's lookahead), never jitter.
        this.bus.send(status, channel, d1, d2, timestamp, INTERNAL_SOURCE, frame);

        read = (read + 1) % this.drainCapacity;
        Atomics.store(heads, 0, read);
      }
    } finally {
      this._emitting = false;
    }
  }
}
