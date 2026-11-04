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
import { isNoteOff, isNoteOn } from "../../midi/codec/decode";
import { MidiBus } from "../../midi/bus/bus";
import { MIDI_EVENT_SIZE } from "../../midi/transport/ring-buffer";
import { SequencerNode } from "./sequencer-node";
import { SequelsPresets } from "./presets";
import { euclideanPattern, rotate } from "./euclid";
import { PatternRecorder, RecordClock } from "./recorder";
import { CONTOUR_NAMES, Contour, SCALES, contourDegree, degreeToNote, foldIntoRange } from "./scales";
import { applyState, loadStoredState, saveState, serializeState } from "./storage";
import {
  BANK_COUNT,
  BANK_NAMES,
  BANK_SIZE,
  BEATS_PER_BAR,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  Direction,
  MAX_STEPS,
  PATTERN_COUNT,
  SequencerState,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
  TransportState,
} from "./types";
import { MidiSourcePlugin, MidiConsumer, PatternAddressable, PluginDescriptor, Learnable, LearnableParam, PresetEntry, HasPresets, TransportAnchor, TransportChild } from "../../core/types";
import { TransportController } from "../../midi/transport/transport-controller";
import { ControlID } from "../../control/types";

const DRAIN_INTERVAL_MS = 10;
const HEADER_BYTES = 2 * Int32Array.BYTES_PER_ELEMENT;
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Main-thread sequencer API.
 * Owns the worklet node, drains MIDI output from the worklet ring buffer,
 * and dispatches events into the MidiBus.
 */
export class SequencerController extends EventTarget implements MidiSourcePlugin, MidiConsumer, Learnable, HasPresets, TransportChild, PatternAddressable {
  readonly descriptor: PluginDescriptor = {
    id: "sequels",
    name: "SEQUELS",
    kind: "sequencer",
    accent: "var(--lcd-led-on-color)",
    type: "midi-source",
  };

  private audioContext: AudioContext;
  private output: GainNode;
  private node: SequencerNode | null = null;
  private bus: MidiBus | null = null;
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private transport: TransportState = TransportState.STOPPED;
  private _currentStep = -1;
  private _lastPositionTime = 0;
  private _bank = 0;
  private _emitting = false;
  private _scale = 0;                     // index into SCALES
  private _contour: number = Contour.UP;  // pitch shape for generated hits
  private readonly recorder = new PatternRecorder();
  private _recording = false;

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

  init(): void {
    this.node = new SequencerNode(this.audioContext);
    // Through the mixer, not straight to destination: the metronome click must
    // obey the SEQUELS channel fader/mute like any other device output.
    this.node.connect(this.output);

    // The worklet stops itself at the end of a non-looping sequence; without
    // this the controller would keep reporting PLAYING, which lies to the UI
    // and makes live record discard every note (currentStep stays -1).
    this.node.onStopped(() => this.stop());

    this.node.onPosition((step) => {
      this._currentStep = step;
      this._lastPositionTime = performance.now();
      // Piggyback a drain: port messages are NOT throttled in hidden tabs,
      // while the 10 ms interval clamps to ~1 s there — without this, a
      // backgrounded tab delivered sequenced notes in one-second batches.
      this.drain();
      this.dispatchEvent(new CustomEvent("position", { detail: { step } }));
    });

    // A frame-targeted switch landed on its boundary: NOW sync the config
    // buffer (the worklet suppressed its per-block check until this write
    // catches up) and run the ordinary selection bookkeeping — recorder,
    // pattern-change (the panel highlight flips exactly on the bar), autosave.
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
      if (typeof stored.scale === "number") this._scale = stored.scale;
      if (typeof stored.contour === "number") this._contour = stored.contour;
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

  getState(): SequencerState {
    if (!this.node) {
      return {
        version: STATE_VERSION,
        config: { ...DEFAULT_CONFIG },
        patterns: [],
        activePattern: 0,
        bank: this._bank,
        scale: this._scale,
        contour: this._contour,
      };
    }
    return {
      ...serializeState(this.node.config, this.node.pattern, this.selectedPattern, this._bank),
      scale: this._scale,
      contour: this._contour,
    };
  }

  loadState(state: unknown): void {
    if (!this.node) return;
    const { bank } = applyState(state, this.node.config, this.node.pattern);
    this._bank = bank;
    const restored = state as Partial<SequencerState> | null;
    if (typeof restored?.scale === "number") this.scale = restored.scale;
    if (typeof restored?.contour === "number") this.contour = restored.contour;
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("config-change"));
    this.dispatchEvent(new CustomEvent("pattern-change"));
  }

