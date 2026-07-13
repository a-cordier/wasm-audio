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

#include "constants.h"

namespace wasm_audio {

// One-pole DC blocking filter.
// y[n] = x[n] - x[n-1] + R * y[n-1]
// R controls the cutoff: R = 1 - (2*pi*cutoffHz / sampleRate)
// Default cutoff ~5Hz removes DC offset from asymmetric waveforms,
// filter feedback, and waveshaping without affecting audible content.
class DCBlocker {
	public:
	DCBlocker(float sampleRate, float cutoffHz = 5.0f) {
		R = 1.0f - (Constants::twoPi * cutoffHz / sampleRate);
	}

	float process(float input) {
		float output = input - prevInput + R * prevOutput;
		prevInput = input;
		prevOutput = output;
		return output;
	}

	void reset() {
		prevInput = 0.0f;
		prevOutput = 0.0f;
	}

	private:
	float R;
	float prevInput = 0.0f;
	float prevOutput = 0.0f;
};

} // namespace wasm_audio
