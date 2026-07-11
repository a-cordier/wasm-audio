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
 *   Main → Worklet (MessagePort): __init_sab, __start, __stop
 *   Worklet → Main (MessagePort): __position (current step, for UI highlight)
 *   Main → Worklet (SAB): config (Float32Array), pattern (Uint8Array)
 *   Worklet → Main (SAB): output MIDI ring buffer
 */

const RENDER_QUANTUM_FRAMES = 128;

// ConfigParam indices (mirrors types.ts ConfigParam enum)
const BPM = 0;
const STEPS = 1;
const SUBDIVISION = 2;
const SWING = 3;
const GATE = 4;
const DIRECTION = 5;
const LOOP = 6;
const OUTPUT_CHANNEL = 7;

// Direction enum values
const DIR_FORWARD = 0;
const DIR_REVERSE = 1;
const DIR_PING_PONG = 2;
const DIR_RANDOM = 3;

// MIDI status nibbles
const NOTE_ON = 0x09;
const NOTE_OFF = 0x08;

// Pattern slot layout
const STEP_SLOT_SIZE = 2;

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

    // Pending note-offs: array of { note, offSample }
    this._pendingOffs = [];

    // SAB views (set via __init_sab)
    this._configView = null;
    this._patternView = null;
    this._ringHeads = null;
    this._ringData = null;
    this._ringCapacity = 0;

    this.port.onmessage = (e) => this._onMessage(e.data);
  }

  _onMessage(msg) {
    switch (msg.type) {
      case "__init_sab":
        this._configView = new Float32Array(msg.configBuffer);
        this._patternView = new Uint8Array(msg.patternBuffer);
        this._ringHeads = new Int32Array(msg.ringBuffer, 0, HEADER_INTS);
        this._ringData = new Float32Array(msg.ringBuffer, HEADER_BYTES);
        this._ringCapacity = (msg.ringBuffer.byteLength - HEADER_BYTES) / (MIDI_EVENT_SIZE * Float32Array.BYTES_PER_ELEMENT);
        break;
      case "__start":
        this._sampleCounter = 0;
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this._pingPongForward = true;
        this._pendingOffs = [];
        this._running = true;
        break;
      case "__stop":
        this._running = false;
        this._flushPendingOffs();
        this._currentStep = -1;
        this._lastReportedStep = -1;
        this.port.postMessage({ type: "__position", step: -1 });
        break;
    }
  }

  process() {
    if (!this._running || !this._configView) return true;

    const bpm = this._configView[BPM];
    const steps = Math.round(this._configView[STEPS]);
    const subdivision = this._configView[SUBDIVISION];
    const swing = this._configView[SWING] / 100;
    const gate = this._configView[GATE] / 100;
    const direction = this._configView[DIRECTION];
    const loop = this._configView[LOOP] === 1;
    const channel = Math.round(this._configView[OUTPUT_CHANNEL]) & 0x0f;

    // Samples per step (base, before swing)
    const beatsPerSecond = bpm / 60;
    const stepsPerBeat = subdivision;
    const stepsPerSecond = beatsPerSecond * stepsPerBeat;
    const samplesPerStep = sampleRate / stepsPerSecond;

    for (let frame = 0; frame < RENDER_QUANTUM_FRAMES; frame++) {
      const absoluteSample = this._sampleCounter;

      // Process pending note-offs
      for (let i = this._pendingOffs.length - 1; i >= 0; i--) {
        if (absoluteSample >= this._pendingOffs[i].offSample) {
          this._enqueueNoteOff(this._pendingOffs[i].note, channel);
          this._pendingOffs[i] = this._pendingOffs[this._pendingOffs.length - 1];
          this._pendingOffs.pop();
        }
      }

      // Determine current logical step
      const rawStep = Math.floor(absoluteSample / samplesPerStep);
      let logicalStep = this._resolveStep(rawStep, steps, direction, loop);

      if (logicalStep === -1) {
        this._running = false;
        this._flushPendingOffs();
        this.port.postMessage({ type: "__position", step: -1 });
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

        // Read pattern at this step
        const offset = logicalStep * STEP_SLOT_SIZE;
        const note = this._patternView[offset];
        const velocity = this._patternView[offset + 1];

        if (note > 0 && velocity > 0) {
          this._enqueueNoteOn(note, velocity, channel);
          const gateLength = Math.round(samplesPerStep * gate);
          this._pendingOffs.push({ note, offSample: absoluteSample + gateLength });
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

  _resolveStep(rawStep, steps, direction, loop) {
    if (direction === DIR_FORWARD) {
      const step = rawStep % steps;
      if (!loop && rawStep >= steps) return -1;
      return step;
    }
    if (direction === DIR_REVERSE) {
      if (!loop && rawStep >= steps) return -1;
      return (steps - 1) - (rawStep % steps);
    }
    if (direction === DIR_PING_PONG) {
      const cycle = (steps - 1) * 2;
      if (!loop && rawStep >= cycle) return -1;
      const pos = rawStep % cycle;
      return pos < steps ? pos : cycle - pos;
    }
    if (direction === DIR_RANDOM) {
      if (!loop && rawStep >= steps) return -1;
      const prevRaw = rawStep - 1;
      const prevLogical = prevRaw >= 0 ? Math.floor(prevRaw / 1) : -1;
      // Only pick a new random step when rawStep changes
      if (rawStep !== this._lastRandomRaw) {
        this._lastRandomRaw = rawStep;
        this._lastRandomStep = Math.floor(Math.random() * steps);
      }
      return this._lastRandomStep;
    }
    return rawStep % steps;
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
