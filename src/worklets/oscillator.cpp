#pragma once

#include "constants.cpp"
#include <cmath>
#include <cstdlib>
#include <ctime>

namespace Oscillator {
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
			sampleRate(sampleRate) { srand(time(NULL)); }

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
			semiShift = newSemiShift;
		}

		public:
		void setCentShift(float newCentShift) {
			centShift = newCentShift;
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
		void resetPhase() {
			float phase = 0.f;
			float phaseIncrement = 0.f;
			float lastValue = 0.f;
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
			return std::sin(phase);
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
			const static float max = static_cast<float>(RAND_MAX);
			return static_cast<float>(rand()) / max;
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
			auto semiShited = shiftFrequency(frequency, Constants::semiFactor, semiShift);
			return shiftFrequency(semiShited, Constants::centFactor, centShift);
		}

		private:
		float shiftFrequency(float frequency, float factor, int steps) {
			return steps < 0 ? shiftLeft(frequency, factor, steps) : shiftRight(frequency, factor, steps);
		}

		private:
		float shiftLeft(float frequency, float factor, int steps) {
			return frequency / std::pow(factor, -steps);
		}

		private:
		float shiftRight(float frequency, float factor, int steps) {
			return frequency * std::pow(factor, steps);
		}

		private:
		Mode mode;

		float phase = 0.f;
		float phaseIncrement = 0.f;
		float lastValue = 0.f;

		float semiShift = 0.f;
		float centShift = 0.f;

		float amplitude = 0.5f;

		float dutyCycle = 0.2f;

		float sampleRate = Constants::sampleRate;
	};
} // namespace Oscillator