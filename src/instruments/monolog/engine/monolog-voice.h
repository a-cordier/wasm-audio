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

#include "constants.h"
#include "dc-blocker.h"
#include "envelope.h"
#include "filter.h"
#include "lfo.h"
#include "oscillator.h"
#include "range.h"
#include "waveshaper.h"
#include <algorithm>
#include <cmath>
#include <cstdint>

namespace wasm_audio {
namespace Monolog {

	enum class FilterModel {
		MOOG = 0,
		ACID = 1,
		SCREAM = 2,
		KORG = 3,
	};

	enum class LfoDestination {
		PITCH = 0,
		CUTOFF = 1,
		PULSE_WIDTH = 2,
	};

	enum class VoiceState {
		DISPOSED,
		STARTED,
		STOPPING,
		STOPPED,
	};

	class Voice {
	public:
		Voice(float sampleRate) :
			sampleRate(sampleRate),
			osc(sampleRate),
			subOsc(sampleRate),
			noise(),
			moogFilter(sampleRate),
			diodeFilter(sampleRate),
			screamerFilter(sampleRate),
			korgFilter(sampleRate),
			lfo(sampleRate),
			dcBlocker(sampleRate),
			ampEnv(sampleRate, 1.f, 0.f, 0.01f, 0.3f, 0.5f),
			filterEnv(sampleRate, 1.f, 0.f, 0.01f, 0.5f, 0.f),
			state(VoiceState::DISPOSED) {
			osc.setAmplitude(1.0f);
			subOsc.setAmplitude(1.0f);
			subOsc.setMode(Oscillator::Mode::SQUARE);
			subOsc.setSemiShift(-12.f);
			moogFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			diodeFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			screamerFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			korgFilter.setMode(Filter::Mode::LOWPASS_PLUS);
		}

		float processSample(float frequency, float velocity) {

			float lfoMod = lfoAmount * lfo.nextSample(lfoRate);
			applyLfo(lfoMod, frequency);

			osc.setDutyCycle(pulseWidth);
			float oscOut = osc.nextSample(frequency);
			float subOut = subOsc.nextSample(frequency) * subLevel;
			float noiseOut = noise.nextSample() * noiseLevel;
			float mix = oscOut + subOut + noiseOut;

			float filterEnvMod = filterEnvAmount * filterEnv.nextLevel();
			float velMod = velocity * filterEnvVelocity;
			float modulatedCutoff = cutoffRange.clamp(cutoff + filterEnvMod + velMod);

			float filtered;
			switch (filterModel) {
				case FilterModel::ACID:
					filtered = diodeFilter.nextSample(mix, modulatedCutoff, resonance);
					break;
				case FilterModel::SCREAM:
					filtered = screamerFilter.nextSample(mix, modulatedCutoff, resonance);
					break;
				case FilterModel::KORG:
					filtered = korgFilter.nextSample(mix, modulatedCutoff, resonance);
					break;
				case FilterModel::MOOG:
				default:
					filtered = moogFilter.nextSample(mix, modulatedCutoff, resonance);
					break;
			}

			float shaped = Waveshaper::tanhLimit(filtered, 1.0f + drive * 1.5f);
			float clean = dcBlocker.process(shaped);
			float ampLevel = ampEnv.nextLevel();

			stopIfNecessary();

			return clean * velocity * ampLevel;
		}

		void noteOn() {
			ampEnv.enterAttackStage();
			filterEnv.enterAttackStage();
			state = VoiceState::STARTED;
		}

		void noteOff() {
			ampEnv.enterReleaseStage();
			filterEnv.enterReleaseStage();
			state = VoiceState::STOPPING;
		}

		bool isStopped() const { return state == VoiceState::STOPPED; }
		bool isActive() const { return state == VoiceState::STARTED || state == VoiceState::STOPPING; }

		void reset() {
			osc.reset();
			subOsc.reset();
			moogFilter.reset();
			diodeFilter.reset();
			screamerFilter.reset();
			korgFilter.reset();
			lfo.reset();
			dcBlocker.reset();
			ampEnv.reset();
			filterEnv.reset();
			state = VoiceState::DISPOSED;
		}

