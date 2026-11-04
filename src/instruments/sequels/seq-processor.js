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
 * Sequencer AudioWorklet processor.
 *
 * Produces no audio output — its sole job is to advance a sample-accurate clock
 * and emit MIDI events into a SharedArrayBuffer ring buffer when step boundaries
 * are crossed.
 *
 * Communication:
 *   Main → Worklet (MessagePort): __init_sab, __start, __stop, __pause, __resume
 *   Worklet audio out: metronome click only (no pattern audio)
 *   Worklet → Main (MessagePort): __position (current step, for UI highlight)
 *   Main → Worklet (SAB): config (Float32Array), patterns (Uint8Array)
 *   Worklet → Main (SAB): output MIDI ring buffer
 */

const RENDER_QUANTUM_FRAMES = 128;

// Lookahead for frame-stamped emission: enough to cover the 10 ms main-thread
// drain hop plus scheduling slack, so every event reaches the instrument ring
// BEFORE its audible frame. The whole sequence therefore sounds a constant
// LOOKAHEAD after "start" (imperceptible) instead of each note jittering by
// whatever the drain happened to add.
const LOOKAHEAD_FRAMES = Math.round(sampleRate * 0.024);

// Frame stamps wrap mod 2^24 so they survive the ring's Float32 slot exactly.
const FRAME_WRAP = 1 << 24;

// ConfigParam indices (mirrors types.ts ConfigParam enum)
const BPM = 0;
const SUBDIVISION = 1;
const SWING = 2;
const GATE = 3;
const DIRECTION = 4;
const LOOP = 5;
const OUTPUT_CHANNEL = 6;
const ACTIVE_PATTERN = 7;
const SWITCH_MODE = 8;
const TRANSPOSE = 9;
const METRONOME = 10;

// Direction enum values
const DIR_FORWARD = 0;
const DIR_REVERSE = 1;
const DIR_PING_PONG = 2;
const DIR_RANDOM = 3;

// SwitchMode enum values
const SWITCH_IMMEDIATE = 0;
const SWITCH_CYCLE = 1;

// MIDI status nibbles
const NOTE_ON = 0x09;
const NOTE_OFF = 0x08;

// Pattern buffer layout (mirrors types.ts)
const MAX_STEPS = 64;
const STEP_SLOT_SIZE = 2;
const SLIDE_BIT = 0x80; // high bit of the velocity byte = 303-style slide tie
const PATTERN_COUNT = 40;
const PATTERN_BYTES = MAX_STEPS * STEP_SLOT_SIZE; // 128
const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 5120

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

class SeqProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this._alive = true;
    this._running = false;
    this._sampleCounter = 0;
    this._currentStep = -1;
    this._lastReportedStep = -1;
    this._pingPongForward = true;
    this._lastRandomRaw = -1;
    this._lastRandomStep = 0;

    // Pattern selection. `_stepOrigin` rebases the step grid so a pattern
    // change can hold its position without restarting the clock.
    this._activePattern = 0;
    this._pendingPattern = -1;
    this._stepOrigin = 0;
    this._lastRawStep = -1;

    // Song-mode addressing: a frame-targeted pattern switch and a
    // scheduler-level mute (note-ons gated, frame-stamped note-offs still
    // flow; an open slide is released at the boundary). The worklet is the
    // single authority: the main thread writes ACTIVE_PATTERN only after
    // __pattern_applied comes back, and `_targetedSwitch` suppresses the
    // per-block config check until that write catches up — otherwise the
    // stale config value would queue a switch BACK during the round-trip.
    this._muted = false;
    this._pendingPatternAt = -1; // target frame (mod 2^24); -1 = none
    this._pendingPatternIndex = -1;
    this._pendingMuteAt = -1; // target frame (mod 2^24); -1 = none
    this._pendingMuteVal = false;
    this._targetedSwitch = false;

    // Metronome click voice
    this._clickLeft = 0;
    this._clickTotal = 1;
    this._clickPhase = 0;
    this._clickOmega = 0;

    // Count-in pre-roll (samples). While it drains the clock does not advance.
    this._countInLeft = 0;
    this._countInTotal = 0;
    this._countInLastStep = -1;

    // Fractional grid position, advanced per sample by the current step rate.
    this._stepPos = 0;
    this._cachedLogicalStep = 0;

    // The SCHEDULING clock: the same grid position, LOOKAHEAD_FRAMES ahead.
    // Note events are emitted when IT crosses a boundary, frame-stamped with
    // the audible onset, so the main-thread drain hop adds latency but never
    // jitter. Pattern switches, swing and gate offs ride this clock; the
    // metronome click and position reports stay on the audible clock.
    this._schedLastRawStep = -1;
    this._schedCurrentStep = -1;
    this._schedLogicalStep = 0;

    // Scheduled metronome clicks (tiny ring: beat period >> lookahead).
    this._clickQueueFrame = new Float64Array(4);
    this._clickQueueAccent = new Uint8Array(4);
    this._clickQueueRead = 0;
    this._clickQueueWrite = 0;

    // Armed start frame (mod 2^24); 0 = none.
    this._pendingStartFrame = 0;

    // The note a slide step is holding open, deferred past the next note-on so
    // the two overlap and a legato monolog glides instead of retriggering.
    // -1 when no slide is tied through.
    this._slideNote = -1;

    // SAB views (set via __init_sab)
    this._configView = null;
    this._patternView = null;
    this._lengthsView = null;
    this._ringHeads = null;
    this._ringData = null;
    this._ringCapacity = 0;

    this.port.onmessage = (e) => this._onMessage(e.data);
  }

  _onMessage(msg) {
    switch (msg.type) {
      case "__init_sab":
        this._configView = new Float32Array(msg.configBuffer);
        this._patternView = new Uint8Array(msg.patternBuffer, 0, LENGTHS_OFFSET);
        this._lengthsView = new Uint8Array(msg.patternBuffer, LENGTHS_OFFSET, PATTERN_COUNT);
        this._ringHeads = new Int32Array(msg.ringBuffer, 0, HEADER_INTS);
        this._ringData = new Float32Array(msg.ringBuffer, HEADER_BYTES);
        this._ringCapacity = (msg.ringBuffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
        break;
      case "__start":
        this._countInLeft = 0;
        this._countInTotal = 0;
        this._countInLastStep = -1;
        if (msg.countInSteps > 0 && this._configView) {
          const spb = sampleRate / ((this._configView[BPM] / 60) * this._configView[SUBDIVISION]);
          this._countInTotal = Math.round(msg.countInSteps * spb);
          this._countInLeft = this._countInTotal;
        }
        // Park the clock until the requested frame (0 = start immediately):
        // every synced sequencer receives the SAME frame from the master, so
        // they share a sample-aligned downbeat.
        this._pendingStartFrame = msg.startAtFrame > 0 ? msg.startAtFrame % FRAME_WRAP : 0;
        this._sampleCounter = 0;
        this._stepPos = 0;
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this._pingPongForward = true;
        this._slideNote = -1;
        this._stepOrigin = 0;
        this._lastRawStep = -1;
        this._schedLastRawStep = -1;
        this._schedCurrentStep = -1;
        this._clickQueueRead = 0;
        this._clickQueueWrite = 0;
        this._pendingPattern = -1;
        this._clearTargets();
        this._activePattern = this._configView ? Math.round(this._configView[ACTIVE_PATTERN]) : 0;
        this._running = true;
        break;
      case "__pause":
        // Freeze the clock but keep the sample counter and current step, so
        // __resume picks up exactly where playback left off. Gated note-offs
        // are already frame-stamped in the ring — they release on their own.
        this._running = false;
        this._releaseSlide();
        break;
      case "__resume":
        this._running = true;
        break;
      case "__stop":
        this._running = false;
        this._countInLeft = 0;
        this._pendingStartFrame = 0;
        // Targeted switches die with the timeline; the mute flag itself
        // survives — the song module owns re-applying or lifting it.
        this._clearTargets();
        // _clickLeft deliberately NOT zeroed: the burst rings out through the
        // stopped-transport path instead of truncating mid-sine (a pop).
        // Queued (not yet audible) clicks are dropped, though.
        this._clickQueueRead = this._clickQueueWrite;
        this._releaseSlide();
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this.port.postMessage({ type: "__position", step: -1 });
        break;
      case "__pattern_at":
        // Frame-targeted switch (song mode): applied by the scheduler at the
        // first step boundary at/past the frame, landing the new pattern's
        // step 0 exactly there. Replaces any pending target — last wins.
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
          this._applyMute(!!msg.muted, 0);
        }
        break;
      case "__dispose":
        // Returning false from process() lets the node be garbage collected.
        this._running = false;
        this._releaseSlide();
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
      // A click that was sounding when the transport stopped rings out here
      // instead of truncating mid-sine (a pop).
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
    const direction = this._configView[DIRECTION];
    const loop = this._configView[LOOP] === 1;
    const channel = Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f;
    const switchMode = Math.round(this._configView[SWITCH_MODE]);
    const transpose = Math.round(this._configView[TRANSPOSE]);

    // Queue a pattern change requested by the main thread; it is applied at
    // the next step boundary (or the next cycle end, depending on the mode).
    const requested = Math.round(this._configView[ACTIVE_PATTERN]);
    if (this._targetedSwitch) {
      // A frame-targeted switch is in flight (or applied, awaiting the main
      // thread's config sync): the config value is stale by design, so it
      // must not queue a switch of its own. Clears once config catches up.
      if (requested === this._activePattern) this._targetedSwitch = false;
      this._pendingPattern = -1;
    } else if (requested !== this._activePattern) {
      this._pendingPattern = requested;
    } else {
      this._pendingPattern = -1;
    }

    // Samples per step (base, before swing)
    const beatsPerSecond = bpm / 60;
    const stepsPerBeat = subdivision;
    const stepsPerSecond = beatsPerSecond * stepsPerBeat;
    const samplesPerStep = sampleRate / stepsPerSecond;
    // The grid position accumulates fractionally: a tempo change alters the
    // RATE from here on. Deriving the step from the whole sample history
    // (floor(absolute / samplesPerStep)) teleported the sequence on any BPM
    // nudge — 120 -> 121 after a minute jumped ~4 steps.
    const stepInc = stepsPerSecond / sampleRate;

    const beatSteps = Math.max(1, Math.round(subdivision));
    const barSteps = beatSteps * BEATS_PER_BAR;

    for (let frame = 0; frame < RENDER_QUANTUM_FRAMES; frame++) {
      // Parked start: the audible clock waits for the armed frame, but the
      // SCHEDULING clock pre-rolls through the countdown (schedPos runs from
      // -lookahead up to 0), so the first notes and the downbeat click are
      // already in flight, stamped exactly ON the start frame — the lookahead
      // overlaps the start lead instead of adding to it.
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
              preRollPos,
              currentFrame + frame + LOOKAHEAD_FRAMES,
              samplesPerStep, swing, gate, channel, transpose,
              direction, loop, switchMode, beatSteps, barSteps
            );
          }
          continue;
        }
        this._pendingStartFrame = 0;
      }

      // Count-in: clicks only, the pattern clock stays parked at zero.
      if (this._countInLeft > 0) {
        const elapsed = this._countInTotal - this._countInLeft;
        const countStep = Math.floor(elapsed / samplesPerStep);
        if (countStep !== this._countInLastStep) {
          this._countInLastStep = countStep;
          if (countStep % beatSteps === 0) this._triggerClick(countStep % barSteps === 0);
        }
        if (out) out[frame] = this._clickSample();
        this._countInLeft--;
        if (this._countInLeft <= 0) {
          this._sampleCounter = 0;
          this._stepPos = 0;
          this._lastRawStep = -1;
          this._currentStep = -1;
        }
        continue;
      }

      this._serviceClickQueue(currentFrame + frame);
      if (out) out[frame] = this._clickSample();

      // ---- The SCHEDULING clock (audible clock + LOOKAHEAD_FRAMES) ----
      // Runs the exact firing logic the audible clock used to run, but early:
      // events are enqueued frame-stamped with their audible onset, so the
      // main-thread drain hop adds a constant delay instead of jitter.
      this._runScheduler(
        this._stepPos + LOOKAHEAD_FRAMES * stepInc,
        currentFrame + frame + LOOKAHEAD_FRAMES,
        samplesPerStep, swing, gate, channel, transpose,
        direction, loop, switchMode, beatSteps, barSteps
      );

      // ---- The AUDIBLE clock: position reports + end-of-sequence ----
      const rawStep = Math.floor(this._stepPos);

      if (rawStep !== this._lastRawStep) {
        this._lastRawStep = rawStep;
        const steps = this._lengthsView[this._activePattern] || 1;
        this._cachedLogicalStep = this._resolveStep(rawStep - this._stepOrigin, steps, direction, loop);
      }

      const logicalStep = this._cachedLogicalStep;

      if (logicalStep === -1) {
        // End of a non-looping sequence (the scheduler stopped emitting one
        // lookahead earlier). Tell the main thread, otherwise it keeps
        // believing the transport is running.
        this._running = false;
        this._releaseSlide();
        this.port.postMessage({ type: "__position", step: -1 });
        this.port.postMessage({ type: "__stopped" });
        return true;
      }

      if (logicalStep !== this._currentStep) {
        const isSwungStep = (rawStep % 2) === 1;
        if (!(isSwungStep && swing > 0 && (this._stepPos - rawStep) < swing * 0.5)) {
          this._currentStep = logicalStep;
          if (logicalStep !== this._lastReportedStep) {
            this._lastReportedStep = logicalStep;
            this.port.postMessage({ type: "__position", step: logicalStep });
          }
        }
      }

      this._sampleCounter++;
      this._stepPos += stepInc;
    }

    return true;
  }

  /**
   * One tick of the scheduling clock at grid position `schedPos`, whose
   * crossing (if any) is audible at `onsetFrame`. Shared by the running loop
   * (schedPos = stepPos + lookahead) and the PARKED pre-roll before an armed
   * start frame (schedPos derived from the countdown), so the first notes of
   * a synced start are already in flight and sound exactly ON the downbeat.
   */
  _runScheduler(schedPos, onsetFrame, samplesPerStep, swing, gate, channel, transpose, direction, loop, switchMode, beatSteps, barSteps) {
    const schedRaw = Math.floor(schedPos);

    // Stamp the BOUNDARY's grid time, not this tick's position time: when a
    // crossing is detected late (an armed start arriving mid-window), the
    // grid stays exact — every synced child stamps the identical downbeat
    // frame regardless of message arrival jitter.
    const boundaryOnset = Math.round(onsetFrame - (schedPos - schedRaw) * samplesPerStep);

    if (schedRaw !== this._schedLastRawStep) {
      this._applyTargeted(schedRaw, boundaryOnset);
      this._applyPendingPattern(schedRaw, switchMode);
      // Metronome follows the SCHEDULED beat so click and notes stay
      // aligned; the click itself fires when its stamped frame arrives.
      if (schedRaw % beatSteps === 0) {
        this._scheduleClick(boundaryOnset, schedRaw % barSteps === 0);
      }
      this._schedLastRawStep = schedRaw;
      const schedSteps = this._lengthsView[this._activePattern] || 1;
      this._schedLogicalStep = this._resolveStep(schedRaw - this._stepOrigin, schedSteps, direction, loop);
    }

    const schedLogical = this._schedLogicalStep;

    // Swing on the scheduling clock: same phase comparison as before.
    if (schedLogical !== -1 && schedLogical !== this._schedCurrentStep) {
      const isSwungStep = (schedRaw % 2) === 1;
      if (!(isSwungStep && swing > 0 && (schedPos - schedRaw) < swing * 0.5)) {
        this._schedCurrentStep = schedLogical;
        // A swung step's audible onset sits swing/2 into the step.
        const emitOnset = isSwungStep && swing > 0
          ? boundaryOnset + Math.round(swing * 0.5 * samplesPerStep)
          : boundaryOnset;

        // Read the active pattern at this step. The velocity byte packs the
        // slide flag in its high bit.
        const offset = this._activePattern * PATTERN_BYTES + schedLogical * STEP_SLOT_SIZE;
        const note = this._patternView[offset];
        const velByte = this._patternView[offset + 1];
        const velocity = velByte & 0x7f;
        const slide = (velByte & SLIDE_BIT) !== 0;

        // Transpose is applied on the way out; the pattern itself is
        // untouched, and the off is stamped for the note actually sent so
        // changing transpose mid-gate can never strand a note-off.
        const played = note + transpose;
        const heldSlide = this._slideNote;

        if (this._muted) {
          // Muted (song mode): no note-ons. Gated offs already in the ring
          // flow out on their own; the open slide was released when the mute
          // applied, so there is nothing to hold here.
        } else if (note > 0 && velocity > 0 && played > 0 && played < 128) {
          // Fire the new note ON first. If the previous step slid, its note
          // is still held, so this overlap makes a legato monolog glide.
          this._enqueueNoteOn(played, velocity, channel, emitOnset);
          if (heldSlide >= 0) this._enqueueNoteOff(heldSlide, channel, emitOnset);

          if (slide) {
            // Tie: hold this note open (no gated off) until the next note-on.
            this._slideNote = played;
          } else {
            this._slideNote = -1;
            // The gated off is stamped NOW (no pending queue needed — the
            // ring holds it until its frame), clamped to land before the
            // next step's onset so a swung high-gate step can never choke
            // a repeated pitch.
            const samplesToNextStep = (1 + schedRaw - schedPos) * samplesPerStep;
            const nextIsSwung = ((schedRaw + 1) % 2) === 1;
            const nextOnsetIn = samplesToNextStep
              + (nextIsSwung && swing > 0 ? samplesPerStep * swing * 0.5 : 0);
            const gateLength = Math.min(
              Math.round(samplesPerStep * gate),
              Math.max(1, Math.floor(nextOnsetIn) - 1)
            );
            this._enqueueNoteOff(played, channel, emitOnset + gateLength);
          }
        } else if (heldSlide >= 0) {
          // Sliding into a rest releases the held note at the step edge.
          this._enqueueNoteOff(heldSlide, channel, emitOnset);
          this._slideNote = -1;
        }
      }
    }
  }

  /**
   * Fires frame-targeted pattern/mute changes (song mode) when the scheduling
   * clock reaches the first step boundary at or past the target frame. The
   * grid rebases to land the new pattern's step 0 exactly there — the song's
   * bar line — whatever the previous pattern's length or phase.
   */
  _applyTargeted(schedRaw, boundaryOnset) {
    if (this._pendingPatternAt >= 0 && this._frameDue(boundaryOnset, this._pendingPatternAt)) {
      this._stepOrigin = schedRaw;
      this._activePattern = this._pendingPatternIndex;
      this._pendingPatternAt = -1;
      this._pendingPatternIndex = -1;
      this._pendingPattern = -1;
      // The landing step must not be swallowed as a repeat by either clock.
      this._currentStep = -1;
      this._schedCurrentStep = -1;
      this.port.postMessage({ type: "__pattern_applied", index: this._activePattern });
    }
    if (this._pendingMuteAt >= 0 && this._frameDue(boundaryOnset, this._pendingMuteAt)) {
      const muted = this._pendingMuteVal;
      this._pendingMuteAt = -1;
      this._applyMute(muted, boundaryOnset);
    }
  }

  /** Signed wrap-fold distance (the __start idiom): due when target <= now. */
  _frameDue(nowFrame, target) {
    let d = (target - (nowFrame % FRAME_WRAP)) % FRAME_WRAP;
    if (d < -(1 << 23)) d += FRAME_WRAP;
    if (d > (1 << 23)) d -= FRAME_WRAP;
    return d <= 0;
  }

  _applyMute(muted, frame) {
    this._muted = muted;
    if (muted && this._slideNote >= 0) {
      const channel = this._configView
        ? Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f
        : 0;
      this._enqueueNoteOff(this._slideNote, channel, frame);
      this._slideNote = -1;
    }
    this.port.postMessage({ type: "__mute_applied", muted });
  }

  /**
   * Switches to the queued pattern, rebasing the step grid so the clock keeps
   * running unbroken. The origin shifts by a whole number of steps, so
   * samplesPerStep is untouched and no step is stretched at the boundary.
   */
  _applyPendingPattern(rawStep, switchMode) {
    if (this._pendingPattern < 0) return;

    // Work in grid terms rather than off _currentStep: the grid index advances
    // monotonically whatever the direction, and survives a pause.
    const currentLength = this._lengthsView[this._activePattern] || 1;
    const enteringIndex = (rawStep - this._stepOrigin) % currentLength;
    const atCycleEnd = enteringIndex === 0;

    if (switchMode !== SWITCH_IMMEDIATE && !atCycleEnd) return;

    const newLength = this._lengthsView[this._pendingPattern] || 1;
    // Immediate: hold the position, falling back to step 0 when the new
    // pattern is too short. Cycle: always land on step 0.
    const target = switchMode === SWITCH_CYCLE
      ? 0
      : (enteringIndex < newLength ? enteringIndex : 0);

    this._stepOrigin = rawStep - target;
    this._activePattern = this._pendingPattern;
    this._pendingPattern = -1;
    // The step we are about to resolve must not be swallowed as a repeat.
    this._currentStep = -1;
  }

  _resolveStep(gridStep, steps, direction, loop) {
    if (direction === DIR_FORWARD) {
      if (!loop && gridStep >= steps) return -1;
      return gridStep % steps;
    }
    if (direction === DIR_REVERSE) {
      if (!loop && gridStep >= steps) return -1;
      return (steps - 1) - (gridStep % steps);
    }
    if (direction === DIR_PING_PONG) {
      const cycle = Math.max(1, (steps - 1) * 2);
      if (!loop && gridStep >= cycle) return -1;
      const pos = gridStep % cycle;
      return pos < steps ? pos : cycle - pos;
    }
    if (direction === DIR_RANDOM) {
      if (!loop && gridStep >= steps) return -1;
      // Only pick a new random step when the grid step changes
      if (gridStep !== this._lastRandomRaw) {
        this._lastRandomRaw = gridStep;
        this._lastRandomStep = Math.floor(Math.random() * steps);
      }
      return this._lastRandomStep;
    }
    return gridStep % steps;
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

  // The scheduling clock runs LOOKAHEAD ahead, so its beat crossings queue
  // the click for the audible frame instead of triggering it immediately.
  _scheduleClick(frame, accent) {
    const next = (this._clickQueueWrite + 1) % this._clickQueueFrame.length;
    if (next === this._clickQueueRead) return; // full — never at musical rates
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

  _enqueueNoteOn(note, velocity, channel, frame = 0) {
    this._enqueueMidi(NOTE_ON, channel, note, velocity, frame);
  }

  _enqueueNoteOff(note, channel, frame = 0) {
    this._enqueueMidi(NOTE_OFF, channel, note, 0, frame);
  }

  _enqueueMidi(status, channel, data1, data2, frame = 0) {
    if (!this._ringHeads || !this._ringData) return;

    const write = Atomics.load(this._ringHeads, 1);
    const nextWrite = (write + 1) % this._ringCapacity;
    if (nextWrite === Atomics.load(this._ringHeads, 0)) return; // full

    const packed = ((status & 0x0f) << 20) |
      ((channel & 0x0f) << 16) |
      ((data1 & 0x7f) << 8) |
      (data2 & 0x7f);

    const offset = write * MIDI_EVENT_SIZE;
    this._ringData[offset] = packed;
    this._ringData[offset + 1] = currentTime * 1000; // ms
    this._ringData[offset + 2] = 0; // freq hint (not needed for sequencer)
    // Audible onset as an AudioContext frame, mod 2^24 (Float32-exact);
    // 0 = immediate (the flush/panic paths).
    this._ringData[offset + 3] = frame > 0 ? frame % FRAME_WRAP : 0;

    Atomics.store(this._ringHeads, 1, nextWrite);
  }

  // Gated note-offs are frame-stamped into the ring at schedule time, so the
  // only thing to release on stop/pause is an open slide tie.
  _releaseSlide() {
    if (this._slideNote < 0) return;
    const channel = this._configView
      ? Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f
      : 0;
    this._enqueueNoteOff(this._slideNote, channel);
    this._slideNote = -1;
  }
}

registerProcessor("seq", SeqProcessor);
