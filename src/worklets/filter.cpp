#include "filter-mode.cpp"
#include "range.cpp"
#include <iostream>

constexpr float cutoffRangeMin = 0.03f;
constexpr float cutoffRangeMax = 0.99f;

constexpr float resonanceRangeMin = 0.f;
constexpr float resonanceRangeMax = 0.98f;

class Filter {
	public:
	Filter() :
					mode(FilterMode::LOWPASS),
					buf0(0.0),
					buf1(0.0),
					buf2(0.0),
					buf3(0.0) {
	}

	public:
	void setMode(FilterMode _mode) noexcept {
		mode = _mode;
	}

	public:
	float filter(float sample, float cutoff, float resonance, float cutoffMod) {
		float computedCutoff = computeCutoff(cutoff, cutoffMod);
		float feedbackAmount = resonance + resonance / (1.0 - computedCutoff);
		buf0 += computedCutoff * (sample - buf0 + feedbackAmount * (buf0 - buf1));
		buf1 += computedCutoff * (buf0 - buf1);
		buf2 += computedCutoff * (buf1 - buf2);
		buf3 += computedCutoff * (buf2 - buf3);
		switch (mode) {
			case FilterMode::LOWPASS:
				return buf3;
			case FilterMode::HIGHPASS:
				return sample - buf3;
			case FilterMode::BANDPASS:
				return buf0 - buf3;
			default:
				return 0.0;
		}
	}

	private:
	inline float computeCutoff(float cutoff, float cutoffMod) {
		auto computedCutoff = cutoff + cutoffMod;
		if (computedCutoff >= cutoffRange.max) return cutoffRangeMax;
		if (computedCutoff <= cutoffRange.min) return cutoffRangeMin;
		return computedCutoff;
	}

	private:
	FilterMode mode;

	float buf0;
	float buf1;
	float buf2;
	float buf3;
};