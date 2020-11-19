#pragma once

#include <cmath>

namespace Oscillator {
	constexpr float pi = 3.14159265358979f;
	constexpr float twoPi = 2.f * pi;
	constexpr float semiFactor = 1.0594630943592953f;
	constexpr float centFactor = 1.0005777895065548f;

	enum class Mode {
		SAW,
		SINE,
		SQUARE,
		TRIANGLE
	};

	class Kernel {
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
		inline float computeSample() {
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
		inline float computeSine() {
			return std::sin(phase);
		}

		private:
		inline float computeSaw() {
			float value = 1.0 - (2.0 * phase / twoPi);
			return value - computePolyBLEP(phase / twoPi, phaseIncrement / twoPi);
		}

		private:
		inline float computeSquare() {
			auto value = phase <= pi ? 1 : -1;
			value += computePolyBLEP(phase / twoPi, phaseIncrement / twoPi);
			value -= computePolyBLEP(fmod(phase / twoPi + 0.5, 1.0), phaseIncrement / twoPi);
			return value;
		}

		private:
		inline float computeTriangle() {
			auto value = computeSquare();
			value = phaseIncrement * value + (1.f - phaseIncrement) * lastValue;
			lastValue = value;
			return value;
		}

		private:
		inline float computePhaseIncrement(float frequency) {
			return frequency * twoPi / sampleRate;
		}

		private:
		inline float computePolyBLEP(float t, float dt) {
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
		inline void updatePhase(float frequency) {
			phase += phaseIncrement;
			if (phase >= twoPi) phase -= twoPi;
		}

		private:
		inline float shiftFrequency(float frequency) {
			auto semiShited = shiftFrequency(frequency, semiFactor, semiShift);
			return shiftFrequency(semiShited, centFactor, centShift);
		}

		private:
		inline float shiftFrequency(float frequency, float factor, int steps) {
			return steps < 0 ? frequency / std::pow(factor, std::abs(steps)) : frequency * std::pow(factor, steps);
		}

		private:
		Mode mode;

		float phase = 0.f;
		float phaseIncrement = 0.f;
		float lastValue = 0.f;

		float semiShift = 0.f;
		float centShift = 0.f;

		float amplitude = 0.5f;

		float sampleRate = 44100.f;
	};
} // namespace Oscillator