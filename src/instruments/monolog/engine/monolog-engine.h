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

#include "monolog-voice.h"
#include "range.h"
#include <algorithm>
#include <cmath>
#include <cstdint>

namespace wasm_audio {
namespace Monolog {

	enum class ParamId : int {
		OSC_MODE = 0,
		SUB_LEVEL,
		NOISE_LEVEL,
		CUTOFF,
		RESONANCE,
		DRIVE,
		AMP_ATTACK,
		AMP_DECAY,
		AMP_SUSTAIN,
		AMP_RELEASE,
		FILTER_ATTACK,
		FILTER_DECAY,
		FILTER_AMOUNT,
		FILTER_VELOCITY,
		LFO_MODE,
		LFO_RATE,
		LFO_AMOUNT,
		LFO_DESTINATION,
		GLIDE_TIME,
		LEGATO,
		PULSE_WIDTH,
		FILTER_MODEL,
		PARAM_COUNT,
	};

	class Engine {
		static constexpr unsigned MAX_FRAMES = 128;
		static constexpr int NUM_PARAMS = static_cast<int>(ParamId::PARAM_COUNT);
		static constexpr int NOTE_STACK_SIZE = 16;

	public:
		Engine(float sampleRate, float renderFrames)
			: sampleRate(sampleRate),
			  renderFrames(std::min(static_cast<unsigned>(renderFrames), MAX_FRAMES)),
			  voice(sampleRate) {}

		void noteOn(int midi, float frequency, float velocity) {
			bool wasActive = voice.isActive();

			noteStackPush(midi, frequency);

			glideFrom = wasActive ? currentGlideFreq() : frequency;
			glideTo = frequency;
			glidePhase = (wasActive && glideTimeSec() > 0.f) ? 0.f : 1.f;

			currentMidi = midi;
			currentVelocity = zeroOneRange.map(velocity, midiRange);

			if (!wasActive || !isLegato()) {
				voice.reset();
				voice.noteOn();
			}
		}

		void noteOff(int midi) {
			noteStackRemove(midi);

			if (noteStackTop >= 0) {
				int prevMidi = noteStack[noteStackTop];
				float prevFreq = noteStackFreq[noteStackTop];

				glideFrom = currentGlideFreq();
				glideTo = prevFreq;
				glidePhase = (glideTimeSec() > 0.f) ? 0.f : 1.f;

				currentMidi = prevMidi;

				if (!isLegato()) {
					voice.reset();
					voice.noteOn();
				}
			} else {
				if (voice.isActive() && currentMidi == midi) {
					voice.noteOff();
				}
			}
		}

		void setParam(int paramId, float value) {
			if (paramId < 0 || paramId >= NUM_PARAMS) return;
			params[paramId] = value;
		}

		void process(uintptr_t outputPtr, unsigned channelCount) {
			float *output = reinterpret_cast<float *>(outputPtr);
			std::fill(output, output + renderFrames, 0.f);

			if (!voice.isActive()) {
				for (unsigned ch = 1; ch < channelCount; ++ch)
					std::copy(output, output + renderFrames, output + ch * renderFrames);
				return;
			}

			applyParams();

			for (unsigned s = 0; s < renderFrames; ++s) {
				updateGlide();
				float freq = currentGlideFreq();
				output[s] = voice.processSample(freq, currentVelocity);

				if (voice.isStopped()) break;
			}

			for (unsigned ch = 1; ch < channelCount; ++ch)
				std::copy(output, output + renderFrames, output + ch * renderFrames);
		}

	private:
		static int pi(ParamId id) { return static_cast<int>(id); }

		bool isLegato() const { return params[pi(ParamId::LEGATO)] >= 0.5f; }

		float glideTimeSec() const {
			float t = params[pi(ParamId::GLIDE_TIME)] / 127.f;
			return t * t * 0.75f;
		}