  getFactoryPresets(): PresetEntry[] {
    return SequelsPresets;
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
   * True while the sequencer is synchronously pushing its own output into the
   * bus. The recorder checks this so an armed pattern cannot record itself.
   */
  get isEmitting(): boolean {
    return this._emitting;
  }

  /** Duration of one step in milliseconds, from bpm and subdivision. */
  get stepDurationMs(): number {
    const config = this.node?.config.getConfig() ?? DEFAULT_CONFIG;
    return 60000 / (config.bpm * config.subdivision);
  }

  // --- Transport ---

  /** Wired by the shell alongside addChild/removeChild (SYNC toggle). */
  setTransport(transport: TransportController | null): void {
    this.masterTransport = transport;
  }

  start(): void {
    if (!this.node) return;
    // Local start while a running master is attached: join on the master's
    // next beat (quantized launch). Otherwise start free, exactly as before.
    const startAtFrame = this.masterTransport?.isPlaying
      ? this.masterTransport.nextBeatFrame()
      : 0;

    const config = this.node.config.getConfig();
    // One bar of clicks before the clock rolls, so you can come in on time.
    // Pointless without an audible click, hence the metronome condition —
    // and suppressed entirely for frame-aligned starts (the timeline is
    // already running; a pre-roll would miss the downbeat).
    const countIn = startAtFrame === 0 && this._recording && config.metronome
      ? Math.round(config.subdivision) * BEATS_PER_BAR
      : 0;

    this.transport = TransportState.PLAYING;
    this.node.start(countIn, startAtFrame);
    this.startDrain();
    this.emitTransport();
  }

  // --- TransportChild (master transport commands) ---

  onMasterStart(anchor: TransportAnchor): void {
    if (!this.node) return;
    // Restart from step 0 on the shared downbeat; the master owns the
    // timeline, so no count-in.
    this.transport = TransportState.PLAYING;
    this.node.start(0, anchor.startFrame);
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
    // The drain timer keeps running: the worklet flushes its pending note-offs
    // on the audio thread, after this call has already returned, so stopping
    // the drain here would strand them until the next start.
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

  setTranspose(semitones: number): void {
    this.node?.config.setTranspose(semitones);
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
    this.recorder.reset();
    this.recorder.setCursor(0, this.getPatternSteps(clamped));
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
   * Scheduler-level mute: note-ons stop (an open slide is released at the
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

  setStep(index: number, note: number, velocity: number, slide = false): void {
    this.node?.pattern.setStep(this.selectedPattern, index, note, velocity, slide);
    this.scheduleAutosave();
  }

  /** Toggles the 303-style slide tie on a step, keeping its note and velocity. */
  setSlide(index: number, slide: boolean): void {
    this.node?.pattern.setSlide(this.selectedPattern, index, slide);
    this.scheduleAutosave();
  }

  clearStep(index: number): void {
    this.node?.pattern.clearStep(this.selectedPattern, index);
    this.scheduleAutosave();
  }

  toggleStep(index: number, note: number, velocity: number): boolean {
    if (!this.node) return false;
    const pattern = this.selectedPattern;
    if (this.node.pattern.isStepActive(pattern, index)) {
      this.node.pattern.clearStep(pattern, index);
      this.scheduleAutosave();
      return false;
    }
    this.node.pattern.setStep(pattern, index, note, velocity);
    this.scheduleAutosave();
    return true;
  }

  getStep(index: number): { note: number; velocity: number; slide: boolean } {
    return this.node?.pattern.getStep(this.selectedPattern, index) ?? { note: 0, velocity: 0, slide: false };
  }

  /** Snapshot of a whole pattern, for the UI to mirror. */
  readPattern(index = this.selectedPattern): { note: number; velocity: number; slide: boolean }[] {
    const out = [];
    for (let i = 0; i < MAX_STEPS; i++) {
      out.push(this.node?.pattern.getStep(index, i) ?? { note: 0, velocity: 0, slide: false });
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

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = ((Math.round(value) % SCALES.length) + SCALES.length) % SCALES.length;
    this.scheduleAutosave();
  }

  get contour(): number {
    return this._contour;
  }

  set contour(value: number) {
    this._contour = ((Math.round(value) % CONTOUR_NAMES.length) + CONTOUR_NAMES.length) % CONTOUR_NAMES.length;
    this.scheduleAutosave();
  }

  /**
   * Replaces the pattern with a Euclidean distribution of `pulses` hits, each
   * pitched by walking the current scale along the current contour. `root` is
   * the brush note; FLAT reproduces the single-pitch behaviour.
   */
  generateEuclidean(
    pulses: number,
    root: number,
    velocity: number,
    rotation = 0,
    velocityRandom = 0,
    slideRandom = 0,
    index = this.selectedPattern
  ): void {
    if (!this.node) return;

    const length = this.node.pattern.getLength(index);
    const hits = rotate(euclideanPattern(length, pulses), rotation);
    const scale = SCALES[this._scale];
    const total = hits.reduce((n, hit) => n + (hit ? 1 : 0), 0);

    this.node.pattern.clear(index);

    // Velocity humanize: symmetric jitter of up to ±63 at 100%, around the
    // brush velocity, so some steps land harder (triggering monolog's accent).
    const spread = (Math.max(0, Math.min(100, velocityRandom)) / 100) * 63;
    // Slide randomizer: each hit gets a 303-style tie with this probability.
    const slideChance = Math.max(0, Math.min(100, slideRandom));

    let hit = 0;
    for (let i = 0; i < length; i++) {
      if (!hits[i]) continue;
      const degree = contourDegree(this._contour, hit, total, scale.intervals.length);
      const note = foldIntoRange(degreeToNote(root, scale, degree));
      const v = spread > 0
        ? Math.max(1, Math.min(127, Math.round(velocity + (Math.random() * 2 - 1) * spread)))
        : velocity;
      const slide = slideChance > 0 && Math.random() * 100 < slideChance;
      this.node.pattern.setStep(index, i, note, v, slide);
      hit++;
    }

    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  clearPattern(index = this.selectedPattern): void {
    this.node?.pattern.clear(index);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  /** Notifies listeners that the selected pattern's contents changed. */
  notifyPatternChange(): void {
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index: this.selectedPattern } }));
  }

  // --- MidiConsumer: recording ---

  get recording(): boolean {
    return this._recording;
  }

  set recording(on: boolean) {
    if (on === this._recording) return;
    this._recording = on;
    this.recorder.reset();
    if (on) this.recorder.setCursor(0, this.getPatternSteps());
    this.dispatchEvent(new CustomEvent("record-state", { detail: { recording: on } }));
  }

  /** Step-record write position. */
  get editCursor(): number {
    return this.recorder.cursor;
  }

  moveCursor(delta: number): void {
    this.recorder.moveCursor(delta, this.getPatternSteps());
    this.dispatchEvent(new CustomEvent("cursor", { detail: { cursor: this.recorder.cursor } }));
  }

  /**
   * MIDI in. device-slot feeds this through the slot's IN channel and DEVICE
   * filters, so what gets recorded is whatever the header says it listens to.
   */
  receive(event: MidiEvent): void {
    // The bus dispatches synchronously, so this is true for exactly the events
    // we are pushing out ourselves — an armed pattern must not record itself.
    if (this._emitting || !this._recording) return;

    // KeyboardController and MidiInputPort both reuse one MidiEvent object;
    // copy the fields before anything can overwrite them.
    const note = event.data1;
    const velocity = event.data2;
    const timestamp = event.timestamp;

    if (isNoteOn(event)) {
      const index = this.recorder.noteOn(note, velocity, timestamp, this.recordClock(), (i, n, v) =>
        this.setStep(i, n, v)
      );
      if (index < 0) return;
      this.dispatchEvent(
        new CustomEvent("recorded", {
          detail: { index, note, velocity, cursor: this.recorder.cursor },
        })
      );
    } else if (isNoteOff(event)) {
      this.recorder.noteOff(note, this.recordClock());
      this.dispatchEvent(new CustomEvent("cursor", { detail: { cursor: this.recorder.cursor } }));
    }
  }

  private recordClock(): RecordClock {
    return {
      playing: this.isPlaying,
      currentStep: this._currentStep,
      lastStepTime: this._lastPositionTime,
      stepMs: this.stepDurationMs,
      length: this.getPatternSteps(),
    };
  }

  // --- Learnable ---

  getLearnableParams(): LearnableParam[] {
    return [
      { id: ControlID.SEQ_BPM, name: "BPM" },
      { id: ControlID.SEQ_SWING, name: "SWING" },
      { id: ControlID.SEQ_GATE, name: "GATE" },
    ];
  }

  handleControlChange(paramId: number, value: number): void {
    switch (paramId) {
      case ControlID.SEQ_BPM:
        // Ghosted under SYNC exactly like the panel's BPM stepper: the
        // master owns the tempo, so external writers (MIDI-learn CCs,
        // automation) are inert too — this handler is where those paths
        // converge. Without the gate a control write lands in the clock
        // config while the master anchor stays put, and the sequencer
        // keeps the rogue tempo until the next SYNC toggle.
        if (this.masterTransport) break;
        this.setBpm(Math.round(40 + (value / 127) * 200));
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.SEQ_SWING:
        this.setSwing((value / 127) * 100);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.SEQ_GATE:
        this.setGate(5 + (value / 127) * 95);
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
  // released (tracked in the drain loop). The old 128-note broadcast
  // overflowed the receiving instrument's MIDI ring in one synchronous
  // burst — the worklet only drains between audio blocks.
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

  // Ring views, created once (the drain used to re-allocate three typed
  // arrays every 10 ms tick).
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
