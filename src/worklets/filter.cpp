#include "range.cpp"

namespace Filter {
	enum class Mode {
		LOWPASS,
		LOWPASS_PLUS,
		HIGHPASS,
		BANDPASS
	};

	class Kernel {
		public:
		Kernel() :
			mode(Mode::LOWPASS),
			buf0(0.0),
			buf1(0.0),
			buf2(0.0),
			buf3(0.0) {
		}

		public:
		void setMode(Mode newMode) noexcept {
			mode = newMode;
		}

		public:
		float nextSample(float sample, float cutoff, float resonance) {
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
} // namespace Filter