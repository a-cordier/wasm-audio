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
import { RudimentNode } from "./rudiment-node";
import { RudimentPresets } from "./presets";
import { applyState, clearStoredState, loadStoredState, saveState, serializeState } from "./storage";
import {
  BANK_COUNT,
  BANK_NAMES,
  BANK_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_PATTERN_STEPS,
  LANE_COUNT,
  MAX_STEPS,
  PATTERN_COUNT,
  RudimentState,
  STATE_VERSION,
  Subdivision,
  SwitchMode,
  TransportState,
} from "./types";
import {
  HasPresets,
  Learnable,
  LearnableParam,
  MidiConsumer,
  MidiSourcePlugin,
  PatternAddressable,
  PluginDescriptor,
  PresetEntry,
  SlotAware,
  TransportAnchor,
  TransportChild,
} from "../../core/types";
import { TransportController } from "../../midi/transport/transport-controller";
import { ControlID } from "../../control/types";

const DRAIN_INTERVAL_MS = 10;
const HEADER_BYTES = 2 * Int32Array.BYTES_PER_ELEMENT;
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Main-thread drum-sequencer API. Owns the worklet node, drains its MIDI
 * ring into the MidiBus, and carries the DISCHORD/sequels contract surface
 * (midi-source + CLICK-bus click, TransportChild, PatternAddressable,
 * Learnable — which also registers it in the ParamDirectory, so SONG sees
 * it — HasPresets, slot-scoped self-persistence).
 */
