#pragma once

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

const Range midiRange{ 0, 127.f };
const Range zeroOneRange{ 0.f, 1.f };
const Range attackRange{ 0.0001f, 1.f };
const Range decayRange{ 0.001f, 4.f };
const Range sustainRange{ 0.2f, 0.9f };
const Range releaseRange{ 0.2f, 4.f };
const Range cutoffRange{ 0.05f, 0.999f };
const Range resonanceRange{ 0.f, 0.9f };
const Range envelopeAmountRange{ 0.f, 1.f };
const Range semiShiftRange{ -24.f, 24.f };
const Range centShiftRange{ -50.f, 50.f };
const Range lfoFrequencyRange{ 0.f, 25.f };