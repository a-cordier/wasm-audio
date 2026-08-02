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

// Shared 7-tap half-band FIR, scaled for unity DC gain:
//   h = {-0.0625, 0, 0.5625, 1, 0.5625, 0, -0.0625} / 2
// Taps 1 and 5 are zero and are never evaluated.
namespace HalfBand {
	constexpr float outer = -0.03125f;
	constexpr float inner = 0.28125f;
	constexpr float centre = 0.5f;
	constexpr int LENGTH = 7;
} // namespace HalfBand

// Decimator for a signal already generated at 2x the target rate.
// Feed it the two 2x-rate samples belonging to one output frame; it filters
// away everything above the target Nyquist and returns a single sample.
class HalfBandDecimator {
	public:
	HalfBandDecimator() {
		history.fill(0.0f);
	}

	float decimate(float first, float second) {
		push(first);
		push(second);
		// history[0] is the most recent 2x sample.
		return HalfBand::outer * (history[0] + history[6])
		     + HalfBand::inner * (history[2] + history[4])
		     + HalfBand::centre * history[3];
	}

	void reset() {
		history.fill(0.0f);
	}

	private:
	void push(float sample) {
		for (int i = HalfBand::LENGTH - 1; i > 0; --i) {
			history[i] = history[i - 1];
		}
		history[0] = sample;
	}

	std::array<float, HalfBand::LENGTH> history;
};

// 2x oversampling wrapper for a processing callback that transforms an input
// sample. The callback runs twice per input sample at 2x rate.
// Typical use: oversample a saturating filter stage to reduce aliasing.
//
// For sources that synthesise directly at 2x (oscillators doing ring
// modulation, hard sync or phase modulation) use HalfBandDecimator directly —
// there is nothing to interpolate.
class Oversampler2x {
	public:
	Oversampler2x() {
		upHistory.fill(0.0f);
	}

	template<typename ProcessFn>
	float process(float input, ProcessFn fn) {
		// Half-band interpolation by 2, in polyphase form. The odd phase of a
		// half-band kernel is a pure delay, so only the even phase needs taps.
		pushUp(input);
		float even = 2.0f * (HalfBand::outer * (upHistory[0] + upHistory[3])
		                   + HalfBand::inner * (upHistory[1] + upHistory[2]));
		float odd = upHistory[1];

		float out0 = fn(even);
		float out1 = fn(odd);

		return decimator.decimate(out0, out1);
	}

	void reset() {
		upHistory.fill(0.0f);
		decimator.reset();
	}

	private:
	void pushUp(float sample) {
		for (int i = 3; i > 0; --i) {
			upHistory[i] = upHistory[i - 1];
		}
		upHistory[0] = sample;
	}

	std::array<float, 4> upHistory;
	HalfBandDecimator decimator;
};

} // namespace wasm_audio
