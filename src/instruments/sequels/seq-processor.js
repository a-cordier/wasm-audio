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

    // Metronome click voice
    this._clickLeft = 0;
    this._clickTotal = 1;
    this._clickPhase = 0;
    this._clickOmega = 0;

    // Count-in pre-roll (samples). While it drains the clock does not advance.
    this._countInLeft = 0;
    this._countInTotal = 0;
    this._countInLastStep = -1;

    // Pending note-offs: array of { note, offSample }
    this._pendingOffs = [];

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
        this._sampleCounter = 0;
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this._pingPongForward = true;
        this._pendingOffs = [];
        this._stepOrigin = 0;
        this._lastRawStep = -1;
        this._pendingPattern = -1;
        this._activePattern = this._configView ? Math.round(this._configView[ACTIVE_PATTERN]) : 0;
        this._running = true;
        break;
      case "__pause":
        // Freeze the clock but keep the sample counter and current step, so
        // __resume picks up exactly where playback left off.
        this._running = false;
        this._flushPendingOffs();
        break;
      case "__resume":
        this._running = true;
        break;
      case "__stop":
        this._running = false;
        this._countInLeft = 0;
        this._clickLeft = 0;
        this._flushPendingOffs();
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this.port.postMessage({ type: "__position", step: -1 });
        break;
    }
  }

  process(inputs, outputs) {
    const out = outputs[0] && outputs[0][0];

    if (!this._running || !this._configView || !this._lengthsView) return true;

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
    if (requested !== this._activePattern) {
      this._pendingPattern = requested;
    } else {
      this._pendingPattern = -1;
    }

    // Samples per step (base, before swing)
    const beatsPerSecond = bpm / 60;
    const stepsPerBeat = subdivision;
    const stepsPerSecond = beatsPerSecond * stepsPerBeat;
    const samplesPerStep = sampleRate / stepsPerSecond;

    const beatSteps = Math.max(1, Math.round(subdivision));
    const barSteps = beatSteps * BEATS_PER_BAR;

    for (let frame = 0; frame < RENDER_QUANTUM_FRAMES; frame++) {
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
          this._lastRawStep = -1;
          this._currentStep = -1;
        }
        continue;
      }

      if (out) out[frame] = this._clickSample();

      const absoluteSample = this._sampleCounter;

      // Process pending note-offs
      for (let i = this._pendingOffs.length - 1; i >= 0; i--) {
        if (absoluteSample >= this._pendingOffs[i].offSample) {
          this._enqueueNoteOff(this._pendingOffs[i].note, channel);
          this._pendingOffs[i] = this._pendingOffs[this._pendingOffs.length - 1];
          this._pendingOffs.pop();
        }
      }

      const rawStep = Math.floor(absoluteSample / samplesPerStep);

      if (rawStep !== this._lastRawStep) {
        this._applyPendingPattern(rawStep, switchMode);
        // Driven by the absolute step, not the rebased grid, so the click keeps
        // a steady beat across pattern switches and odd pattern lengths.
        if (rawStep % beatSteps === 0) this._triggerClick(rawStep % barSteps === 0);
        this._lastRawStep = rawStep;
      }

      const steps = this._lengthsView[this._activePattern] || 1;

      // Determine current logical step, relative to the rebased grid origin
      const logicalStep = this._resolveStep(rawStep - this._stepOrigin, steps, direction, loop);

      if (logicalStep === -1) {
        // End of a non-looping sequence. Tell the main thread, otherwise it
        // keeps believing the transport is running.
        this._running = false;
        this._flushPendingOffs();
        this.port.postMessage({ type: "__position", step: -1 });
        this.port.postMessage({ type: "__stopped" });
        return true;
      }

      // Apply swing: delay even-numbered steps
      if (logicalStep !== this._currentStep) {
        const isSwungStep = (rawStep % 2) === 1;
        if (isSwungStep && swing > 0) {
          const swingDelay = samplesPerStep * swing * 0.5;
          const stepStartSample = rawStep * samplesPerStep;
          if (absoluteSample < stepStartSample + swingDelay) {
            this._sampleCounter++;
            continue;
          }
        }

        this._currentStep = logicalStep;

        // Read the active pattern at this step
        const offset = this._activePattern * PATTERN_BYTES + logicalStep * STEP_SLOT_SIZE;
        const note = this._patternView[offset];
        const velocity = this._patternView[offset + 1];

        // Transpose is applied on the way out; the pattern itself is untouched,
        // and pendingOffs tracks the note actually sent so changing transpose
        // mid-gate can never strand a note-off.
        const played = note + transpose;

        if (note > 0 && velocity > 0 && played > 0 && played < 128) {
          this._enqueueNoteOn(played, velocity, channel);
          const gateLength = Math.round(samplesPerStep * gate);
          this._pendingOffs.push({ note: played, offSample: absoluteSample + gateLength });
        }

        // Report position to main thread
        if (logicalStep !== this._lastReportedStep) {
          this._lastReportedStep = logicalStep;
          this.port.postMessage({ type: "__position", step: logicalStep });
        }
      }

      this._sampleCounter++;
    }

    return true;
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

  _enqueueNoteOn(note, velocity, channel) {
    this._enqueueMidi(NOTE_ON, channel, note, velocity);
  }

  _enqueueNoteOff(note, channel) {
    this._enqueueMidi(NOTE_OFF, channel, note, 0);
  }

  _enqueueMidi(status, channel, data1, data2) {
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
    this._ringData[offset + 3] = 0;

    Atomics.store(this._ringHeads, 1, nextWrite);
  }

  _flushPendingOffs() {
    const channel = this._configView
      ? Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f
      : 0;
    for (const pending of this._pendingOffs) {
      this._enqueueNoteOff(pending.note, channel);
    }
    this._pendingOffs = [];
  }
}

registerProcessor("seq", SeqProcessor);