		float currentGlideFreq() const {
			if (glidePhase >= 1.f) return glideTo;
			float logFrom = std::log(glideFrom);
			float logTo = std::log(glideTo);
			return std::exp(logFrom + (logTo - logFrom) * glidePhase);
		}

		void updateGlide() {
			if (glidePhase >= 1.f) return;
			float glideTime = glideTimeSec();
			float phaseInc = (glideTime > 0.f) ? 1.f / (glideTime * sampleRate) : 1.f;
			glidePhase = std::min(glidePhase + phaseInc, 1.f);
		}

		void applyParams() {
			voice.setOscMode(static_cast<Oscillator::Mode>(static_cast<uint32_t>(params[pi(ParamId::OSC_MODE)])));
			voice.setSubLevel(zeroOneRange.map(params[pi(ParamId::SUB_LEVEL)], midiRange));
			voice.setNoiseLevel(zeroOneRange.map(params[pi(ParamId::NOISE_LEVEL)], midiRange));
			voice.setCutoff(cutoffRange.map(params[pi(ParamId::CUTOFF)], midiRange));
			voice.setResonance(resonanceRange.map(params[pi(ParamId::RESONANCE)], midiRange));
			voice.setDrive(driveRange.map(params[pi(ParamId::DRIVE)], midiRange));
			voice.setPulseWidth(zeroOneRange.map(params[pi(ParamId::PULSE_WIDTH)], midiRange));
			voice.setFilterModel(static_cast<FilterModel>(static_cast<uint32_t>(params[pi(ParamId::FILTER_MODEL)])));

			voice.setAmpAttack(params[pi(ParamId::AMP_ATTACK)]);
			voice.setAmpDecay(params[pi(ParamId::AMP_DECAY)]);
			voice.setAmpSustain(params[pi(ParamId::AMP_SUSTAIN)]);
			voice.setAmpRelease(params[pi(ParamId::AMP_RELEASE)]);

			voice.setFilterAttack(params[pi(ParamId::FILTER_ATTACK)]);
			voice.setFilterDecay(params[pi(ParamId::FILTER_DECAY)]);
			voice.setFilterEnvAmount(params[pi(ParamId::FILTER_AMOUNT)]);
			voice.setFilterEnvVelocity(params[pi(ParamId::FILTER_VELOCITY)]);

			voice.setLfoMode(static_cast<Oscillator::Mode>(static_cast<uint32_t>(params[pi(ParamId::LFO_MODE)])));
			voice.setLfoRate(params[pi(ParamId::LFO_RATE)]);
			voice.setLfoAmount(params[pi(ParamId::LFO_AMOUNT)]);
			voice.setLfoDestination(static_cast<LfoDestination>(static_cast<uint32_t>(params[pi(ParamId::LFO_DESTINATION)])));
		}

		// --- Note stack (last-note priority) ---

		void noteStackPush(int midi, float frequency) {
			if (noteStackTop < NOTE_STACK_SIZE - 1) {
				++noteStackTop;
				noteStack[noteStackTop] = midi;
				noteStackFreq[noteStackTop] = frequency;
			}
		}

		void noteStackRemove(int midi) {
			for (int i = 0; i <= noteStackTop; ++i) {
				if (noteStack[i] == midi) {
					for (int j = i; j < noteStackTop; ++j) {
						noteStack[j] = noteStack[j + 1];
						noteStackFreq[j] = noteStackFreq[j + 1];
					}
					--noteStackTop;
					return;
				}
			}
		}

		float sampleRate;
		unsigned renderFrames;

		Voice voice;
		float params[NUM_PARAMS] = {};

		int currentMidi = -1;
		float currentVelocity = 1.f;

		int noteStack[NOTE_STACK_SIZE] = {};
		float noteStackFreq[NOTE_STACK_SIZE] = {};
		int noteStackTop = -1;

		float glideFrom = 440.f;
		float glideTo = 440.f;
		float glidePhase = 1.f;
	};

} // namespace Monolog
} // namespace wasm_audio
