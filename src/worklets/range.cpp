#pragma once

struct Range {
	const float min;
	const float max;

	Range(const float min, const float max) :
		min(min), max(max) {}

	float map(float value, Range const &range) {
		return min + ((value - range.min) * (max - min) / (range.max - range.min));
	}
};

Range midiRange{ 0, 127.f };
Range zeroOneRange{ 0.f, 1.f };
Range attackRange{ 0.0001f, 1.f };
Range decayRange{ 0.001f, 1.f };
Range sustainRange{ 0.2f, 0.9f };
Range releaseRange{ 0.2f, 1.f };
Range cutoffRange{ 0.03f, .99f };
Range resonanceRange{ 0.f, 0.98f };
Range envelopeAmountRange{ 0.f, 1.f };
Range semiShiftRange{ -24.f, 24.f };
Range centShiftRange{ -50.f, 50.f };