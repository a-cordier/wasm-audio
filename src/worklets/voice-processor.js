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
import { RENDER_QUANTUM_FRAMES, MAX_CHANNEL_COUNT, HeapAudioBuffer, HeapParameterBuffer } from "./wasm-audio-helper.js";

import {
  staticParameterDescriptors,
  automatedParameterDescriptors,
  aRateParameterDescriptors,
  VoiceState,
  WaveFormParam,
  FilterModeParam,
  LfoDestinationParam,
} from "./voice-processor-parameters.js";

import createModule from "./voice-kernel.wasmmodule.js";

const wasm = await createModule();

// C++ Oscillator::Mode enum values (oscillator.h)
const OscMode = Object.freeze({ SAW: 0, SINE: 1, SQUARE: 2, TRIANGLE: 3 });

// C++ Filter::Mode enum values (filter.h)
const FilterModeEnum = Object.freeze({ LOWPASS: 0, LOWPASS_PLUS: 1, HIGHPASS: 2, BANDPASS: 3 });

// C++ Voice::LfoDestination enum values (voice-kernel.h)
const LfoDestEnum = Object.freeze({
  FREQUENCY: 0, OSCILLATOR_MIX: 1, CUTOFF: 2, RESONANCE: 3, OSC1_CYCLE: 4, OSC2_CYCLE: 5,
});

const waveforms = Object.freeze({
  [WaveFormParam.SINE]: OscMode.SINE,
  [WaveFormParam.SAWTOOTH]: OscMode.SAW,
  [WaveFormParam.SQUARE]: OscMode.SQUARE,
  [WaveFormParam.TRIANGLE]: OscMode.TRIANGLE,
});

const FilterMode = Object.freeze({
  [FilterModeParam.LOWPASS]: FilterModeEnum.LOWPASS,
  [FilterModeParam.LOWPASS_PLUS]: FilterModeEnum.LOWPASS_PLUS,
  [FilterModeParam.BANDPASS]: FilterModeEnum.BANDPASS,
  [FilterModeParam.HIGHPASS]: FilterModeEnum.HIGHPASS,
});

const LfoDestination = Object.freeze({
  [LfoDestinationParam.FREQUENCY]: LfoDestEnum.FREQUENCY,
  [LfoDestinationParam.OSCILLATOR_MIX]: LfoDestEnum.OSCILLATOR_MIX,
  [LfoDestinationParam.CUTOFF]: LfoDestEnum.CUTOFF,
  [LfoDestinationParam.RESONANCE]: LfoDestEnum.RESONANCE,
  [LfoDestinationParam.OSC1_CYCLE]: LfoDestEnum.OSC1_CYCLE,
  [LfoDestinationParam.OSC2_CYCLE]: LfoDestEnum.OSC2_CYCLE,
});

const PARAM_BLOCK_FIELDS = 32;
const PARAM_BLOCK_BYTES = PARAM_BLOCK_FIELDS * 4;

const PB = Object.freeze({
  VELOCITY: 0,
  OSC1_MODE: 1,
  OSC2_MODE: 2,
  FILTER_MODE: 3,
  LFO1_MODE: 4,
  LFO1_DESTINATION: 5,
  LFO2_MODE: 6,
  LFO2_DESTINATION: 7,
  FREQUENCY: 8,
  AMPLITUDE_ATTACK: 9,
  AMPLITUDE_DECAY: 10,
  AMPLITUDE_SUSTAIN: 11,
  AMPLITUDE_RELEASE: 12,
  OSC1_SEMI_SHIFT: 13,
  OSC1_CENT_SHIFT: 14,
  OSC1_CYCLE: 15,
  OSC2_SEMI_SHIFT: 16,
  OSC2_CENT_SHIFT: 17,
  OSC2_CYCLE: 18,
  OSC2_AMPLITUDE: 19,
  NOISE_LEVEL: 20,
  CUTOFF: 21,
  RESONANCE: 22,
  DRIVE: 23,
  CUTOFF_ENV_AMOUNT: 24,
  CUTOFF_ENV_VELOCITY: 25,
  CUTOFF_ENV_ATTACK: 26,
  CUTOFF_ENV_DECAY: 27,
  LFO1_FREQUENCY: 28,
  LFO1_MOD_AMOUNT: 29,
  LFO2_FREQUENCY: 30,
  LFO2_MOD_AMOUNT: 31,
});

