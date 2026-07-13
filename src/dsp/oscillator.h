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
			frequency = shiftFrequency(frequency);
			phaseIncrement = computePhaseIncrement(frequency);
			float sample = amplitude * computeSample();
			updatePhase(frequency);
			return sample;
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
			phase = 0.f;
			phaseIncrement = 0.f;
		}

		private:
		float computeSample() {
			switch (mode) {
				case Mode::SINE:
					return computeSine();
				case Mode::SAW:
					return computeSaw();
				case Mode::SQUARE:
					return computeSquare();
				case Mode::TRIANGLE:
					return computeTriangle();
				case Mode::NOISE:
					return computeNoise();
			}
		}

		float computeSine() {
			return SineTable::lookup(phase);
		}

		float computeSaw() {
			float value = 1.0 - (2.0 * phase / Constants::twoPi);
			return value - computePolyBLEP(phase / Constants::twoPi, phaseIncrement / Constants::twoPi);
		}

		float computeSquare() {
			auto value = phase <= Constants::twoPi * dutyCycle ? 1 : -1;
			value += computePolyBLEP(phase / Constants::twoPi, phaseIncrement / Constants::twoPi);
			value -= computePolyBLEP(fmod(phase / Constants::twoPi + 0.5, 1.0), phaseIncrement / Constants::twoPi);
			return value;
		}

		// PolyBLAMP triangle: direct computation from phase, amplitude-stable at all frequencies.
		// Replaces the old leaky-integrator approach which was frequency-dependent.
		float computeTriangle() {
			float t = phase / Constants::twoPi;
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

		void updatePhase(float frequency) {
			phase += phaseIncrement;
			if (phase >= Constants::twoPi) {
				phase -= Constants::twoPi;
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
