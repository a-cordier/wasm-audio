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

import { AudioInState, createAudioInState } from "./types/audio-in-state";
import { AudioInEvent, AudioInStatus } from "./types/audio-in-event";
import { Plugin, PluginDescriptor, AudioProducer } from "../../core/types";

const RAMP_TC = 0.01;
const FFT_SIZE = 256;

export interface AudioInDeviceOption {
  deviceId: string;
  label: string;
}

/**
 * Audio input as a DEVICE (kind:"input"): getUserMedia behind the standard
 * getOutputNode(), so it mounts, routes, folds and persists like any other
 * device. The graph is up from construction — routing captures the output
 * once, and the async mic acquisition connects into it later:
 *
 *   mic (MediaStreamAudioSourceNode) → analyser (panel level LED, pre-mute)
 *                                    └→ monitor (gain 0|1) → output
 *
 * Feedback protection: MONITOR defaults OFF, so an open mic near speakers
 * never loops until the user explicitly opens it. Acquisition is gesture-
 * driven (the panel's ENABLE button) — never an unprompted permission dialog
 * on mount; a session restored with enabled:true reacquires silently, which
 * only succeeds while the permission is still granted.
 */
export class AudioInController extends EventTarget implements Plugin, AudioProducer {
  readonly descriptor: PluginDescriptor = {
    id: "audio-in",
    name: "AUDIO IN",
    kind: "input",
    accent: "var(--audio-in-accent)",
    type: "instrument",
  };

  private readonly monitor: GainNode;
  private readonly output: GainNode;
  private readonly analyser: AnalyserNode;
  private readonly audioContext: AudioContext;
  private state: AudioInState;
  private status: AudioInStatus = "idle";
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private devices: AudioInDeviceOption[] = [];
  private disposed = false;
  private levelBuf: Float32Array<ArrayBuffer> | null = null;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.state = createAudioInState();
    this.monitor = new GainNode(audioContext, { gain: 0 });
    this.output = new GainNode(audioContext, { gain: 1 });
    this.analyser = new AnalyserNode(audioContext, { fftSize: FFT_SIZE, smoothingTimeConstant: 0.8 });
    this.monitor.connect(this.output);
  }

  init() {
    // Restore replays loadState() after init; a fresh mount starts idle and
    // waits for the ENABLE gesture.
    if (this.state.enabled) void this.acquire();
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

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.disposed = true;
    this.releaseStream();
    this.monitor.disconnect();
    this.analyser.disconnect();
    this.output.disconnect();
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createAudioInState(newState as Partial<AudioInState>);
    this.applyMonitor();
    if (this.state.enabled && this.status === "idle") void this.acquire();
    this.notify();
    return this.getState();
  }

  // --- Panel surface ---

  getStatus(): AudioInStatus {
    return this.status;
  }

  getDevices(): AudioInDeviceOption[] {
    return [...this.devices];
  }

  getCurrentDeviceLabel(): string {
    const current = this.devices.find((d) => d.deviceId === this.state.deviceId);
    return current?.label ?? (this.status === "active" ? "DEFAULT" : "—");
  }

  isMonitorOn(): boolean {
    return this.state.monitor;
  }

  /** The panel's ENABLE/RETRY button — the user gesture that opens the mic. */
  enable(): void {
    this.state.enabled = true;
    void this.acquire();
  }

  setMonitor(on: boolean): void {
    this.state.monitor = on;
    this.applyMonitor();
    this.notify();
  }

  /** LCD stepper: cycle through the machine's audio inputs. */
  stepDevice(delta: number): void {
    if (this.devices.length === 0) return;
    const index = this.devices.findIndex((d) => d.deviceId === this.state.deviceId);
    const next = (Math.max(index, 0) + delta + this.devices.length) % this.devices.length;
    this.state.deviceId = this.devices[next].deviceId;
    void this.acquire();
  }

  /** Input level for the panel LED — read pre-monitor, so you can see signal
   * while the monitor mute protects the room. */
  getInputLevel(): number {
    if (this.status !== "active") return 0;
    if (!this.levelBuf || this.levelBuf.length !== this.analyser.fftSize) {
      this.levelBuf = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
    }
    this.analyser.getFloatTimeDomainData(this.levelBuf);
    let peak = 0;
    for (let i = 0; i < this.levelBuf.length; i++) {
      const abs = Math.abs(this.levelBuf[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }

  // --- Capture ---

  private async acquire(): Promise<void> {
    this.status = "pending";
    this.notify();
    try {
      // An instrument input: no voice processing of any kind.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.state.deviceId ? { exact: this.state.deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (this.disposed) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      this.releaseStream();
      this.stream = stream;
      this.source = new MediaStreamAudioSourceNode(this.audioContext, { mediaStream: stream });
      // Mono mics upmix to stereo on these connections (standard up-mix).
      this.source.connect(this.analyser);
      this.source.connect(this.monitor);
      // Remember the device that actually opened (empty id = default).
      this.state.deviceId = stream.getAudioTracks()[0]?.getSettings().deviceId ?? this.state.deviceId;
      this.status = "active";
      await this.refreshDevices();
    } catch (err) {
      this.status = (err as DOMException)?.name === "NotAllowedError" ? "denied" : "error";
    }
    this.notify();
  }

  /** Labels are only populated once permission is granted. */
  private async refreshDevices(): Promise<void> {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      this.devices = all
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `INPUT ${i + 1}` }));
    } catch {
      this.devices = [];
    }
  }

  private releaseStream(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
  }

  private applyMonitor(): void {
    this.monitor.gain.setTargetAtTime(this.state.monitor ? 1 : 0, this.audioContext.currentTime, RAMP_TC);
  }

  private notify(): void {
    this.dispatchEvent(new CustomEvent(AudioInEvent.STATUS, {
      detail: {
        status: this.status,
        monitor: this.state.monitor,
        deviceLabel: this.getCurrentDeviceLabel(),
        deviceCount: this.devices.length,
      },
    }));
  }
}