function createParameterBuffers(parameterDescriptors = []) {
  return new Map(parameterDescriptors.map(toParameterBufferEntry));
}

function toParameterBufferEntry(descriptor) {
  return [descriptor.name, new HeapParameterBuffer(wasm, RENDER_QUANTUM_FRAMES)];
}

function kValueOf(param) {
  return param[0];
}

function isStarted(parameters) {
  return kValueOf(parameters.state) === VoiceState.STARTED;
}

function isStopped(parameters) {
  return kValueOf(parameters.state) === VoiceState.STOPPED;
}

class KernelPool {
  pool = [];

  constructor(length = 8) {
    this.pool = Array.from({ length }).map(
      () => wasm._voice_kernel_create(sampleRate, RENDER_QUANTUM_FRAMES)
    );
  }

  acquire() {
    return this.pool.shift();
  }

  release(kernelPtr) {
    wasm._voice_kernel_reset(kernelPtr);
    this.pool.push(kernelPtr);
  }

  dispose() {
    for (const ptr of this.pool) {
      wasm._voice_kernel_destroy(ptr);
    }
    this.pool = [];
  }
}

const pool = new KernelPool(16);

class VoiceProcessor extends AudioWorkletProcessor {
  outputBuffer = new HeapAudioBuffer(wasm, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);

  parameterBuffers = createParameterBuffers(aRateParameterDescriptors);

  _paramBlockPtr = wasm._malloc(PARAM_BLOCK_BYTES);

  kernel = pool.acquire();

  state = VoiceState.DISPOSED;

  static get parameterDescriptors() {
    return [...staticParameterDescriptors, ...automatedParameterDescriptors];
  }

  process(inputs, outputs, parameters) {
    if (!isStarted(parameters) && this.state === VoiceState.DISPOSED) {
      return true;
    }

    if (this.state === VoiceState.DISPOSED) {
      this.state = VoiceState.STARTED;
    }

    if (wasm._voice_kernel_is_stopped(this.kernel)) {
      this.freeBuffers();
      pool.release(this.kernel);
      return false;
    }

    const output = outputs[0];
    const channelCount = output.length;

    this.allocateBuffers(channelCount, parameters);

    if (isStopped(parameters) && this.state !== VoiceState.STOPPING) {
      wasm._voice_kernel_enter_release_stage(this.kernel);
      this.state = VoiceState.STOPPING;
    }

    this.writeParameterBlock(parameters);
    wasm._voice_kernel_set_parameters(this.kernel, this._paramBlockPtr);

    wasm._voice_kernel_process(this.kernel, this.outputBuffer.getHeapAddress(), channelCount);

    for (let channel = 0; channel < channelCount; ++channel) {
      output[channel].set(this.outputBuffer.getChannelData(channel));
    }

    return true;
  }

  allocateBuffers(channelCount, parameters) {
    this.outputBuffer.adaptChannel(channelCount);
    this.parameterBuffers.forEach((buffer, name) => {
      const param = parameters[name];
      const data = buffer.getData();
      if (param.length === 1) {
        data.fill(param[0]);
      } else {
        data.set(param);
      }
    });
  }

