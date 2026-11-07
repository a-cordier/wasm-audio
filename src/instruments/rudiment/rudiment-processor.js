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

/**
 * RUDIMENT (drum sequencer) AudioWorklet processor — the DISCHORD scheduler
 * with LANES instead of chords: every step boundary reads one velocity byte
 * per lane and fires every lane that has a hit, so a snare and a clap (or
 * the whole kit) land on the same frame.
 *
 * Produces no pattern audio — it advances a sample-accurate clock and emits
 * frame-stamped MIDI into a SharedArrayBuffer ring when step boundaries are
 * crossed. The only audio out is the metronome click.
 *
 * Polymeter: the scheduler counts a GRID index g (steps since the pattern's
 * origin); lane k plays step g mod its own length (0 = the pattern's STEPS).
 * A pattern switch rebases g, so every lane lands on its step 0 together.
 *
 * THE RING DISCIPLINE (a step is a burst of N notes, the ring is strict FIFO
 * and a future-stamped head blocks everything behind it):
 *   1. reserve room for the WHOLE burst (N ons + N offs) before writing any
 *      of it — a half-written step is a stuck note on gated targets;
 *   2. write all note-ons before any note-off, all on the step's frame;
 *   3. offs follow in on-order on one shared gate-end stamp, strictly after
 *      the ons and strictly before the next onset.
 * Every write sequence must stay frame-monotonic in write order — re-prove
 * this after ANY edit to the emission block. Nothing is ever held (no ties),
 * so stop, pause and mute have nothing to release.
 *
 * Communication:
 *   Main → Worklet (MessagePort): __init_sab, __start, __stop, __pause,
 *     __resume, __pattern_at, __pattern_cancel, __mute, __dispose
 *   Worklet → Main (MessagePort): __position, __pattern_applied,
 *     __mute_applied
 *   Main → Worklet (SAB): config (Float32Array), patterns (Uint8Array)
 *   Worklet → Main (SAB): output MIDI ring buffer
 */

const RENDER_QUANTUM_FRAMES = 128;

// Lookahead for frame-stamped emission (see dischord-processor.js).
const LOOKAHEAD_FRAMES = Math.round(sampleRate * 0.024);

// Frame stamps wrap mod 2^24 so they survive the ring's Float32 slot exactly.
const FRAME_WRAP = 1 << 24;

// ConfigParam indices (mirrors types.ts ConfigParam enum)
const BPM = 0;
const SUBDIVISION = 1;
const SWING = 2;
const GATE = 3;
const OUTPUT_CHANNEL = 4;
const ACTIVE_PATTERN = 5;
const SWITCH_MODE = 6;
const METRONOME = 7;
const LANE_NOTE_BASE = 8;
const LANE_MUTE_BASE = 24;

const SWITCH_IMMEDIATE = 0;
const SWITCH_CYCLE = 1;

// MIDI status nibbles
const NOTE_ON = 0x09;
const NOTE_OFF = 0x08;

// Pattern buffer layout (mirrors types.ts)
const LANE_COUNT = 11;
const LANE_CAPACITY = 16;
const MAX_STEPS = 64;
const PATTERN_COUNT = 40;
const LANE_BYTES = MAX_STEPS;
const PATTERN_BYTES = LANE_CAPACITY * LANE_BYTES; // 1024
const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 40960
const LANE_LENGTHS_OFFSET = LENGTHS_OFFSET + PATTERN_COUNT; // 41000

// Metronome click
const BEATS_PER_BAR = 4;
const CLICK_SECONDS = 0.03;
const CLICK_DECAY = 14;
const CLICK_LEVEL = 0.3;
const CLICK_HZ = 1174;
const CLICK_ACCENT_HZ = 1760;

// Ring buffer layout
const MIDI_EVENT_SIZE = 4;
const HEADER_INTS = 2;
const HEADER_BYTES = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT;

function mod(a, n) {
  return ((a % n) + n) % n;
}

class RudimentProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this._alive = true;
    this._running = false;
    this._lastReportedGrid = null;

    // Pattern selection. `_stepOrigin` rebases the grid so a pattern change
    // can hold its position (or land on step 0) without restarting the clock.
    this._activePattern = 0;
    this._pendingPattern = -1;
    this._stepOrigin = 0;

    // Song-mode addressing (the DISCHORD/sequels contract): frame-targeted
    // switch, worklet as single authority, `_targetedSwitch` suppressing the
    // per-block config check until the main thread's write catches up.
    this._muted = false;
    this._pendingPatternAt = -1;
    this._pendingPatternIndex = -1;
    this._pendingMuteAt = -1;
    this._pendingMuteVal = false;
    this._targetedSwitch = false;

    // Metronome click voice
    this._clickLeft = 0;
    this._clickTotal = 1;
    this._clickPhase = 0;
    this._clickOmega = 0;

    // Fractional grid position (audible clock), advanced per sample.
    this._stepPos = 0;
    this._currentGrid = null;

    // The SCHEDULING clock: the same position, LOOKAHEAD_FRAMES ahead.
    this._schedLastRawStep = -1;
    this._schedCurrentGrid = null;

    // Scheduled metronome clicks (tiny ring: beat period >> lookahead).
    this._clickQueueFrame = new Float64Array(4);
    this._clickQueueAccent = new Uint8Array(4);
    this._clickQueueRead = 0;
    this._clickQueueWrite = 0;

    // Armed start frame (mod 2^24); 0 = none.
    this._pendingStartFrame = 0;

    // Per-block lane config (read once per process() call, so one step never
    // mixes two versions of the kit map).
    this._blkNotes = new Int16Array(LANE_CAPACITY);
    this._blkMutes = new Uint8Array(LANE_CAPACITY);

    // Burst scratch (preallocated — process() stays allocation-free).
    this._burstNotes = new Int16Array(LANE_CAPACITY);
    this._burstVels = new Uint8Array(LANE_CAPACITY);

    // SAB views (set via __init_sab)
    this._configView = null;
    this._hitsView = null;
    this._lengthsView = null;
    this._laneLengthsView = null;
    this._ringHeads = null;
    this._ringData = null;
    this._ringCapacity = 0;

    this.port.onmessage = (e) => this._onMessage(e.data);
  }

  _onMessage(msg) {
    switch (msg.type) {
      case "__init_sab":
        this._configView = new Float32Array(msg.configBuffer);
        this._hitsView = new Uint8Array(msg.patternBuffer, 0, LENGTHS_OFFSET);
        this._lengthsView = new Uint8Array(msg.patternBuffer, LENGTHS_OFFSET, PATTERN_COUNT);
        this._laneLengthsView = new Uint8Array(msg.patternBuffer, LANE_LENGTHS_OFFSET, PATTERN_COUNT * LANE_CAPACITY);
        this._ringHeads = new Int32Array(msg.ringBuffer, 0, HEADER_INTS);
        this._ringData = new Float32Array(msg.ringBuffer, HEADER_BYTES);
        this._ringCapacity = (msg.ringBuffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
        break;
      case "__start":
        // Park the clock until the requested frame (0 = start immediately):
        // every synced sequencer receives the SAME frame from the master.
        this._pendingStartFrame = msg.startAtFrame > 0 ? msg.startAtFrame % FRAME_WRAP : 0;
        this._stepPos = 0;
        this._stepOrigin = 0;
        this._currentGrid = null;
        this._lastReportedGrid = null;
        this._schedLastRawStep = -1;
        this._schedCurrentGrid = null;
        this._clickQueueRead = 0;
        this._clickQueueWrite = 0;
        this._pendingPattern = -1;
        this._clearTargets();
        this._activePattern = this._configView ? Math.round(this._configView[ACTIVE_PATTERN]) : 0;
        this._running = true;
        break;
      case "__pause":
        // Gated note-offs are already frame-stamped in the ring.
        this._running = false;
        break;
      case "__resume":
        this._running = true;
        break;
      case "__stop":
        this._running = false;
        this._pendingStartFrame = 0;
        // Targeted switches die with the timeline; the mute flag survives —
        // the song module owns re-applying or lifting it.
        this._clearTargets();
        // _clickLeft is NOT zeroed (the burst rings out instead of popping);
        // queued, not-yet-audible clicks are dropped.
        this._clickQueueRead = this._clickQueueWrite;
        this._currentGrid = null;
        this._lastReportedGrid = null;
        this.port.postMessage({ type: "__position", step: -1, grid: -1 });
        break;
      case "__pattern_at":
        this._pendingPatternIndex = msg.index;
        this._pendingPatternAt = msg.frame % FRAME_WRAP;
        this._targetedSwitch = true;
        this._pendingPattern = -1;
        break;
      case "__pattern_cancel":
        this._pendingPatternAt = -1;
        this._pendingPatternIndex = -1;
        break;
      case "__mute":
        if (msg.frame > 0) {
          this._pendingMuteAt = msg.frame % FRAME_WRAP;
          this._pendingMuteVal = !!msg.muted;
        } else {
          this._pendingMuteAt = -1;
          this._applyMute(!!msg.muted);
        }
        break;
      case "__dispose":
        this._running = false;
        this._alive = false;
        break;
    }
  }

  _clearTargets() {
    this._pendingPatternAt = -1;
    this._pendingPatternIndex = -1;
    this._pendingMuteAt = -1;
    this._targetedSwitch = false;
  }

  process(inputs, outputs) {
    if (!this._alive) return false;

    const out = outputs[0] && outputs[0][0];

    if (!this._running || !this._configView || !this._lengthsView) {
      if (out && this._clickLeft > 0) {
        for (let frame = 0; frame < RENDER_QUANTUM_FRAMES; frame++) {
          out[frame] = this._clickSample();
        }
      }
      return true;
    }

    const bpm = this._configView[BPM];
    const subdivision = this._configView[SUBDIVISION];
    const swing = this._configView[SWING] / 100;
    const gate = this._configView[GATE] / 100;
    const channel = Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f;
    const switchMode = Math.round(this._configView[SWITCH_MODE]);

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      this._blkNotes[lane] = Math.round(this._configView[LANE_NOTE_BASE + lane]) & 0x7f;
      this._blkMutes[lane] = this._configView[LANE_MUTE_BASE + lane] === 1 ? 1 : 0;
    }

    const requested = Math.round(this._configView[ACTIVE_PATTERN]);
    if (this._targetedSwitch) {
      if (requested === this._activePattern) this._targetedSwitch = false;
      this._pendingPattern = -1;
    } else if (requested !== this._activePattern) {
      this._pendingPattern = requested;
    } else {
      this._pendingPattern = -1;
    }

    const stepsPerSecond = (bpm / 60) * subdivision;
    const samplesPerStep = sampleRate / stepsPerSecond;
    const stepInc = stepsPerSecond / sampleRate;

    const beatSteps = Math.max(1, Math.round(subdivision));
    const barSteps = beatSteps * BEATS_PER_BAR;

    for (let frame = 0; frame < RENDER_QUANTUM_FRAMES; frame++) {
      // Parked start: the scheduling clock pre-rolls through the countdown,
      // so the downbeat burst is already in flight, stamped ON the start frame.
      if (this._pendingStartFrame !== 0) {
        let d = (this._pendingStartFrame - ((currentFrame + frame) % FRAME_WRAP)) % FRAME_WRAP;
        if (d < -(1 << 23)) d += FRAME_WRAP;
        if (d > (1 << 23)) d -= FRAME_WRAP;
        if (d > 0) {
          this._serviceClickQueue(currentFrame + frame);
          if (out) out[frame] = this._clickSample();
          const preRollPos = (LOOKAHEAD_FRAMES - d) * stepInc;
          if (preRollPos >= 0) {
            this._runScheduler(
              preRollPos, currentFrame + frame + LOOKAHEAD_FRAMES,
              samplesPerStep, swing, gate, channel, switchMode, beatSteps, barSteps
            );
          }
          continue;
        }
        this._pendingStartFrame = 0;
      }

      this._serviceClickQueue(currentFrame + frame);
      if (out) out[frame] = this._clickSample();

      // ---- The SCHEDULING clock (audible clock + LOOKAHEAD_FRAMES) ----
      this._runScheduler(
        this._stepPos + LOOKAHEAD_FRAMES * stepInc,
        currentFrame + frame + LOOKAHEAD_FRAMES,
        samplesPerStep, swing, gate, channel, switchMode, beatSteps, barSteps
      );

      // ---- The AUDIBLE clock: position reports only ----
      const rawStep = Math.floor(this._stepPos);
      const grid = rawStep - this._stepOrigin;
      if (grid !== this._currentGrid && grid >= 0) {
        const isSwungStep = (rawStep % 2) === 1;
        if (!(isSwungStep && swing > 0 && (this._stepPos - rawStep) < swing * 0.5)) {
          this._currentGrid = grid;
          if (grid !== this._lastReportedGrid) {
            this._lastReportedGrid = grid;
            const steps = this._lengthsView[this._activePattern] || 1;
            this.port.postMessage({ type: "__position", step: grid % steps, grid });
          }
        }
      }

      this._stepPos += stepInc;
    }

    return true;
  }

  /**
   * One tick of the scheduling clock at grid position `schedPos`, whose
   * crossing (if any) is audible at `onsetFrame`. Shared by the running loop
   * and the parked pre-roll before an armed start frame.
   */
  _runScheduler(schedPos, onsetFrame, samplesPerStep, swing, gate, channel, switchMode, beatSteps, barSteps) {
    const schedRaw = Math.floor(schedPos);

    // Stamp the BOUNDARY's grid time, not this tick's position time, so a
    // late-detected crossing still lands on the exact grid frame.
    const boundaryOnset = Math.round(onsetFrame - (schedPos - schedRaw) * samplesPerStep);

    if (schedRaw !== this._schedLastRawStep) {
      this._applyTargeted(schedRaw, boundaryOnset);
      this._applyPendingPattern(schedRaw, switchMode);
      if (schedRaw % beatSteps === 0) {
        this._scheduleClick(boundaryOnset, schedRaw % barSteps === 0);
      }
      this._schedLastRawStep = schedRaw;
    }

    const grid = schedRaw - this._stepOrigin;
    if (grid < 0 || grid === this._schedCurrentGrid) return;

    // Swing on the scheduling clock: odd raw steps wait swing/2 of a step.
    const isSwungStep = (schedRaw % 2) === 1;
    if (isSwungStep && swing > 0 && (schedPos - schedRaw) < swing * 0.5) return;

    this._schedCurrentGrid = grid;
    const emitOnset = isSwungStep && swing > 0
      ? boundaryOnset + Math.round(swing * 0.5 * samplesPerStep)
      : boundaryOnset;

    if (this._muted) return; // song-mode mute: no note-ons, nothing held

    this._emitStep(grid, channel, emitOnset, schedPos, schedRaw, samplesPerStep, swing, gate);
  }

  /**
   * Fires every lane with a hit at grid index `grid`. See the ring-discipline
   * comment at the top of the file — the write order here is load-bearing.
   */
  _emitStep(grid, channel, emitOnset, schedPos, schedRaw, samplesPerStep, swing, gate) {
    const pattern = this._activePattern;
    const patternLength = this._lengthsView[pattern] || 1;
    const hitsBase = pattern * PATTERN_BYTES;
    const laneLengthsBase = pattern * LANE_CAPACITY;

    // Collect the burst. Two lanes on the same note (layering, or a kit map
    // that doubles up) fire once at the louder velocity — two ons for one
    // note would retrigger a gated voice and orphan an off.
    let n = 0;
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (this._blkMutes[lane] === 1) continue;
      const laneLength = this._laneLengthsView[laneLengthsBase + lane] || patternLength;
      const velocity = this._hitsView[hitsBase + lane * LANE_BYTES + mod(grid, laneLength)] & 0x7f;
      if (velocity === 0) continue;
      const note = this._blkNotes[lane];
      let k = 0;
      while (k < n && this._burstNotes[k] !== note) k++;
      if (k < n) {
        if (velocity > this._burstVels[k]) this._burstVels[k] = velocity;
      } else {
        this._burstNotes[n] = note;
        this._burstVels[n] = velocity;
        n++;
      }
    }
    if (n === 0) return;

    // 1. Reserve the whole burst (ons + offs) or skip the step entirely.
    if (this._ringFree() < 2 * n) return;

    // The gate is bounded by the next onset (swing-aware), so a long gate
    // never lets an off land after the next step's ons.
    const samplesToNextStep = (1 + schedRaw - schedPos) * samplesPerStep;
    const nextIsSwung = ((schedRaw + 1) % 2) === 1;
    const nextOnsetIn = samplesToNextStep
      + (nextIsSwung && swing > 0 ? samplesPerStep * swing * 0.5 : 0);
    const gateLength = Math.min(
      Math.round(samplesPerStep * gate),
      Math.max(1, Math.floor(nextOnsetIn) - 1)
    );
    const gateEnd = emitOnset + Math.max(1, gateLength);

    // 2. All ons on the step's frame, lane order.
    for (let k = 0; k < n; k++) {
      this._enqueueMidi(NOTE_ON, channel, this._burstNotes[k], this._burstVels[k], emitOnset);
    }
    // 3. Offs in on-order on one shared, later stamp.
    for (let k = 0; k < n; k++) {
      this._enqueueMidi(NOTE_OFF, channel, this._burstNotes[k], 0, gateEnd);
    }
  }

  /** Free slots in the output ring (capacity − 1 usable, SPSC). */
  _ringFree() {
    if (!this._ringHeads) return 0;
    const read = Atomics.load(this._ringHeads, 0);
    const write = Atomics.load(this._ringHeads, 1);
    return (read - write - 1 + this._ringCapacity) % this._ringCapacity;
  }

  /**
   * Fires frame-targeted pattern/mute changes (song mode) when the scheduling
   * clock reaches the first step boundary at or past the target frame; the
   * grid rebases so every lane's step 0 lands exactly there.
   */
  _applyTargeted(schedRaw, boundaryOnset) {
    if (this._pendingPatternAt >= 0 && this._frameDue(boundaryOnset, this._pendingPatternAt)) {
      this._stepOrigin = schedRaw;
      this._activePattern = this._pendingPatternIndex;
      this._pendingPatternAt = -1;
      this._pendingPatternIndex = -1;
      this._pendingPattern = -1;
      this._currentGrid = null;
      this._schedCurrentGrid = null;
      this.port.postMessage({ type: "__pattern_applied", index: this._activePattern });
    }
    if (this._pendingMuteAt >= 0 && this._frameDue(boundaryOnset, this._pendingMuteAt)) {
      const muted = this._pendingMuteVal;
      this._pendingMuteAt = -1;
      this._applyMute(muted);
    }
  }

  /** Signed wrap-fold distance (the __start idiom): due when target <= now. */
  _frameDue(nowFrame, target) {
    let d = (target - (nowFrame % FRAME_WRAP)) % FRAME_WRAP;
    if (d < -(1 << 23)) d += FRAME_WRAP;
    if (d > (1 << 23)) d -= FRAME_WRAP;
    return d <= 0;
  }

  _applyMute(muted) {
    // Nothing is held, so a mute needs no releases: frame-stamped offs
    // already in the ring flow out on their own.
    this._muted = muted;
    this.port.postMessage({ type: "__mute_applied", muted });
  }

  /**
   * Switches to the queued pattern, rebasing the grid so the clock keeps
   * running unbroken. IMMEDIATE holds the pattern position (step 0 when the
   * new pattern is too short); CYCLE waits for the running pattern's cycle
   * end. Lanes then derive their own positions from the rebased grid.
   */
  _applyPendingPattern(rawStep, switchMode) {
    if (this._pendingPattern < 0) return;

    const currentLength = this._lengthsView[this._activePattern] || 1;
    const enteringIndex = mod(rawStep - this._stepOrigin, currentLength);
    const atCycleEnd = enteringIndex === 0;

    if (switchMode !== SWITCH_IMMEDIATE && !atCycleEnd) return;

    const newLength = this._lengthsView[this._pendingPattern] || 1;
    const target = switchMode === SWITCH_CYCLE
      ? 0
      : (enteringIndex < newLength ? enteringIndex : 0);

    this._stepOrigin = rawStep - target;
    this._activePattern = this._pendingPattern;
    this._pendingPattern = -1;
    this._currentGrid = null;
    this._schedCurrentGrid = null;
  }

  /** Short decaying sine; the accent sits a fifth or so higher. */
  _triggerClick(accent) {
    if (!this._configView || this._configView[METRONOME] !== 1) return;
    this._clickTotal = Math.max(1, Math.round(sampleRate * CLICK_SECONDS));
    this._clickLeft = this._clickTotal;
    this._clickPhase = 0;
    this._clickOmega = (2 * Math.PI * (accent ? CLICK_ACCENT_HZ : CLICK_HZ)) / sampleRate;
  }

  _clickSample() {
    if (this._clickLeft <= 0) return 0;
    const t = 1 - this._clickLeft / this._clickTotal;
    const sample = Math.sin(this._clickPhase) * Math.exp(-t * CLICK_DECAY) * CLICK_LEVEL;
    this._clickPhase += this._clickOmega;
    this._clickLeft--;
    return sample;
  }

  _scheduleClick(frame, accent) {
    const next = (this._clickQueueWrite + 1) % this._clickQueueFrame.length;
    if (next === this._clickQueueRead) return;
    this._clickQueueFrame[this._clickQueueWrite] = frame;
    this._clickQueueAccent[this._clickQueueWrite] = accent ? 1 : 0;
    this._clickQueueWrite = next;
  }

  _serviceClickQueue(nowFrame) {
    while (this._clickQueueRead !== this._clickQueueWrite) {
      if (nowFrame < this._clickQueueFrame[this._clickQueueRead]) return;
      this._triggerClick(this._clickQueueAccent[this._clickQueueRead] === 1);
      this._clickQueueRead = (this._clickQueueRead + 1) % this._clickQueueFrame.length;
    }
  }

  _enqueueMidi(status, channel, data1, data2, frame) {
    if (!this._ringHeads || !this._ringData) return;

    const write = Atomics.load(this._ringHeads, 1);
    const nextWrite = (write + 1) % this._ringCapacity;
    if (nextWrite === Atomics.load(this._ringHeads, 0)) return; // full (reserved — never here)

    const packed = ((status & 0x0f) << 20) |
      ((channel & 0x0f) << 16) |
      ((data1 & 0x7f) << 8) |
      (data2 & 0x7f);

    const offset = write * MIDI_EVENT_SIZE;
    this._ringData[offset] = packed;
    this._ringData[offset + 1] = currentTime * 1000; // ms
    this._ringData[offset + 2] = 0;
    this._ringData[offset + 3] = frame > 0 ? frame % FRAME_WRAP : 0;

    Atomics.store(this._ringHeads, 1, nextWrite);
  }
}

registerProcessor("rudiment", RudimentProcessor);