		void setOscMode(Oscillator::Mode mode) { osc.setMode(mode); }
		void setPulseWidth(float pw) { pulseWidthBase = pw; pulseWidth = pw; }
		void setSubLevel(float level) { subLevel = level; }
		void setNoiseLevel(float level) { noiseLevel = level; }

		void setFilterModel(FilterModel model) { filterModel = model; }
		void setCutoff(float c) { cutoff = c; }
		void setResonance(float r) { resonance = r; }
		void setDrive(float d) {
			drive = d;
			float filterDrive = 1.0f + d * 2.5f;
			moogFilter.setDrive(filterDrive);
			diodeFilter.setDrive(filterDrive);
			screamerFilter.setDrive(filterDrive);
			korgFilter.setDrive(filterDrive);
		}

		void setAmpAttack(float v) { ampEnv.setAttackTime(attackRange.map(v, midiRange)); }
		void setAmpDecay(float v) { ampEnv.setDecayTime(decayRange.map(v, midiRange)); }
		void setAmpSustain(float v) { ampEnv.setSustainLevel(zeroOneRange.map(v, midiRange)); }
		void setAmpRelease(float v) { ampEnv.setReleaseTime(releaseRange.map(v, midiRange)); }

		void setFilterAttack(float v) { filterEnv.setAttackTime(attackRange.map(v, midiRange)); }
		void setFilterDecay(float v) { filterEnv.setDecayTime(decayRange.map(v, midiRange)); }
		void setFilterEnvAmount(float v) { filterEnvAmount = zeroOneRange.map(v, midiRange); }
		void setFilterEnvVelocity(float v) { filterEnvVelocity = zeroOneRange.map(v, midiRange); }

		void setLfoMode(Oscillator::Mode mode) { lfo.setMode(mode); }
		void setLfoRate(float v) { lfoRate = lfoFrequencyRange.map(v, midiRange); }
		void setLfoAmount(float v) { lfoAmount = zeroOneRange.map(v, midiRange); }
		void setLfoDestination(LfoDestination dest) { lfoDest = dest; }

	private:
		void startIfNecessary() {
			if (state == VoiceState::DISPOSED) {
				ampEnv.enterAttackStage();
				filterEnv.enterAttackStage();
				state = VoiceState::STARTED;
			}
		}

		void stopIfNecessary() {
			if (state == VoiceState::STOPPING && ampEnv.isDone()) {
				state = VoiceState::STOPPED;
			}
		}

		void applyLfo(float mod, float &frequency) {
			pulseWidth = pulseWidthBase;
			switch (lfoDest) {
				case LfoDestination::PITCH:
					frequency += mod * frequency;
					break;
				case LfoDestination::CUTOFF:
					cutoff = cutoffRange.clamp(cutoff + mod);
					break;
				case LfoDestination::PULSE_WIDTH:
					pulseWidth = oscCycleRange.clamp(pulseWidthBase + mod);
					break;
			}
		}

		float sampleRate;

		Oscillator::Kernel osc;
		Oscillator::Kernel subOsc;
		Oscillator::NoiseKernel noise;

		Filter::Moog::LadderKernel moogFilter;
		Filter::Diode::LadderKernel diodeFilter;
		Filter::Screamer::ScreamerKernel screamerFilter;
		Filter::Korg::Korg35Kernel korgFilter;
		LFOKernel lfo;
		DCBlocker dcBlocker;

		Envelope::Kernel ampEnv;
		Envelope::Kernel filterEnv;

		VoiceState state;
		FilterModel filterModel = FilterModel::MOOG;

		float cutoff = 0.5f;
		float resonance = 0.0f;
		float drive = 0.0f;
		float subLevel = 0.0f;
		float noiseLevel = 0.0f;
		float pulseWidth = 0.5f;
		float pulseWidthBase = 0.5f;

		float filterEnvAmount = 0.0f;
		float filterEnvVelocity = 0.0f;

		LfoDestination lfoDest = LfoDestination::CUTOFF;
		float lfoRate = 1.0f;
		float lfoAmount = 0.0f;
	};

} // namespace Monolog
} // namespace wasm_audio
