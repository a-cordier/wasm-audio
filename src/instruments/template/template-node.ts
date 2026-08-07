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

import { WasmProcessorNode } from "../../runtime/wasm-processor-node";
import { SharedParamBuffer } from "../../runtime/shared-param-buffer";
import { MidiRingBuffer } from "../../midi/transport/ring-buffer";
import { MidiEvent, MidiTarget, Status, Channel } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { TemplateParamId } from "./types/template-params";

const MIDI_QUEUE_CAPACITY = 64;

/**
 * Main-thread handle to the "template" AudioWorklet. Owns the two shared
 * buffers the worklet reads: a float param buffer (sized from PARAM_COUNT) and
 * a lock-free MIDI ring. Despite the base class name, this is a plain worklet
 * node — the base is just AudioWorkletNode + send()/dispose().
 */
export class TemplateNode extends WasmProcessorNode implements MidiTarget {
  private params: SharedParamBuffer;
  private midiRing: MidiRingBuffer;

  constructor(audioContext: AudioContext) {
    super(audioContext, "template", { outputChannelCount: [2] });

    this.params = new SharedParamBuffer(TemplateParamId.PARAM_COUNT);
    this.midiRing = new MidiRingBuffer(MIDI_QUEUE_CAPACITY);

    this.send({
      type: "__init_sab",
      paramBuffer: this.params.buffer,
      midiBuffer: this.midiRing.buffer,
    });
  }

  receive(event: MidiEvent): void {
    const freqHint =
      event.status === Status.NOTE_ON || event.status === Status.NOTE_OFF
        ? noteFrequency(event.data1)
        : 0;
    this.midiRing.enqueue(event, freqHint);
  }

  noteOn(midi: number, frequency: number, velocity: number) {
    this.midiRing.enqueueRaw(Status.NOTE_ON, 0 as Channel, midi, velocity, performance.now(), frequency);
  }

  noteOff(midi: number) {
    this.midiRing.enqueueRaw(Status.NOTE_OFF, 0 as Channel, midi, 0, performance.now(), 0);
  }

  setParam(id: number, value: number) {
    this.params.set(id, value);
  }
}
