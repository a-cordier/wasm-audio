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
#include <cmath>
#include <cstdint>

namespace wasm_audio {
namespace Oscillator {
	namespace SineTable {
		static constexpr int SIZE = 2048;
		static constexpr float INDEX_SCALE = SIZE / Constants::twoPi;
		static float table[SIZE + 1];
		static bool initialized = false;

		static void init() {
			if (initialized) return;
			for (int i = 0; i < SIZE; ++i)
				table[i] = std::sin(Constants::twoPi * i / SIZE);
			table[SIZE] = table[0];
			initialized = true;
		}

		static float lookup(float phase) {
			float index = phase * INDEX_SCALE;
			int i0 = static_cast<int>(index);
			float frac = index - i0;
			// Float rounding can hand wrapPhase's callers a phase of exactly
			// twoPi, making i0 == SIZE and table[i0 + 1] a one-past-end read.
			i0 &= SIZE - 1;
			return table[i0] + frac * (table[i0 + 1] - table[i0]);
		}
	} // namespace SineTable

	enum class Mode {
		SAW,
		SINE,
		SQUARE,
		TRIANGLE,
		NOISE,
	};

	class Kernel {
		public:
		Kernel(float sampleRate) :
			sampleRate(sampleRate) { SineTable::init(); }

		float nextSample(float frequency) {
			return nextSample(frequency, 0.f);
		}

		// phaseOffset is in radians and is applied to the waveform lookup only:
		// it never accumulates into the running phase, which is what makes this
		// phase modulation rather than frequency modulation.
		float nextSample(float frequency, float phaseOffset) {
			frequency = shiftFrequency(frequency);
			phaseIncrement = computePhaseIncrement(frequency);
			float readPhase = (phaseOffset == 0.f) ? phase : wrapPhase(phase + phaseOffset);
			float sample = amplitude * computeSample(readPhase);
			updatePhase();
			return sample;
		}

		// True for the sample on which the phase last wrapped past 2pi.
		bool didWrap() const {
			return wrapped;
		}

		// How far into the current sample the wrap happened, as a fraction of one
		// phase increment. Lets a synced slave restart at the sub-sample position
		// of the master's wrap instead of at the sample boundary.
		float wrapFraction() const {
			return wrapFrac;
		}

		// Hard sync: restart the phase at the master's sub-sample wrap position.
		void syncPhase(float fractionOfIncrement) {
			phase = wrapPhase(fractionOfIncrement * phaseIncrement);
		}

		// A fresh phase in [0, 2pi) drawn from this oscillator's own RNG.
		float randomPhase() {
			return computeRandomValue() * Constants::twoPi;
		}

		// Restart with a start phase scaled by drift: 0 restarts at zero (and
		// leaves the RNG untouched, so a drift-free patch is fully repeatable),
		// 1 spreads the start phase over the whole cycle.
		void resetWithDrift(float drift) {
			reset(drift > 0.f ? drift * randomPhase() : 0.f);
		}

		void setMode(Mode newMode) {
			mode = newMode;
		}

		void setAmplitude(float newAmplitude) {
			amplitude = newAmplitude;
		}

		void setSemiShift(float newSemiShift) {
			if (newSemiShift != semiShift) {
				semiShift = newSemiShift;
				updateShiftMultiplier();
			}
		}

		void setCentShift(float newCentShift) {
			if (newCentShift != centShift) {
				centShift = newCentShift;
				updateShiftMultiplier();
			}
		}

		void setDutyCycle(float newDutyCycle) {
			dutyCycle = newDutyCycle;
		}

		void setSampleRate(float newSampleRate) {
			sampleRate = newSampleRate;
		}

		void reset() {
			reset(0.f);
		}

		void reset(float startPhase) {
			phase = wrapPhase(startPhase);
			phaseIncrement = 0.f;
			wrapped = false;
			wrapFrac = 0.f;
		}

		private:
		static float wrapPhase(float p) {
			if (p >= 0.f && p < Constants::twoPi) return p;
			p = std::fmod(p, Constants::twoPi);
			return (p < 0.f) ? p + Constants::twoPi : p;
		}

		float computeSample(float p) {
			switch (mode) {
				case Mode::SINE:
					return computeSine(p);
				case Mode::SAW:
					return computeSaw(p);
				case Mode::SQUARE:
					return computeSquare(p);
				case Mode::TRIANGLE:
					return computeTriangle(p);
				case Mode::NOISE:
					return computeNoise();
			}
			return 0.f;
		}

		float computeSine(float p) {
			return SineTable::lookup(p);
		}

		// This saw FALLS (1-2t): its wrap step is +2, while the BLEP residual's
		// step is -2 (it is shaped for the rising saw 2t-1, where it is
		// subtracted). For the falling saw the residual must therefore be
		// ADDED — subtracting it doubled the discontinuity instead of
		// cancelling it, leaving the saw buzzier and ~6 dB hotter than naive.
		float computeSaw(float p) {
			float value = 1.0 - (2.0 * p / Constants::twoPi);
			return value + computePolyBLEP(p / Constants::twoPi, phaseIncrement / Constants::twoPi);
		}

