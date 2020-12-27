#include "constants.cpp"
#include "range.cpp"
#include <math.h>
#include <array>

namespace Filter {
	enum class Mode {
		LOWPASS,
		LOWPASS_PLUS,
		HIGHPASS,
		BANDPASS
	};

	class Kernel {
		public:
		virtual float nextSample(float sample, float cutoff, float resonance) = 0;

		public:
		virtual void setMode(Mode newMode);
	};

	// Resonant Filter
	class ResonantKernel : public Kernel {
		public:
		ResonantKernel() :
			ResonantKernel(Mode::LOWPASS) {
		}

		public:
		ResonantKernel(Mode mode) :
			mode(mode),
			buf0(0.0),
			buf1(0.0),
			buf2(0.0),
			buf3(0.0) {
		}

		public:
		virtual void setMode(Mode newMode) override {
			mode = newMode;
		}

		public:
		virtual float nextSample(float sample, float cutoff, float resonance) override {
			float feedbackAmount = resonance + resonance / (1.0 - cutoff);
			buf0 += cutoff * (sample - buf0 + feedbackAmount * (buf0 - buf1));
			buf1 += cutoff * (buf0 - buf1);
			buf2 += cutoff * (buf1 - buf2);
			buf3 += cutoff * (buf2 - buf3);
			switch (mode) {
				case Mode::LOWPASS_PLUS:
					return buf3;
				case Mode::LOWPASS:
					return buf1;
				case Mode::HIGHPASS:
					return sample - buf3;
				case Mode::BANDPASS:
					return buf0 - buf3;
				default:
					return 0.0;
			}
		}

		private:
		Mode mode;

		float buf0;
		float buf1;
		float buf2;
		float buf3;
	};

	namespace Moog {
		float snapToZero(float x) {
			if (!(x < -1.0e-8 || x > 1.0e-8)) {
				return 0.f;
			}
			return x;
		}

		// former name : moog_lerp
		float crossfade(float amount, float x, float y) {
			return (1.f - amount) * x + amount * y;
		}

		float moogMin(float a, float b) {
			a = b - a;
			a += fabs(a);
			a *= 0.5f;
			return b - a;
		}

		float saturate(float input) {
			static float limit = 0.95f;
			float x1 = fabs(input + limit);
			float x2 = fabs(input - limit);
			return 0.5f * (x1 - x2);
		}

		float computeClippingFactor(float value, float invertedSaturration) {
			const float factor = value * invertedSaturration;
			if (factor < -1.f) return -1.f;
			if (factor > 1.f) return 1.f;
			return factor;
		}

		float clip(float value, float saturation, float invertedSaturation) {
			const float factor = computeClippingFactor(value, invertedSaturation);
			return saturation * (factor - (factor * factor * factor) / 3.f);
		}

		float fastTanh(float x) {
			float x2 = x * x;
			return x * (27.f + x2) / (27.f + 9.f * x2);
		}

		class KrajeskiKernel : public Kernel {
			public:
			KrajeskiKernel(float sampleRate) :
				sampleRate{ sampleRate },
				drive(1.f),
				gComp(1.f) {
				state.fill(0.f);
				delay.fill(0.f);
			}

			public:
			virtual float nextSample(float sample, float cutoff, float resonance) override {
				static auto cutoffLimit = 8000.f;
				static auto resonanceLimit = 0.7f;

				cutoff *= cutoffLimit;
				resonance = resonance * resonanceLimit / drive;

				float wc = Constants::twoPi * cutoff / sampleRate;

				float g = derivateCutoff(cutoff, wc);
				float gRes = derivateResonance(resonance, wc);

				state[0] = fastTanh(drive * (sample - 4 * gRes * (state[4] - gComp * sample)));

				for (int i = 0; i < 4; ++i) {
					state[i + 1] = g * (0.3 / 1.3 * state[i] + 1 / 1.3 * delay[i] - state[i + 1]) + state[i + 1];
					delay[i] = state[i];
				}

				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return state[4];
					case Mode::LOWPASS:
						return state[2];
					case Mode::BANDPASS:
						return state[0] - state[3];
					case Mode::HIGHPASS:
						return sample - state[1];
				}
			}

			public:
			virtual void setMode(Mode newMode) override {
				mode = newMode;
			}

			private:
			float derivateResonance(float resonance, float wc) {
				return resonance * (1.0029 + 0.0526 * wc - 0.926 * pow(wc, 2) + 0.0218 * pow(wc, 3));
			}

			private:
			float derivateCutoff(float cutoff, float wc) {
				return 0.9892 * wc - 0.4342 * pow(wc, 2) + 0.1381 * pow(wc, 3) - 0.0202 * pow(wc, 4);
			}

			private:
			float sampleRate = Constants::sampleRate;
			float g;
			float gRes;
			float gComp;
			float drive;

			std::array<float, 5> state;
			std::array<float, 5> delay;

			Mode mode = Mode::LOWPASS;
		};
	} // namespace Moog
} // namespace Filter