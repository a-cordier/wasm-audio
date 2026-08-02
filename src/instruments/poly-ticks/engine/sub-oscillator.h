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

class SubOsc {
	public:
	SubOsc(float sampleRate) :
		osc1(Oscillator::Kernel{ sampleRate }),
		osc2(Oscillator::Kernel{ sampleRate }) {}

	float nextSample(float frequency) {
		float osc1Sample = osc1.nextSample(frequency / 2) * (1.f - osc2Amplitude);
		float osc2Sample = osc2.nextSample(frequency / 2) * osc2Amplitude;
		return osc1Sample + osc2Sample;
	}

	void setOsc1Mode(Oscillator::Mode newMode) {
		osc1.setMode(newMode);
	}

	void setOsc1SemiShift(float newSemiShift) {
		osc1.setSemiShift(newSemiShift);
	}

	void setOsc1CentShift(float newCentShift) {
		osc1.setCentShift(newCentShift);
	}

	void setOsc1Cycle(float newCycle) {
		osc1.setDutyCycle(newCycle);
	}

	void setOsc2Mode(Oscillator::Mode newMode) {
		osc2.setMode(newMode);
	}

	void setOsc2SemiShift(float newSemiShift) {
		osc2.setSemiShift(newSemiShift);
	}

	void setOsc2CentShift(float newCentShift) {
		osc2.setCentShift(newCentShift);
	}

	void setOsc2Cycle(float newCycle) {
		osc2.setDutyCycle(newCycle);
	}

	void setOsc2Amplitude(float newOsc2Amplitude) {
		osc2Amplitude = newOsc2Amplitude;
	}

	void reset() {
		reset(0.f);
	}

	// drift scales how far each oscillator's start phase is randomised:
	// 0 restarts both at zero, 1 spreads them over the full cycle.
	void reset(float drift) {
		osc1.reset(drift * osc1.randomPhase());
		osc2.reset(drift * osc2.randomPhase());
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;
	float osc2Amplitude = 0.f;
};

} // namespace wasm_audio
