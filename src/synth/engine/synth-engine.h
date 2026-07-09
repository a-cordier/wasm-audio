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
#pragma once

#include "voice-kernel.h"
#include <algorithm>
#include <cstdint>
#include <cstring>
#include <vector>

namespace wasm_audio {

enum class ParamId : int {
	OSC1_MODE = 0,
	OSC2_MODE,
	FILTER_MODE,
	LFO1_MODE,
	LFO1_DESTINATION,
	LFO2_MODE,
	LFO2_DESTINATION,
	AMPLITUDE_ATTACK,
	AMPLITUDE_DECAY,
	AMPLITUDE_SUSTAIN,
	AMPLITUDE_RELEASE,
	OSC1_SEMI_SHIFT,
	OSC1_CENT_SHIFT,
	OSC1_CYCLE,
	OSC2_SEMI_SHIFT,
	OSC2_CENT_SHIFT,
	OSC2_CYCLE,
	OSC2_AMPLITUDE,
	NOISE_LEVEL,
	CUTOFF,
	RESONANCE,
	DRIVE,
	CUTOFF_ENV_AMOUNT,
	CUTOFF_ENV_VELOCITY,
	CUTOFF_ENV_ATTACK,
	CUTOFF_ENV_DECAY,
	LFO1_FREQUENCY,
	LFO1_MOD_AMOUNT,
	LFO2_FREQUENCY,
	LFO2_MOD_AMOUNT,
	PARAM_COUNT,
};

class SynthEngine {
	static constexpr int MAX_VOICES = 16;
	static constexpr unsigned MAX_FRAMES = 128;
	static constexpr int NUM_PARAMS = static_cast<int>(ParamId::PARAM_COUNT);

	struct VoiceSlot {
		Voice::Kernel kernel;
		int midiNote = -1;
		bool active = false;
		bool releasing = false;
		float frequency = 440.f;
		float velocity = 127.f;
		uint64_t age = 0;
		float frequencyBuf[MAX_FRAMES] = {};

		VoiceSlot(float sampleRate, float renderFrames)
			: kernel(sampleRate, renderFrames) {}
	};

	std::vector<VoiceSlot> voices;
	float params[NUM_PARAMS] = {};

	float osc2AmplitudeBuf[MAX_FRAMES] = {};
	float noiseLevelBuf[MAX_FRAMES] = {};
	float cutoffBuf[MAX_FRAMES] = {};
	float resonanceBuf[MAX_FRAMES] = {};
	float driveBuf[MAX_FRAMES] = {};
	float lfo1FrequencyBuf[MAX_FRAMES] = {};
	float lfo1ModAmountBuf[MAX_FRAMES] = {};
	float lfo2FrequencyBuf[MAX_FRAMES] = {};
	float lfo2ModAmountBuf[MAX_FRAMES] = {};

	float voiceOutputBuf[MAX_FRAMES] = {};

	unsigned renderFrames;
	uint64_t noteCounter = 0;

public:
	SynthEngine(float sampleRate, float rf)
		: renderFrames(std::min(static_cast<unsigned>(rf), MAX_FRAMES)) {
		voices.reserve(MAX_VOICES);
		for (int i = 0; i < MAX_VOICES; ++i) {
			voices.emplace_back(sampleRate, rf);
		}
	}

	void noteOn(int midi, float frequency, float velocity) {
		for (auto &slot : voices) {
			if (slot.active && slot.midiNote == midi) {
				if (slot.releasing) {
					slot.kernel.reset();
					slot.releasing = false;
					slot.frequency = frequency;
					slot.velocity = velocity;
					slot.age = ++noteCounter;
				}
				return;
			}
		}

		VoiceSlot *target = findFreeSlot();
		if (!target) target = stealVoice();
		if (!target) return;

		target->kernel.reset();
		target->midiNote = midi;
		target->active = true;
		target->releasing = false;
		target->frequency = frequency;
		target->velocity = velocity;
		target->age = ++noteCounter;
	}

	void noteOff(int midi) {
		for (auto &slot : voices) {
			if (slot.active && slot.midiNote == midi && !slot.releasing) {
				slot.kernel.enterReleaseStage();
				slot.releasing = true;
				return;
			}
		}
	}

	void setParam(int paramId, float value) {
		if (paramId >= 0 && paramId < NUM_PARAMS) {
			params[paramId] = value;
		}
	}

