#pragma once

#include "constants.cpp"
#include <cmath>

namespace Oscillator {
	enum class Mode {
		SAW,
		SINE,
		SQUARE,
		TRIANGLE
	};

	class Kernel {
		public:
		Kernel(float sampleRate) :
			sampleRate(sampleRate) {}

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
			auto value = phase <= Constants::pi ? 1 : -1;
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
			if (phase >= Constants::twoPi) phase -= Constants::twoPi;
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

		float sampleRate = Constants::sampleRate;
	};
} // namespace Oscillator