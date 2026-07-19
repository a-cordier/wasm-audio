/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <cmath>

namespace wasm_audio {
namespace Waveshaper {

	// Soft-knee overdrive (original poly-ticks algorithm).
	// drive: 0..1 range (0 = clean, approaching 1 = hard clip).
	inline float softClip(float sample, float drive) {
		float k = 2.0f * drive / (1.0f - drive);
		return (1.0f + k) * sample / (1.0f + k * std::fabs(sample));
	}

	// Tanh-based saturation (polynomial approximation, NOT bounded for large input).
	// drive: multiplier applied before tanh (1 = subtle, 5+ = heavy).
	inline float tanhDrive(float sample, float drive) {
		if (drive <= 0.0f) return sample;
		float x2 = (sample * drive) * (sample * drive);
		float x = sample * drive;
		return x * (27.0f + x2) / (27.0f + 9.0f * x2);
	}

	// True tanh saturation. Guaranteed bounded to [-1, 1].
	// Use as output limiter when the signal can exceed safe levels.
	inline float tanhLimit(float sample, float drive) {
		if (drive <= 0.0f) return sample;
		return std::tanh(sample * drive);
	}

	// Wavefolding distortion. Folds the signal back when it exceeds threshold.
	// threshold: fold-back point (e.g. 0.5 for aggressive folding).
	inline float foldback(float sample, float threshold) {
		if (threshold <= 0.0f) return 0.0f;
		while (sample > threshold || sample < -threshold) {
			if (sample > threshold) {
				sample = 2.0f * threshold - sample;
			} else if (sample < -threshold) {
				sample = -2.0f * threshold - sample;
			}
		}
		return sample;
	}

} // namespace Waveshaper
} // namespace wasm_audio