		// Two discontinuities per cycle: the rising edge at phase 0 and the
		// falling edge at the duty-cycle point. Each gets its own PolyBLEP.
		float computeSquare(float p) {
			float t = p / Constants::twoPi;
			float dt = phaseIncrement / Constants::twoPi;

			// Must be float: an int here silently truncates both corrections
			// away and leaves a naive, aliasing three-level wave.
			float value = (t <= dutyCycle) ? 1.f : -1.f;

			value += computePolyBLEP(t, dt);

			// The falling edge sits at dutyCycle, not at a fixed half cycle,
			// otherwise the correction is misplaced for any duty other than 50%.
			float fallingEdge = t - dutyCycle;
			if (fallingEdge < 0.f) fallingEdge += 1.f;
			value -= computePolyBLEP(fallingEdge, dt);

			return value;
		}

		// PolyBLAMP triangle: direct computation from phase, amplitude-stable at all frequencies.
		// Replaces the old leaky-integrator approach which was frequency-dependent.
		float computeTriangle(float p) {
			float t = p / Constants::twoPi;
			float dt = phaseIncrement / Constants::twoPi;

			float naive = (t < 0.5f) ? (4.0f * t - 1.0f) : (3.0f - 4.0f * t);

			naive += 4.0f * computePolyBLAMP(t, dt);
			float t2 = t + 0.5f;
			if (t2 >= 1.0f) t2 -= 1.0f;
			naive -= 4.0f * computePolyBLAMP(t2, dt);

			return naive;
		}

		float computeNoise() {
			return computeRandomValue() * 2.0f - 1.0f;
		}

		float computeRandomValue() {
			rngState ^= rngState << 13;
			rngState ^= rngState >> 17;
			rngState ^= rngState << 5;
			return static_cast<float>(rngState) / static_cast<float>(UINT32_MAX);
		}

		float computePhaseIncrement(float frequency) {
			return frequency * Constants::twoPi / sampleRate;
		}

		float computePolyBLEP(float t, float dt) {
			if (t < dt) {
				t /= dt;
				return t + t - t * t - 1.f;
			} else if (t > 1.f - dt) {
				t = (t - 1.f) / dt;
				return t * t + t + t + 1.f;
			} else {
				return 0.f;
			}
		}

		// Integrated PolyBLEP for correcting slope (ramp) discontinuities in the triangle.
		// Derived as the running integral of computePolyBLEP, continuous across the transition.
		float computePolyBLAMP(float t, float dt) {
			if (t < dt) {
				float d = t / dt;
				float x = 1.0f - d;
				return dt * x * x * x / 3.0f;
			} else if (t > 1.0f - dt) {
				float d = (t - (1.0f - dt)) / dt;
				return dt * d * d * d / 3.0f;
			}
			return 0.0f;
		}

		void updatePhase() {
			phase += phaseIncrement;
			if (phase >= Constants::twoPi) {
				phase -= Constants::twoPi;
				wrapped = true;
				wrapFrac = (phaseIncrement > 0.f) ? phase / phaseIncrement : 0.f;
			} else {
				wrapped = false;
				wrapFrac = 0.f;
			}
		}

		float shiftFrequency(float frequency) {
			return frequency * shiftMultiplier;
		}

		void updateShiftMultiplier() {
			shiftMultiplier = std::pow(Constants::semiFactor, semiShift)
			                * std::pow(Constants::centFactor, centShift);
		}

		static uint32_t nextSeed() {
			static uint32_t counter = 0;
			return ++counter * 2654435761u;
		}

		Mode mode = Mode::SINE;

		uint32_t rngState = nextSeed();

		float phase = 0.f;
		float phaseIncrement = 0.f;
		bool wrapped = false;
		float wrapFrac = 0.f;

		float semiShift = 0.f;
		float centShift = 0.f;
		float shiftMultiplier = 1.f;

		float amplitude = 0.5f;

		float dutyCycle = 0.5f;

		float sampleRate;
	};

	// Standalone noise generator, no phase/frequency dependency.
	class NoiseKernel {
		public:
		float nextSample() {
			rngState ^= rngState << 13;
			rngState ^= rngState >> 17;
			rngState ^= rngState << 5;
			return static_cast<float>(rngState) / static_cast<float>(UINT32_MAX) * 2.0f - 1.0f;
		}

		void reset() {
			rngState = nextSeed();
		}

		private:
		static uint32_t nextSeed() {
			static uint32_t counter = 1000;
			return ++counter * 2654435761u;
		}

		uint32_t rngState = nextSeed();
	};
} // namespace Oscillator
} // namespace wasm_audio