	void process(uintptr_t outputPtr, unsigned channelCount) {
		float *output = reinterpret_cast<float *>(outputPtr);

		std::fill(output, output + renderFrames, 0.f);

		fillBuf(osc2AmplitudeBuf, params[pi(ParamId::OSC2_AMPLITUDE)]);
		fillBuf(noiseLevelBuf, params[pi(ParamId::NOISE_LEVEL)]);
		fillBuf(cutoffBuf, params[pi(ParamId::CUTOFF)]);
		fillBuf(resonanceBuf, params[pi(ParamId::RESONANCE)]);
		fillBuf(driveBuf, params[pi(ParamId::DRIVE)]);
		fillBuf(lfo1FrequencyBuf, params[pi(ParamId::LFO1_FREQUENCY)]);
		fillBuf(lfo1ModAmountBuf, params[pi(ParamId::LFO1_MOD_AMOUNT)]);
		fillBuf(lfo2FrequencyBuf, params[pi(ParamId::LFO2_FREQUENCY)]);
		fillBuf(lfo2ModAmountBuf, params[pi(ParamId::LFO2_MOD_AMOUNT)]);

		for (auto &slot : voices) {
			if (!slot.active) continue;

			fillBuf(slot.frequencyBuf, slot.frequency);

			Voice::ParameterBlock block;
			block.velocity = slot.velocity;
			block.osc1Mode = pui(ParamId::OSC1_MODE);
			block.osc2Mode = pui(ParamId::OSC2_MODE);
			block.filterMode = pui(ParamId::FILTER_MODE);
			block.lfo1Mode = pui(ParamId::LFO1_MODE);
			block.lfo1Destination = pui(ParamId::LFO1_DESTINATION);
			block.lfo2Mode = pui(ParamId::LFO2_MODE);
			block.lfo2Destination = pui(ParamId::LFO2_DESTINATION);
			block.frequencyPtr = reinterpret_cast<uintptr_t>(slot.frequencyBuf);
			block.amplitudeAttack = params[pi(ParamId::AMPLITUDE_ATTACK)];
			block.amplitudeDecay = params[pi(ParamId::AMPLITUDE_DECAY)];
			block.amplitudeSustain = params[pi(ParamId::AMPLITUDE_SUSTAIN)];
			block.amplitudeRelease = params[pi(ParamId::AMPLITUDE_RELEASE)];
			block.osc1SemiShift = params[pi(ParamId::OSC1_SEMI_SHIFT)];
			block.osc1CentShift = params[pi(ParamId::OSC1_CENT_SHIFT)];
			block.osc1Cycle = params[pi(ParamId::OSC1_CYCLE)];
			block.osc2SemiShift = params[pi(ParamId::OSC2_SEMI_SHIFT)];
			block.osc2CentShift = params[pi(ParamId::OSC2_CENT_SHIFT)];
			block.osc2Cycle = params[pi(ParamId::OSC2_CYCLE)];
			block.osc2AmplitudePtr = reinterpret_cast<uintptr_t>(osc2AmplitudeBuf);
			block.noiseLevelPtr = reinterpret_cast<uintptr_t>(noiseLevelBuf);
			block.cutoffPtr = reinterpret_cast<uintptr_t>(cutoffBuf);
			block.resonancePtr = reinterpret_cast<uintptr_t>(resonanceBuf);
			block.drivePtr = reinterpret_cast<uintptr_t>(driveBuf);
			block.cutoffEnvelopeAmount = params[pi(ParamId::CUTOFF_ENV_AMOUNT)];
			block.cutoffEnvelopeVelocity = params[pi(ParamId::CUTOFF_ENV_VELOCITY)];
			block.cutoffEnvelopeAttack = params[pi(ParamId::CUTOFF_ENV_ATTACK)];
			block.cutoffEnvelopeDecay = params[pi(ParamId::CUTOFF_ENV_DECAY)];
			block.lfo1FrequencyPtr = reinterpret_cast<uintptr_t>(lfo1FrequencyBuf);
			block.lfo1ModAmountPtr = reinterpret_cast<uintptr_t>(lfo1ModAmountBuf);
			block.lfo2FrequencyPtr = reinterpret_cast<uintptr_t>(lfo2FrequencyBuf);
			block.lfo2ModAmountPtr = reinterpret_cast<uintptr_t>(lfo2ModAmountBuf);

			slot.kernel.setParameters(reinterpret_cast<uintptr_t>(&block));
			slot.kernel.process(reinterpret_cast<uintptr_t>(voiceOutputBuf), 1);

			for (unsigned s = 0; s < renderFrames; ++s) {
				output[s] += voiceOutputBuf[s];
			}

			if (slot.kernel.isStopped()) {
				slot.active = false;
				slot.releasing = false;
				slot.midiNote = -1;
			}
		}

		for (unsigned ch = 1; ch < channelCount; ++ch) {
			std::copy(output, output + renderFrames, output + ch * renderFrames);
		}
	}

private:
	static int pi(ParamId id) { return static_cast<int>(id); }
	uint32_t pui(ParamId id) { return static_cast<uint32_t>(params[pi(id)]); }

	void fillBuf(float *buf, float value) {
		std::fill(buf, buf + renderFrames, value);
	}

	VoiceSlot *findFreeSlot() {
		for (auto &slot : voices) {
			if (!slot.active) return &slot;
		}
		return nullptr;
	}

	VoiceSlot *stealVoice() {
		VoiceSlot *oldest = nullptr;
		for (auto &slot : voices) {
			if (slot.releasing && (!oldest || slot.age < oldest->age)) {
				oldest = &slot;
			}
		}
		if (oldest) return oldest;

		for (auto &slot : voices) {
			if (slot.active && (!oldest || slot.age < oldest->age)) {
				oldest = &slot;
			}
		}
		return oldest;
	}
};

} // namespace wasm_audio
