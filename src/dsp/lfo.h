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

// Beats per tempo-synced LFO cycle, by DIV index (labels are bar fractions,
// 1B = 4 beats; the tail is the appended dotted/triplet set — the list is
// APPEND-ONLY, stored DIV values are indices). Mirrors core/divisions.ts by
// hand — keep the two lists (and the JS processors' DIV_BEATS) in step.
inline constexpr double kDivBeats[] = {16.0, 8.0, 4.0, 2.0, 1.0, 0.5, 0.25, 0.125,
                                       3.0, 1.5, 2.0 / 3.0, 0.75, 1.0 / 3.0, 1.0 / 6.0};
inline constexpr int kNumDivisions = 14;

// Dedicated LFO kernel wrapping Oscillator::Kernel.
// Free-running (nextSample) or tempo-synced (nextSampleAt), bipolar -1..+1.
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

	// Tempo-synced sample: phase01 is an ABSOLUTE readout of the master clock
	// (beats since the shared anchor / cycle length, fractional part) — never
	// an accumulator, so every synced LFO in the app shares the downbeat and
	// tempo changes stay phase-continuous. frequency is the cycle rate in Hz
	// and still shapes the polyBLEP width. The cycle wrap (NOISE's
	// sample-and-hold latch) is detected from the forced-phase sequence; the
	// oscillator's own wrap flag tracks a phase this path overrides.
	float nextSampleAt(float phase01, float frequency) {
		bool cycleWrapped = phase01 < prevSyncPhase01;
		prevSyncPhase01 = phase01;
		osc.setPhase(phase01 * Constants::twoPi);
		float sample = osc.nextSample(frequency);
		if (mode == Oscillator::Mode::NOISE) {
			if (cycleWrapped) held = sample;
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

	// Phase-drift support (poly-ticks): restart at a given phase, and expose
	// the oscillator's RNG so drift can randomise the start point.
	void reset(float startPhase) {
		osc.reset(startPhase);
	}

	float randomPhase() {
		return osc.randomPhase();
	}

	private:
	Oscillator::Kernel osc;
	Oscillator::Mode mode = Oscillator::Mode::SINE;
	float held = 0.f;
	float prevSyncPhase01 = 0.f;
};

} // namespace wasm_audio
