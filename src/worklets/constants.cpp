#pragma once

namespace Constants {
	constexpr float sampleRate = 44100.f;
	constexpr float epsilon = 0.0001f;
	constexpr float pi = 3.14159265358979f;
	constexpr float twoPi = 2.f * pi;
	constexpr float semiFactor = 1.0594630943592953f;
	constexpr float centFactor = 1.0005777895065548f;
	constexpr unsigned kRenderQuantumFrames = 128;
	constexpr float subOscPresence = 0.4f;
	constexpr float voiceGain = 0.75f;
} // namespace Constants