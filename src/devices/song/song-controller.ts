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

import { SongState, SongScene, createSongState, CELL_MUTE, SCENE_COUNT } from "./types/song-state";
import { SongEvent } from "./types/song-event";
import {
  Plugin,
  PluginDescriptor,
  PresetEntry,
  TransportChild,
  TransportAnchor,
  PatternAddressable,
  isPatternAddressable,
} from "../../core/types";
import { TransportController } from "../../midi/transport/transport-controller";
import { getParamDirectory, AutomationTargetEntry } from "../../control/param-directory";

const BEATS_PER_BAR = 4; // matches transport-bar and the sequencer grid

/** Scene changes dispatch inside this window before the bar line: far enough
 * out to clear the sequencer's 24 ms scheduling lookahead plus block and
 * port hops (ticks arrive every ~10.7 ms, so the first tick inside the
 * window still leaves ≥ ~75 ms of lead)… */
const DISPATCH_LEAD_S = 0.085;
/** …and a launch landing closer than this to the bar quantizes to the
 * following bar instead (below the lookahead it would slip a step). */
const MIN_DISPATCH_LEAD_S = 0.035;
/** The target backs off half a block so SONG's rounding can never land
 * after the sequencer's own float-accumulated boundary and slip a step
 * (step spacing is ≥ 1200 frames even at 300 BPM × 1/32). */
const BOUNDARY_SAFETY_FRAMES = 64;
/** Ring/__start frame stamps are Float32-exact only mod 2^24. */
const FRAME_WRAP = 1 << 24;

/** A directory entry whose plugin can take scene dispatches. */
export interface SceneTargetEntry extends AutomationTargetEntry {
  plugin: AutomationTargetEntry["plugin"] & PatternAddressable;
}

/**
 * SONG (roadmap item 7): the scene + chain song-mode module — a second
 * kind:"module" device after MOTION. A scene assigns, per mounted sequencer,
 * a pattern (0..39), MUTE, or no-change; launching one dispatches
 * frame-targeted `selectPatternAt`/`setMuteAt` calls (the PatternAddressable
 * capability, resolved through the ParamDirectory) so every switch lands
 * sample-exactly on the next master bar. The chain (batch 3) plays scenes in
 * order, N bars each, as a pure function of the transport position.
 *
 * Timing is MOTION's idiom: a silent worklet clock posts frames at control
 * rate (hidden tabs clamp main-thread timers, not port messages); each tick
 * derives the bar from `transport.beatsAt()` live, so tempo changes come
 * free. The clock is gated on a RUNNING master — SONG has no free-run mode
 * (unsynced, scene launches apply immediately: snapshot recall).
 */
export class SongController extends EventTarget implements Plugin, TransportChild {
  readonly descriptor: PluginDescriptor = {
    id: "song",
    name: "SONG",
    kind: "module",
    accent: "var(--song-accent)",
    type: "control",
  };

  private readonly audioContext: AudioContext;
  private state: SongState;
  /** Master clock handle while SYNC is on (wireSync passes/clears it). */
  private transport: TransportController | null = null;
  private masterRunning = false;

  private node: AudioWorkletNode | null = null;
  /** The clock's silent pull into the graph — unpulled worklets never run. */
  private pull: GainNode | null = null;
  private clockGateOn = false;

