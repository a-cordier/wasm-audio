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
 * Dischord (chord sequencer) AudioWorklet processor — a port of the sequels
 * scheduler whose emission block fires CHORDS instead of single notes.
 *
 * Produces no pattern audio — its job is to advance a sample-accurate clock
 * and emit frame-stamped MIDI into a SharedArrayBuffer ring buffer when step
 * boundaries are crossed. The only audio out is the metronome click.
 *
 * Chord expansion happens HERE at schedule time: a step stores a scale
 * degree + octave + quality, and the boundary turns it into notes using the
 * block's KEY / SCALE / VOICES / VOICING / ORDER / STRUM config.
 *
 * THE RING DISCIPLINE (chords are N notes, the ring is strict FIFO, and a
 * future-stamped head blocks everything behind it):
 *   1. reserve room for the WHOLE burst before writing any of it — a
 *      partial chord is a stuck chord;
 *   2. write all note-ons before any note-off, stamps ascending (strum);
 *   3. note-offs written after are stamped no earlier than the last on.
 * Every write sequence must stay frame-monotonic in write order — re-prove
 * this after ANY edit to the emission block.
 *
 * Communication:
 *   Main → Worklet (MessagePort): __init_sab, __start, __stop, __pause,
 *     __resume, __pattern_at, __pattern_cancel, __mute, __dispose
 *   Worklet → Main (MessagePort): __position, __stopped, __pattern_applied,
 *     __mute_applied
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
const METRONOME = 9;
const KEY = 10;
const SCALE = 11;
const VOICES = 12;
const VOICING = 13;
const ORDER = 14;
const STRUM = 15;

// Direction enum values
const DIR_FORWARD = 0;
const DIR_REVERSE = 1;
const DIR_PING_PONG = 2;
const DIR_RANDOM = 3;

// SwitchMode enum values
const SWITCH_IMMEDIATE = 0;
const SWITCH_CYCLE = 1;

// Voicing / EmitOrder enum values
const VOICING_SMOOTH = 1;
const ORDER_BASS = 1;

// MIDI status nibbles
const NOTE_ON = 0x09;
const NOTE_OFF = 0x08;

// Pattern buffer layout (mirrors types.ts)
const MAX_STEPS = 64;
const STEP_SLOT_SIZE = 4;
const TIE_BIT = 0x80; // high bit of the velocity byte = chord tie (the sequels slide idiom, N-wide)
const DEGREE_MASK = 0x07;
const OCT_SHIFT = 3;
const OCT_MASK = 0x07;
const OCT_BIAS = 2;
const PATTERN_COUNT = 40;
const PATTERN_BYTES = MAX_STEPS * STEP_SLOT_SIZE; // 256
const LENGTHS_OFFSET = PATTERN_COUNT * PATTERN_BYTES; // 10240

// Music tables (mirror chords.ts BY HAND — immutable data, so module scope
// is safe; only mutable state must live per instance).
const SCALE_INTERVALS = [
  [0, 2, 4, 5, 7, 9, 11], // MAJ
  [0, 2, 3, 5, 7, 8, 10], // MIN
  [0, 2, 3, 5, 7, 8, 11], // HM
  [0, 2, 3, 5, 7, 9, 11], // MM
  [0, 2, 3, 5, 7, 9, 10], // DOR
  [0, 1, 3, 5, 7, 8, 10], // PHR
  [0, 2, 4, 6, 7, 9, 11], // LYD
  [0, 2, 4, 5, 7, 9, 10], // MIX
  [0, 1, 3, 5, 6, 8, 10], // LOC
];
const QUALITY_INTERVALS = [
  null, // DIATONIC — stacked scale thirds, VOICES deep
  [0, 4, 7], // MAJ
  [0, 3, 7], // MIN
  [0, 4, 7, 10], // DOM7
  [0, 4, 7, 11], // MAJ7
  [0, 3, 7, 10], // MIN7
  [0, 3, 6], // DIM
  [0, 4, 8], // AUG
  [0, 2, 7], // SUS2
  [0, 5, 7], // SUS4
];
const CHORD_BASE_NOTE = 48; // C3 anchors degree I
const CHORD_NOTE_MIN = 24;
const CHORD_NOTE_MAX = 120;
const MAX_CHORD_NOTES = 8;

