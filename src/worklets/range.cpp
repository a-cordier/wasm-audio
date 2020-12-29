#pragma once

#include "constants.cpp"

struct Range {
	const float min;
	const float max;

	Range(const float min, const float max) :
		min(min), max(max) {}

	float map(float value, Range const &range) const {
		return min + ((value - range.min) * (max - min) / (range.max - range.min));
	}

	float clamp(float value) const {
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}
};

const Range midiRange{ 0.f, 127.f };
const Range amplitudeRange{ -Constants::voiceGain, Constants::voiceGain };
const Range zeroOneRange{ 0.f, 1.f };
const Range attackRange{ Constants::epsilon, .5f };
const Range decayRange{ 0.05f, 1.f };
const Range sustainRange{ 0.1f, 1.f };
const Range releaseRange{ 0.1f, .75f };
const Range cutoffRange{ 0.007f, 0.97f };
const Range resonanceRange{ 0.f, 0.95f };
const Range driveRange{ 0.f, 0.75f };
const Range envelopeAmountRange{ 0.f, 1.f };
const Range semiShiftRange{ -24.f, 24.f };
const Range centShiftRange{ -50.f, 50.f };
const Range lfoFrequencyRange{ 0.f, 25.f };
const Range oscCycleRange{ 0.25f, 0.75f };