  // --- Playback bookkeeping (volatile by design: never persisted) ---
  /** The scene whose cells were last applied; -1 before any launch. */
  private playingScene = -1;
  /** A manual launch waiting for its bar. */
  private queuedScene: number | null = null;
  /** The dispatch already sent for an upcoming bar (dedupe + tempo re-send). */
  private dispatched: { bar: number; scene: number } | null = null;
  private lastBarSeen = -1;
  /** Display state for the panel's rAF readout. */
  private currentBar = -1;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createSongState();
  }

  init() {
    this.node = new AudioWorkletNode(this.audioContext, "song", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    this.pull = new GainNode(this.audioContext, { gain: 0 });
    this.node.connect(this.pull).connect(this.audioContext.destination);
    this.node.port.onmessage = (e) => {
      if (e.data?.type === "__tick") this.onTick(e.data.frame as number);
    };
    this.updateClockGate();
  }

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    // Mutes are SONG's to own (sequels keeps the flag volatile and has no
    // mute UI of its own): lift every one so ejecting the module can't
    // leave a sequencer inexplicably silent.
    for (const entry of this.sceneTargets()) {
      if (entry.plugin.isMuted()) entry.plugin.setMuteAt(false, 0);
    }
    this.node?.port.postMessage({ type: "__dispose" });
    this.node?.disconnect();
    this.pull?.disconnect();
    this.node = null;
    this.pull = null;
    this.transport = null;
  }

  // Snapshots must not alias live state: scenes/chain are nested and mutable.
  getState(): SongState {
    return createSongState(this.state);
  }

  setState(newState: unknown) {
    this.state = createSongState(newState as Partial<SongState>);
    this.dispatch(SongEvent.SCENES, this.copyScenes());
    this.dispatch(SongEvent.CHAIN, this.copyChain());
    this.dispatch(SongEvent.SELECTION, this.selectionDetail());
    return this.getState();
  }

  getFactoryPresets(): PresetEntry[] {
    return [{ name: "INIT", state: createSongState() }];
  }

  // --- Transport (child clock mode; SONG is meaningless without a master) ---

  setTransport(transport: TransportController | null) {
    this.transport = transport;
    if (!transport) this.masterRunning = false;
    this.updateClockGate();
  }

  onMasterStart(_anchor: TransportAnchor): void {
    this.masterRunning = true;
    // Every synced child restarts at step 0 on the shared downbeat, so the
    // playing scene is re-asserted immediately (idempotent): the config
    // already holds its patterns before any __start reads it, and stopped
    // mutes survive in the worklet either way.
    this.resetRun();
    if (this.playingScene >= 0) this.applySceneNow(this.playingScene);
    this.updateClockGate();
  }

  onMasterStop(): void {
    this.masterRunning = false;
    this.resetRun();
    this.updateClockGate();
  }

  /** Bars are read live off the transport each tick; a pending dispatch is
   * re-aimed because setBpm re-anchors (bar indices keep, frames move). */
  onMasterTempo(_bpm: number): void {
    if (!this.transport || !this.dispatched) return;
    this.applySceneAt(this.dispatched.scene, this.barFrame(this.dispatched.bar));
  }

  private isRunning(): boolean {
    return this.transport !== null && this.masterRunning;
  }

  private updateClockGate() {
    const on = this.isRunning();
    this.clockGateOn = on;
    this.node?.port.postMessage({ type: "__run", on });
  }

  private resetRun() {
    this.queuedScene = null;
    this.dispatched = null;
    this.lastBarSeen = -1;
    this.currentBar = -1;
  }

  // --- The tick loop (control-rate, worklet-clocked) ---

  private onTick(frame: number) {
    const t = this.transport;
    if (!t) return;
    const sr = this.audioContext.sampleRate;
    const beats = t.beatsAt(frame / sr);
    if (beats < 0) return; // pre-anchor (the 25 ms start lead)
    const bar = Math.floor(beats / BEATS_PER_BAR);
    this.currentBar = bar;

    // Bar cross: promote the dispatched scene to playing; selection follows.
    if (bar !== this.lastBarSeen) {
      this.lastBarSeen = bar;
      if (this.dispatched && this.dispatched.bar <= bar) {
        this.playingScene = this.dispatched.scene;
        this.dispatched = null;
        if (this.queuedScene === this.playingScene) this.queuedScene = null;
        if (this.state.selectedScene !== this.playingScene) {
          this.state.selectedScene = this.playingScene;
          // Playback-driven: panel listeners re-render, no composed change,
          // so the session-save path never ticks over.
          this.dispatch(SongEvent.SELECTION, this.selectionDetail());
        }
      }
    }

    // Decide the scene for bar+1 (manual queue; the chain joins in batch 3)
    // and dispatch it inside the lead window, exactly once per boundary —
    // a re-queue before the window closes replaces it (last wins).
    const next = this.queuedScene;
    if (next === null) return;
    if (this.dispatched && this.dispatched.bar === bar + 1 && this.dispatched.scene === next) return;

    const targetFrame = this.barFrame(bar + 1);
    const lead = (targetFrame - frame) / sr;
    if (lead < MIN_DISPATCH_LEAD_S || lead > DISPATCH_LEAD_S) return;
    this.applySceneAt(next, targetFrame);
    this.dispatched = { bar: bar + 1, scene: next };
  }

  /** The AudioContext frame of bar N's downbeat, backed off half a block. */
  private barFrame(bar: number): number {
    const a = this.transport!.anchor();
    const tBar = a.contextTime + (bar * BEATS_PER_BAR * 60) / a.bpm;
    return Math.round(tBar * this.audioContext.sampleRate) - BOUNDARY_SAFETY_FRAMES;
  }

  // --- Scene dispatch ---

  /** Mount-ordered sequencers that take scene dispatches. */
  sceneTargets(): SceneTargetEntry[] {
    return getParamDirectory()
      .getTargets()
      .filter((e): e is SceneTargetEntry => isPatternAddressable(e.plugin));
  }

  /** Launch: quantized to the next bar while the master runs, immediate
   * recall otherwise (stopped or unsynced). Selection follows the launch. */
  launchScene(index: number) {
    const scene = Math.max(0, Math.min(SCENE_COUNT - 1, Math.round(index)));
    if (this.state.selectedScene !== scene) {
      this.state.selectedScene = scene;
      this.dispatch(SongEvent.SELECTION, this.selectionDetail());
    }
    if (this.isRunning()) {
      this.queuedScene = scene;
      this.dispatch(SongEvent.SELECTION, this.selectionDetail());
    } else {
      this.applySceneNow(scene);
      this.playingScene = scene;
    }
  }

  private applySceneNow(scene: number) {
    this.applySceneAt(scene, 0);
  }

  /** Writes one scene's cells to every mounted sequencer: a pattern cell
   * selects AND unmutes, MUTE mutes, an absent cell touches nothing. frame 0
   * applies now; otherwise sample-exactly on that frame (mod 2^24). */
  private applySceneAt(scene: number, frame: number) {
    const cells = this.state.scenes[scene]?.cells ?? {};
    const at = frame > 0 ? frame % FRAME_WRAP : 0;
    for (const entry of this.sceneTargets()) {
      const cell = cells[entry.slotId];
      if (cell === undefined) continue;
      if (cell === CELL_MUTE) {
        entry.plugin.setMuteAt(true, at);
      } else {
        entry.plugin.selectPatternAt(cell, at);
        entry.plugin.setMuteAt(false, at);
      }
    }
  }

  // --- Scene editing (panel setters; the tick loop reads state) ---

  /** value: 0..39 pattern, CELL_MUTE, or null = "—" (clear to no-change).
   * An edit to the playing scene lands live: immediately while stopped,
   * re-queued for the next bar while running. */
  setCell(scene: number, slotId: string, value: number | null) {
    const s = this.state.scenes[scene];
    if (!s) return;
    if (value === null) delete s.cells[slotId];
    else s.cells[slotId] = Math.max(CELL_MUTE, Math.min(39, Math.round(value)));
    this.dispatch(SongEvent.SCENES, this.copyScenes());
    if (scene !== this.playingScene && scene !== this.queuedScene) return;
    if (this.isRunning()) {
      this.queuedScene = scene;
      this.dispatched = null; // the edit outdates an in-flight dispatch
    } else if (scene === this.playingScene && value !== null) {
      this.applyCellNow(slotId, value);
    }
  }

  private applyCellNow(slotId: string, cell: number) {
    const entry = this.sceneTargets().find((e) => e.slotId === slotId);
    if (!entry) return;
    if (cell === CELL_MUTE) entry.plugin.setMuteAt(true, 0);
    else {
      entry.plugin.selectPatternAt(cell, 0);
      entry.plugin.setMuteAt(false, 0);
    }
  }

  getCell(scene: number, slotId: string): number | null {
    return this.state.scenes[scene]?.cells[slotId] ?? null;
  }

  // --- Reads the panel renders from ---

  getScenes(): SongScene[] {
    return this.copyScenes();
  }

  getSelection() {
    return this.selectionDetail();
  }

  /** Display snapshot for the panel's rAF readout. */
  getPosition() {
    return {
      running: this.clockGateOn,
      bar: this.currentBar,
      playingScene: this.playingScene,
      queuedScene: this.queuedScene,
    };
  }

  private selectionDetail() {
    return {
      selectedScene: this.state.selectedScene,
      playingScene: this.playingScene,
      queuedScene: this.queuedScene,
    };
  }

  private copyScenes(): SongScene[] {
    return this.state.scenes.map((s) => ({ cells: { ...s.cells } }));
  }

  private copyChain() {
    return {
      ...this.state.chain,
      entries: this.state.chain.entries.map((e) => ({ ...e })),
    };
  }

  private dispatch(event: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
}
