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

#include "oscillator.h"

namespace wasm_audio {

// Dedicated LFO kernel wrapping Oscillator::Kernel.
// Free-running, bipolar output (-1..+1) scaled by amount.
// Ready for future tempo-sync support.
class LFOKernel {
	public:
	LFOKernel(float sampleRate) :
		osc(sampleRate) {
		osc.setAmplitude(1.0f);
	}

	float nextSample(float frequency) {
		float sample = osc.nextSample(frequency);
		// NOISE as an LFO is sample-and-hold at the LFO rate: latching on the
		// phase wrap gives one random level per cycle. Raw per-sample noise on
		// a modulation target is broadband noise on a coefficient, not an LFO.
		if (mode == Oscillator::Mode::NOISE) {
			if (osc.didWrap()) held = sample;
			return held;
		}
		return sample;
	}

	void setMode(Oscillator::Mode newMode) {
		mode = newMode;
		osc.setMode(newMode);
	}

	void reset() {
		osc.reset();
	}

	private:
	Oscillator::Kernel osc;
	Oscillator::Mode mode = Oscillator::Mode::SINE;
	float held = 0.f;
};

} // namespace wasm_audio