  writeParameterBlock(parameters) {
    const base = this._paramBlockPtr >> 2;
    const f32 = wasm.HEAPF32;
    const u32 = wasm.HEAPU32;

    f32[base + PB.VELOCITY] = kValueOf(parameters.velocity);

    u32[base + PB.OSC1_MODE] = waveforms[kValueOf(parameters.osc1)];
    u32[base + PB.OSC2_MODE] = waveforms[kValueOf(parameters.osc2)];
    u32[base + PB.FILTER_MODE] = FilterMode[kValueOf(parameters.filterMode)];
    u32[base + PB.LFO1_MODE] = waveforms[kValueOf(parameters.lfo1Mode)];
    u32[base + PB.LFO1_DESTINATION] = LfoDestination[kValueOf(parameters.lfo1Destination)];
    u32[base + PB.LFO2_MODE] = waveforms[kValueOf(parameters.lfo2Mode)];
    u32[base + PB.LFO2_DESTINATION] = LfoDestination[kValueOf(parameters.lfo2Destination)];

    u32[base + PB.FREQUENCY] = this.parameterBuffers.get("frequency").getHeapAddress();
    u32[base + PB.OSC2_AMPLITUDE] = this.parameterBuffers.get("osc2Amplitude").getHeapAddress();
    u32[base + PB.NOISE_LEVEL] = this.parameterBuffers.get("noiseLevel").getHeapAddress();
    u32[base + PB.CUTOFF] = this.parameterBuffers.get("cutoff").getHeapAddress();
    u32[base + PB.RESONANCE] = this.parameterBuffers.get("resonance").getHeapAddress();
    u32[base + PB.DRIVE] = this.parameterBuffers.get("drive").getHeapAddress();
    u32[base + PB.LFO1_FREQUENCY] = this.parameterBuffers.get("lfo1Frequency").getHeapAddress();
    u32[base + PB.LFO1_MOD_AMOUNT] = this.parameterBuffers.get("lfo1ModAmount").getHeapAddress();
    u32[base + PB.LFO2_FREQUENCY] = this.parameterBuffers.get("lfo2Frequency").getHeapAddress();
    u32[base + PB.LFO2_MOD_AMOUNT] = this.parameterBuffers.get("lfo2ModAmount").getHeapAddress();

    f32[base + PB.AMPLITUDE_ATTACK] = kValueOf(parameters.amplitudeAttack);
    f32[base + PB.AMPLITUDE_DECAY] = kValueOf(parameters.amplitudeDecay);
    f32[base + PB.AMPLITUDE_SUSTAIN] = kValueOf(parameters.amplitudeSustain);
    f32[base + PB.AMPLITUDE_RELEASE] = kValueOf(parameters.amplitudeRelease);
    f32[base + PB.OSC1_SEMI_SHIFT] = kValueOf(parameters.osc1SemiShift);
    f32[base + PB.OSC1_CENT_SHIFT] = kValueOf(parameters.osc1CentShift);
    f32[base + PB.OSC1_CYCLE] = kValueOf(parameters.osc1Cycle);
    f32[base + PB.OSC2_SEMI_SHIFT] = kValueOf(parameters.osc2SemiShift);
    f32[base + PB.OSC2_CENT_SHIFT] = kValueOf(parameters.osc2CentShift);
    f32[base + PB.OSC2_CYCLE] = kValueOf(parameters.osc2Cycle);
    f32[base + PB.CUTOFF_ENV_AMOUNT] = kValueOf(parameters.cutoffEnvelopeAmount);
    f32[base + PB.CUTOFF_ENV_VELOCITY] = kValueOf(parameters.cutoffEnvelopeVelocity);
    f32[base + PB.CUTOFF_ENV_ATTACK] = kValueOf(parameters.cutoffAttack);
    f32[base + PB.CUTOFF_ENV_DECAY] = kValueOf(parameters.cutoffDecay);
  }

  freeBuffers() {
    this.outputBuffer.free();
    wasm._free(this._paramBlockPtr);
    this.parameterBuffers.forEach((buffer) => {
      buffer.free();
    });
  }
}

// noinspection JSUnresolvedFunction
registerProcessor("voice", VoiceProcessor);
