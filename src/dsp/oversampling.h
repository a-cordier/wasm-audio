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

#include <array>

namespace wasm_audio {

// 2x oversampling using a 7-tap half-band FIR filter.
// Wraps a processing callback that runs at 2x sample rate.
// Typical use: oversample the filter stage to reduce aliasing
// from resonant self-oscillation.
class Oversampler2x {
	public:
	Oversampler2x() {
		upBuffer.fill(0.0f);
		downBuffer.fill(0.0f);
	}

	// Process one input sample through a 2x oversampled callback.
	// The callback is called twice per input sample at 2x rate.
	// Returns one output sample at the original rate.
	template<typename ProcessFn>
	float process(float input, ProcessFn fn) {
		float up0 = halfBandUp(input);
		float up1 = halfBandUp(0.0f);

		float out0 = fn(up0);
		float out1 = fn(up1);

		return halfBandDown(out0, out1);
	}

	void reset() {
		upBuffer.fill(0.0f);
		downBuffer.fill(0.0f);
	}

	private:
	// 7-tap half-band FIR coefficients (symmetric, only odd taps nonzero + center)
	// Designed for -60dB stopband rejection.
	static constexpr int HALF_ORDER = 3;
	static constexpr float coeffs[4] = {
		0.0f,
		-0.0625f,
		0.0f,
		0.5625f,
	};
	// Full symmetric kernel: {-0.0625, 0, 0.5625, 1, 0.5625, 0, -0.0625} (scaled by 0.5 for unit gain)

	float halfBandUp(float input) {
		upBuffer[upIdx] = input;
		float sum = 0.0f;
		for (int i = 0; i < 4; ++i) {
			int idx = (upIdx - i + 7) % 7;
			sum += coeffs[i] * upBuffer[idx];
			if (i > 0) {
				int mirrorIdx = (upIdx + i) % 7;
				sum += coeffs[i] * upBuffer[mirrorIdx];
			}
		}
		upIdx = (upIdx + 1) % 7;
		return sum * 2.0f;
	}

	float halfBandDown(float even, float odd) {
		downBuffer[downIdx] = even;
		float sum = even;
		for (int i = 1; i <= HALF_ORDER; ++i) {
			int idx = (downIdx - 2 * i + 7) % 7;
			sum += coeffs[i] * (downBuffer[idx] + downBuffer[(downIdx + 2 * i) % 7]);
		}
		downIdx = (downIdx + 1) % 7;
		return sum * 0.5f;
	}

	std::array<float, 7> upBuffer;
	std::array<float, 7> downBuffer;
	int upIdx = 0;
	int downIdx = 0;
};

} // namespace wasm_audio