export class RudimentController
  extends EventTarget
  implements MidiSourcePlugin, MidiConsumer, Learnable, HasPresets, TransportChild, PatternAddressable, SlotAware
{
  readonly descriptor: PluginDescriptor = {
    id: "rudiment",
    name: "RUDIMENT",
    kind: "sequencer",
    accent: "var(--rudiment-accent)",
    type: "midi-source",
  };

  private audioContext: AudioContext;
  private output: GainNode;
  private node: RudimentNode | null = null;
  private bus: MidiBus | null = null;
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private transport: TransportState = TransportState.STOPPED;
  private _currentStep = -1;
  private _currentGrid = -1;
  private _bank = 0;
  private _emitting = false;

  private slotId: string | null = null;
  private masterTransport: TransportController | null = null;
  private _muted = false;
  private _targetInFlight = false;
  // Notes forwarded as ON and not yet released, packed (channel << 8) | note.
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
    if (this.slotId) clearStoredState(this.slotId);
  }

  init(): void {
    this.node = new RudimentNode(this.audioContext);
    // Through the mixer: the click obeys the CLICK bus like any sequencer's.
    this.node.connect(this.output);

    this.node.onPosition((step, grid) => {
      this._currentStep = step;
      this._currentGrid = grid;
      // Piggyback a drain: port messages are not throttled in hidden tabs,
      // while the 10 ms interval clamps to ~1 s there.
      this.drain();
      this.dispatchEvent(new CustomEvent("position", { detail: { step, grid } }));
    });

    this.node.onPatternApplied((index) => {
      this._targetInFlight = false;
      this.selectPattern(index);
    });

    this.node.onMuteApplied((muted) => {
      if (muted === this._muted) return;
      this._muted = muted;
      this.dispatchEvent(new CustomEvent("mute-change", { detail: { muted } }));
    });

    const stored = this.slotId ? loadStoredState(this.slotId) : null;
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

  getState(): RudimentState {
    if (!this.node) {
      return {
        version: STATE_VERSION,
        config: { ...DEFAULT_CONFIG, laneNotes: [...DEFAULT_CONFIG.laneNotes], laneMutes: [...DEFAULT_CONFIG.laneMutes] },
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
    return RudimentPresets;
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

  /** Steps since the pattern origin (−1 stopped) — lane k sits at
   * grid mod its own length. */
  get currentGrid(): number {
    return this._currentGrid;
  }

  get isPlaying(): boolean {
    return this.transport === TransportState.PLAYING;
  }

  get transportState(): TransportState {
    return this.transport;
  }

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
    // Local start under a running master joins on its next beat.
    const startAtFrame = this.masterTransport?.isPlaying
      ? this.masterTransport.nextBeatFrame()
      : 0;
    this.transport = TransportState.PLAYING;
    this.node.start(startAtFrame);
    this.startDrain();
    this.emitTransport();
  }

  onMasterStart(anchor: TransportAnchor): void {
    if (!this.node) return;
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
    this._currentGrid = -1;
    this.emitTransport();
  }

  pause(): void {
    if (!this.node || this.transport !== TransportState.PLAYING) return;
    this.transport = TransportState.PAUSED;
    this.node.pause();
    // The drain keeps running: gated offs already in the ring must flow.
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

  setSwitchMode(mode: SwitchMode): void {
    this.node?.config.setSwitchMode(mode);
    this.scheduleAutosave();
  }

  setMetronome(on: boolean): void {
    this.node?.config.setMetronome(on);
    this.scheduleAutosave();
  }

  // --- Lanes (device-level: the kit map and the performance mutes) ---

  getLaneNote(lane: number): number {
    return this.node?.config.getLaneNote(lane) ?? DEFAULT_CONFIG.laneNotes[lane] ?? 36;
  }

  setLaneNote(lane: number, note: number): void {
    this.node?.config.setLaneNote(lane, note);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("config-change"));
  }

  isLaneMuted(lane: number): boolean {
    return this.node?.config.getLaneMute(lane) ?? false;
  }

  setLaneMute(lane: number, muted: boolean): void {
    this.node?.config.setLaneMute(lane, muted);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("config-change"));
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

  /** Selects the pattern to play and edit; the worklet applies it at the
   * next step boundary (or cycle end in CYCLE mode). */
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
   * Frame-targeted pattern switch: the worklet lands every lane's step 0
   * exactly on `frame` and only THEN reports back for the config/UI sync.
   * Re-asserting the playing pattern is a no-op (polymeter-safe) that
   * cancels any switch in flight; frame 0 or a stopped clock takes the
   * ordinary path.
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

  /** Scheduler-level mute (volatile, owned by the song module). */
  setMuteAt(muted: boolean, frame = 0): void {
    this.node?.setMute(muted, this.isPlaying ? frame : 0);
  }

  isMuted(): boolean {
    return this._muted;
  }

  patternLabel(index: number): string {
    const clamped = Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(index)));
    return `${BANK_NAMES[Math.floor(clamped / BANK_SIZE)]}${clamped % BANK_SIZE}`;
  }

  patternHasContent(index: number): boolean {
    return this.node?.pattern.hasContent(index) ?? false;
  }

  getPatternSteps(index = this.selectedPattern): number {
    return this.node?.pattern.getLength(index) ?? DEFAULT_PATTERN_STEPS;
  }

  setPatternSteps(steps: number, index = this.selectedPattern): void {
    this.node?.pattern.setLength(index, steps);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  /** 0 = the lane follows the pattern's STEPS. */
  getLaneLength(lane: number, index = this.selectedPattern): number {
    return this.node?.pattern.getLaneLength(index, lane) ?? 0;
  }

  setLaneLength(lane: number, steps: number, index = this.selectedPattern): void {
    this.node?.pattern.setLaneLength(index, lane, steps);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  /** Velocity of a hit (0 = none) in the selected pattern. */
  getHit(lane: number, step: number): number {
    return this.node?.pattern.getHit(this.selectedPattern, lane, step) ?? 0;
  }

  setHit(lane: number, step: number, velocity: number): void {
    this.node?.pattern.setHit(this.selectedPattern, lane, step, velocity);
    this.scheduleAutosave();
  }

  clearLane(lane: number, index = this.selectedPattern): void {
    this.node?.pattern.clearLane(index, lane);
    this.scheduleAutosave();
    this.dispatchEvent(new CustomEvent("pattern-change", { detail: { index } }));
  }

  /** Snapshot of a whole pattern (LANE_COUNT × MAX_STEPS velocities). */
  readPattern(index = this.selectedPattern): number[][] {
    const out: number[][] = [];
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      out.push(this.node?.pattern.readLane(index, lane) ?? new Array(MAX_STEPS).fill(0));
    }
    return out;
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

  /** Inert: its presence makes the shell render the KB-arm button, which
   * gates the transport keys. Step recording from input is future work. */
  receive(_event: MidiEvent): void {
    // no-op
  }

  // --- Learnable ---

  getLearnableParams(): LearnableParam[] {
    return [
      { id: ControlID.RUD_BPM, name: "BPM" },
      { id: ControlID.RUD_SWING, name: "SWING" },
      { id: ControlID.RUD_GATE, name: "GATE" },
    ];
  }

  handleControlChange(paramId: number, value: number): void {
    switch (paramId) {
      case ControlID.RUD_BPM:
        // Ghosted under SYNC like the panel's BPM stepper: external writers
        // (MIDI-learn, automation) converge here and are inert too.
        if (this.masterTransport) break;
        this.setBpm(Math.round(40 + (value / 127) * 200));
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.RUD_SWING:
        this.setSwing((value / 127) * 100);
        this.dispatchEvent(new CustomEvent("config-change"));
        break;
      case ControlID.RUD_GATE:
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
      if (this.slotId) saveState(this.getState(), this.slotId);
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  private flushAutosave(): void {
    if (this.autosaveTimer === null) return;
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    if (this.slotId) saveState(this.getState(), this.slotId);
  }

  // Releases exactly the notes forwarded and not yet released.
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
    this.drain();
  }

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

        if (status === Status.NOTE_ON && d2 > 0) {
          this.soundingNotes.add((channel << 8) | d1);
        } else if (status === Status.NOTE_OFF || (status === Status.NOTE_ON && d2 === 0)) {
          this.soundingNotes.delete((channel << 8) | d1);
        }

        // The frame stamp travels intact to the receiving instrument.
        this.bus.send(status, channel, d1, d2, timestamp, INTERNAL_SOURCE, frame);

        read = (read + 1) % this.drainCapacity;
        Atomics.store(heads, 0, read);
      }
    } finally {
      this._emitting = false;
    }
  }
}
