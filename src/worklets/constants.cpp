#pragma once

namespace Constants {
	constexpr float sampleRate = 44100.f;
	constexpr float epsilon = 0.000001f;
	constexpr float pi = 3.14159265358979323846264338327950288f;
	constexpr float twoPi = 2.f * pi;
	constexpr float semiFactor = 1.0594630943592953f;
	constexpr float centFactor = 1.0005777895065548f;
	constexpr unsigned renderFrames = 128;
	constexpr float subOscPresence = 0.25f;
	constexpr float voiceGain = 0.5f;

	// WIP moog filter
	constexpr float e = 2.71828182845904523536028747135266250;
	constexpr float log2e = 1.44269504088896340735992468100189214;
	constexpr float log10e = 0.434294481903251827651128918916605082;
	constexpr float ln2 = 0.693147180559945309417232121458176568;
	constexpr float ln10 = 2.30258509299404568401799145468436421;
	constexpr float halfPi = pi / 2.f;
	constexpr float quarterPi = pi / 4.f;
	constexpr float oneOverPi = 1.f / pi;
	constexpr float twoOverPi = 2.f / pi;
	constexpr float twoOverSqrtPi = 1.12837916709551257389615890312154517;
	constexpr float sqrtTwo = 1.41421356237309504880168872420969808;
	constexpr float sqrtOneOverTwo = 0.707106781186547524400844362104849039;
	constexpr float oneOverTwoPi = 1.f / twoPi;
} // namespace Constants