// Metronome click. At subdivisions at or below one step per beat the click
// fires per STEP (beatSteps clamps to 1), with the bar accent every four —
// cosmetic at chord pacing; a beats-based click accumulator is not worth a
// second clock.
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

class DischordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this._alive = true;
    this._running = false;
    this._currentStep = -1;
    this._lastReportedStep = -1;
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
    // flow; a held chord is released at the boundary). The worklet is the
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

    // The chord a tie step is holding open (the sequels _slideNote,
    // generalized to N notes). Common tones sustain across tie transitions
    // without a retrigger; everything else is released when the next chord
    // or rest arrives.
    this._held = new Int16Array(MAX_CHORD_NOTES);
    this._heldCount = 0;

    // The previous voiced chord (sorted ascending) — SMOOTH voice-leading
    // anchors on it. Recorded in ROOT mode too, so flipping to SMOOTH
    // mid-run has something to lead from.
    this._prev = new Int16Array(MAX_CHORD_NOTES);
    this._prevCount = 0;

    // Scratch (preallocated — process() stays allocation-free).
    this._chord = new Int16Array(MAX_CHORD_NOTES);
    this._cand = new Int16Array(MAX_CHORD_NOTES);
    this._best = new Int16Array(MAX_CHORD_NOTES);
    this._newNotes = new Int16Array(MAX_CHORD_NOTES);
    this._oldNotes = new Int16Array(MAX_CHORD_NOTES);

    // Per-block harmony config (read once per process() call, so every
    // chord in a block is internally consistent even if the main thread
    // writes KEY mid-block — a torn float never splits a chord).
    this._blkKey = 0;
    this._blkScale = 0;
    this._blkVoices = 3;
    this._blkVoicing = 0;
    this._blkOrder = 0;
    this._blkStrumSamples = 0;

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
        // Park the clock until the requested frame (0 = start immediately):
        // every synced sequencer receives the SAME frame from the master, so
        // they share a sample-aligned downbeat.
        this._pendingStartFrame = msg.startAtFrame > 0 ? msg.startAtFrame % FRAME_WRAP : 0;
        this._stepPos = 0;
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this._heldCount = 0; // stop/pause already released; nothing sounds now
        this._prevCount = 0; // voice-leading re-anchors on the first chord
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
        // Freeze the clock but keep the current step, so __resume picks up
        // exactly where playback left off. Gated note-offs are already
        // frame-stamped in the ring — they release on their own.
        this._running = false;
        this._releaseHeld();
        break;
      case "__resume":
        this._running = true;
        break;
      case "__stop":
        this._running = false;
        this._pendingStartFrame = 0;
        // Targeted switches die with the timeline; the mute flag itself
        // survives — the song module owns re-applying or lifting it.
        this._clearTargets();
        // _clickLeft deliberately NOT zeroed: the burst rings out through the
        // stopped-transport path instead of truncating mid-sine (a pop).
        // Queued (not yet audible) clicks are dropped, though.
        this._clickQueueRead = this._clickQueueWrite;
        this._releaseHeld();
        this._prevCount = 0;
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
        this._releaseHeld();
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

    // Harmony config, once per block (chord internal consistency).
    this._blkKey = Math.round(this._configView[KEY]);
    this._blkScale = Math.round(this._configView[SCALE]);
    this._blkVoices = Math.max(3, Math.min(5, Math.round(this._configView[VOICES])));
    this._blkVoicing = Math.round(this._configView[VOICING]);
    this._blkOrder = Math.round(this._configView[ORDER]);
    this._blkStrumSamples = Math.round((this._configView[STRUM] / 1000) * sampleRate);

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
      // -lookahead up to 0), so the first chord and the downbeat click are
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
              samplesPerStep, swing, gate, channel,
              direction, loop, switchMode, beatSteps, barSteps
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
        samplesPerStep, swing, gate, channel,
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
        this._releaseHeld();
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

      this._stepPos += stepInc;
    }

    return true;
  }

  /**
   * One tick of the scheduling clock at grid position `schedPos`, whose
   * crossing (if any) is audible at `onsetFrame`. Shared by the running loop
   * (schedPos = stepPos + lookahead) and the PARKED pre-roll before an armed
   * start frame (schedPos derived from the countdown), so the first chord of
   * a synced start is already in flight and sounds exactly ON the downbeat.
   */
  _runScheduler(schedPos, onsetFrame, samplesPerStep, swing, gate, channel, direction, loop, switchMode, beatSteps, barSteps) {
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

    // Swing on the scheduling clock: same phase comparison as the audible one.
    if (schedLogical !== -1 && schedLogical !== this._schedCurrentStep) {
      const isSwungStep = (schedRaw % 2) === 1;
      if (!(isSwungStep && swing > 0 && (schedPos - schedRaw) < swing * 0.5)) {
        this._schedCurrentStep = schedLogical;
        // A swung step's audible onset sits swing/2 into the step.
        const emitOnset = isSwungStep && swing > 0
          ? boundaryOnset + Math.round(swing * 0.5 * samplesPerStep)
          : boundaryOnset;

        // Read the step. byte 0 packs degree + biased octave; the velocity
        // byte packs the tie flag in its high bit; byte 2 is the quality.
        const offset = this._activePattern * PATTERN_BYTES + schedLogical * STEP_SLOT_SIZE;
        const b0 = this._patternView[offset];
        const velByte = this._patternView[offset + 1];
        const degree = b0 & DEGREE_MASK;
        const octOff = ((b0 >> OCT_SHIFT) & OCT_MASK) - OCT_BIAS;
        const velocity = velByte & 0x7f;
        const tie = (velByte & TIE_BIT) !== 0;
        const quality = this._patternView[offset + 2];

        if (this._muted) {
          // Muted (song mode): no note-ons. Gated offs already in the ring
          // flow out on their own; the held chord was released when the mute
          // applied, so there is nothing to hold here.
        } else if (degree > 0 && velocity > 0) {
          this._emitChord(
            degree, octOff, quality, velocity, tie, channel, emitOnset,
            schedPos, schedRaw, samplesPerStep, swing, gate
          );
        } else if (this._heldCount > 0) {
          // A rest releases the held chord at the step edge. If the ring is
          // momentarily full the release is retried at the next boundary.
          this._releaseHeldAt(channel, emitOnset);
        }
      }
    }
  }

  /**
   * Expands and fires one chord step. See the ring-discipline comment at the
   * top of the file — the write order here is load-bearing.
   */
  _emitChord(degree, octOff, quality, velocity, tie, channel, emitOnset, schedPos, schedRaw, samplesPerStep, swing, gate) {
    const n = this._buildChord(degree, octOff, quality);
    if (this._blkVoicing === VOICING_SMOOTH) this._applySmooth(n);
    else this._recordPrev(n);

    // Partition against the held chord: common tones keep sounding (true
    // legato — no event at all), new notes get ons, dropped notes get offs.
    let nNew = 0;
    for (let k = 0; k < n; k++) {
      const note = this._chord[k];
      if (!this._isHeld(note)) this._newNotes[nNew++] = note;
    }
    let nOld = 0;
    for (let j = 0; j < this._heldCount; j++) {
      const note = this._held[j];
      if (!this._inChord(note, n)) this._oldNotes[nOld++] = note;
    }

    // Reserve the WHOLE burst before writing anything: a partial chord (ons
    // without their offs) is a stuck chord. Skipping leaves _held untouched,
    // so anything sounding still releases at a later boundary.
    const required = nNew + nOld + (tie ? 0 : n);
    if (this._ringFree() < required) return;

    // Next-onset distance (swing-aware) bounds both strum and gate, so a
    // swung high-gate step can never choke a repeated chord.
    const samplesToNextStep = (1 + schedRaw - schedPos) * samplesPerStep;
    const nextIsSwung = ((schedRaw + 1) % 2) === 1;
    const nextOnsetIn = samplesToNextStep
      + (nextIsSwung && swing > 0 ? samplesPerStep * swing * 0.5 : 0);

    // Strum: integer sample offsets (fractional stamps would break the
    // consumer's frame equality), clamped so the whole rake lands before the
    // next onset. Ascending stamps keep the ring frame-monotonic; stamps
    // beyond the lookahead simply wait in the instrument's ring.
    let strum = this._blkStrumSamples;
    if (nNew > 1 && strum > 0) {
      const maxStrum = Math.floor(Math.max(0, nextOnsetIn - 2) / (nNew - 1));
      if (strum > maxStrum) strum = maxStrum;
      if (strum < 0) strum = 0;
    }

    // 1. All note-ons first. LEAD walks the chord bottom-up, so a mono
    // target (last-note priority) tracks the TOP voice; BASS walks top-down,
    // so it tracks the ROOT. Poly targets are unaffected.
    let lastOnStamp = emitOnset;
    for (let k = 0; k < nNew; k++) {
      const idx = this._blkOrder === ORDER_BASS ? nNew - 1 - k : k;
      const stamp = emitOnset + k * strum;
      this._enqueueNoteOn(this._newNotes[idx], velocity, channel, stamp);
      lastOnStamp = stamp;
    }

    // 2. Held notes the new chord does not keep: released at the last
    // strummed on's frame — written after the ons AND stamped no earlier,
    // so the ring stays monotonic. At strum 0 this is exactly the sequels
    // slide idiom (on, then off at the same frame = legato overlap).
    for (let j = 0; j < nOld; j++) {
      this._enqueueNoteOff(this._oldNotes[j], channel, lastOnStamp);
    }

    if (tie) {
      // Hold the whole chord open (no gated offs) until the next chord,
      // rest, mute or stop. A repeat of the same chord with TIE is zero
      // events — a pure multi-step sustain.
      for (let k = 0; k < n; k++) this._held[k] = this._chord[k];
      this._heldCount = n;
    } else {
      // 3. One shared gate-end stamp for the whole chord (a strummed chord
      // releases together): never earlier than the last on, never later
      // than one frame before the next onset. Offs mirror the on order so a
      // mono target's note stack unwinds without fallback retriggers.
      const gateLength = Math.min(
        Math.round(samplesPerStep * gate),
        Math.max(1, Math.floor(nextOnsetIn) - 1)
      );
      const gateEnd = Math.max(emitOnset + gateLength, lastOnStamp + 1);
      for (let k = 0; k < n; k++) {
        const idx = this._blkOrder === ORDER_BASS ? n - 1 - k : k;
        this._enqueueNoteOff(this._chord[idx], channel, gateEnd);
      }
      this._heldCount = 0;
    }
  }

  /**
   * Builds the step's chord in root position, ascending, into this._chord.
   * DIATONIC stacks thirds degree-wise through the (strictly heptatonic)
   * scale; an explicit quality is an interval shape on the degree's root.
   * The whole chord then folds into MIDI range, intervals preserved.
   */
  _buildChord(degree, octOff, quality) {
    const iv = SCALE_INTERVALS[this._blkScale] || SCALE_INTERVALS[0];
    const di = degree - 1;
    const base = CHORD_BASE_NOTE + this._blkKey + 12 * octOff;
    const chord = this._chord;
    const shape = quality > 0 && quality < QUALITY_INTERVALS.length ? QUALITY_INTERVALS[quality] : null;
    let n;

    if (shape) {
      n = shape.length;
      const root = base + iv[di];
      for (let k = 0; k < n; k++) chord[k] = root + shape[k];
    } else {
      n = this._blkVoices;
      for (let k = 0; k < n; k++) {
        const idx = di + 2 * k;
        chord[k] = base + 12 * ((idx / 7) | 0) + iv[idx % 7];
      }
    }

    while (chord[n - 1] > CHORD_NOTE_MAX) for (let k = 0; k < n; k++) chord[k] -= 12;
    while (chord[0] < CHORD_NOTE_MIN) for (let k = 0; k < n; k++) chord[k] += 12;
    return n;
  }

  /**
   * SMOOTH voice-leading: among the chord's inversions (rotation k lifts the
   * bottom k notes an octave; each candidate may also drop a whole octave),
   * greedily pick the one moving least from the previous voiced chord —
   * summed per-voice absolute motion, both chords sorted ascending. Ties
   * keep the earliest candidate (lower inversion, no drop).
   */
  _applySmooth(n) {
    if (this._prevCount === 0) {
      this._recordPrev(n);
      return;
    }
    const m = Math.min(n, this._prevCount);
    let bestCost = Infinity;

    for (let k = 0; k < n; k++) {
      for (let s = 0; s >= -12; s -= 12) {
        let ok = true;
        for (let j = 0; j < n; j++) {
          const src = j < n - k ? this._chord[k + j] : this._chord[j - (n - k)] + 12;
          const v = src + s;
          if (v < CHORD_NOTE_MIN || v > 108) {
            ok = false;
            break;
          }
          this._cand[j] = v;
        }
        if (!ok) continue;
        let cost = 0;
        for (let j = 0; j < m; j++) cost += Math.abs(this._cand[j] - this._prev[j]);
        if (cost < bestCost) {
          bestCost = cost;
          for (let j = 0; j < n; j++) this._best[j] = this._cand[j];
        }
      }
    }

    if (bestCost < Infinity) {
      for (let j = 0; j < n; j++) this._chord[j] = this._best[j];
    }
    this._recordPrev(n);
  }

  _recordPrev(n) {
    for (let j = 0; j < n; j++) this._prev[j] = this._chord[j];
    this._prevCount = n;
  }

  _isHeld(note) {
    for (let j = 0; j < this._heldCount; j++) {
      if (this._held[j] === note) return true;
    }
    return false;
  }

  _inChord(note, n) {
    for (let k = 0; k < n; k++) {
      if (this._chord[k] === note) return true;
    }
    return false;
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
    if (muted && this._heldCount > 0) {
      // The held chord releases ON the boundary (mute is volatile and owned
      // by the song module — tails must not smear into the muted scene).
      const channel = this._configView
        ? Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f
        : 0;
      for (let j = 0; j < this._heldCount; j++) {
        this._enqueueNoteOff(this._held[j], channel, frame);
      }
      this._heldCount = 0;
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

  /**
   * Releases the held chord at a step edge (rest). If the ring is full the
   * whole release is skipped and _held kept, so the next boundary retries —
   * dropping half a chord's offs would strand the rest.
   */
  _releaseHeldAt(channel, frame) {
    if (this._heldCount === 0) return;
    if (this._ringFree() < this._heldCount) return;
    for (let j = 0; j < this._heldCount; j++) {
      this._enqueueNoteOff(this._held[j], channel, frame);
    }
    this._heldCount = 0;
  }

  // Gated note-offs are frame-stamped into the ring at schedule time, so the
  // only thing to release on stop/pause/dispose is a held (tied) chord.
  _releaseHeld() {
    if (this._heldCount === 0) return;
    const channel = this._configView
      ? Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f
      : 0;
    for (let j = 0; j < this._heldCount; j++) {
      this._enqueueNoteOff(this._held[j], channel);
    }
    this._heldCount = 0;
  }
}

registerProcessor("dischord", DischordProcessor);
