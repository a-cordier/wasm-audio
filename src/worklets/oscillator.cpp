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

#include "constants.cpp"
#include <cmath>
#include <cstdint>

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
	}

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

		public:
		float nextSample(float frequency) {
			frequency = shiftFrequency(frequency);
			phaseIncrement = computePhaseIncrement(frequency);
			float sample = amplitude * computeSample();
			updatePhase(frequency);
			return sample;
		}

		public:
		void setMode(Mode newMode) {
			mode = newMode;
		}

		public:
		void setAmplitude(float newAmplitude) {
			amplitude = newAmplitude;
		}

		public:
		void setSemiShift(float newSemiShift) {
			if (newSemiShift != semiShift) {
				semiShift = newSemiShift;
				updateShiftMultiplier();
			}
		}

		public:
		void setCentShift(float newCentShift) {
			if (newCentShift != centShift) {
				centShift = newCentShift;
				updateShiftMultiplier();
			}
		}

		public:
		void setDutyCycle(float newDutyCycle) {
			dutyCycle = newDutyCycle;
		}

		public:
		void setSampleRate(float newSampleRate) {
			sampleRate = newSampleRate;
		}

		public:
		void reset() {
			phase = 0.f;
			phaseIncrement = 0.f;
			lastValue = 0.f;
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

		private:
		float computeSine() {
			return SineTable::lookup(phase);
		}

		private:
		float computeSaw() {
			float value = 1.0 - (2.0 * phase / Constants::twoPi);
			return value - computePolyBLEP(phase / Constants::twoPi, phaseIncrement / Constants::twoPi);
		}

		private:
		float computeSquare() {
			auto value = phase <= Constants::twoPi * dutyCycle ? 1 : -1;
			value += computePolyBLEP(phase / Constants::twoPi, phaseIncrement / Constants::twoPi);
			value -= computePolyBLEP(fmod(phase / Constants::twoPi + 0.5, 1.0), phaseIncrement / Constants::twoPi);
			return value;
		}

		private:
		float computeTriangle() {
			auto value = computeSquare();
			value = phaseIncrement * value + (1.f - phaseIncrement) * lastValue;
			lastValue = value;
			return value;
		}

		private:
		float computeNoise() {
			const static int q = 15;
			const static float c1 = (1 << q) - 1;
			const static float c2 = ((int)(c1 / 3)) + 1;
			const static float c3 = 1.f / c1;
			const static float c4 = c2 - 1.f;
			float c5 = 6.f * computeRandomValue() * c2;
			float c6 = 3.f * c4;
			return (c5 - c6) * c3;
		}

		private:
		float computeRandomValue() {
			rngState ^= rngState << 13;
			rngState ^= rngState >> 17;
			rngState ^= rngState << 5;
			return static_cast<float>(rngState) / static_cast<float>(UINT32_MAX);
		}

		private:
		float computePhaseIncrement(float frequency) {
			return frequency * Constants::twoPi / sampleRate;
		}

		private:
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

		private:
		void updatePhase(float frequency) {
			phase += phaseIncrement;
			if (phase >= Constants::twoPi) {
				phase -= Constants::twoPi;
			}
		}

		private:
		float shiftFrequency(float frequency) {
			return frequency * shiftMultiplier;
		}

		private:
		void updateShiftMultiplier() {
			shiftMultiplier = std::pow(Constants::semiFactor, semiShift)
			                * std::pow(Constants::centFactor, centShift);
		}

		private:
		static uint32_t nextSeed() {
			static uint32_t counter = 0;
			return ++counter * 2654435761u;
		}

		Mode mode;

		uint32_t rngState = nextSeed();

		float phase = 0.f;
		float phaseIncrement = 0.f;
		float lastValue = 0.f;

		float semiShift = 0.f;
		float centShift = 0.f;
		float shiftMultiplier = 1.f;

		float amplitude = 0.5f;

		float dutyCycle = 0.5f;

		float sampleRate = Constants::sampleRate;
	};
} // namespace Oscillator