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
#include "range.h"

namespace wasm_audio {

struct SampleParameters {
	float *frequencyValues = nullptr;
	float *osc2AmplitudeValues = nullptr;
	float *noiseLevelValues = nullptr;
	float *cutoffValues = nullptr;
	float *resonanceValues = nullptr;
	float *driveValues = nullptr;
	float *lfo1FrequencyValues = nullptr;
	float *lfo1ModAmountValues = nullptr;
	float *lfo2FrequencyValues = nullptr;
	float *lfo2ModAmountValues = nullptr;

	float frequency = 0.f;
	float velocity = 0.f;
	float osc1SemiShift = 0.f;
	float osc1CentShift = 0.f;
	float osc1Cycle = 0.5f;
	float osc2SemiShift = 0.f;
	float osc2CentShift = 0.f;
	float osc2Cycle = 0.5f;
	float osc2Amplitude = 0.f;
	float osc1Amplitude = 1.f;
	float noiseLevel = 0.f;
	float amplitudeEnvelopeAttack = 0.f;
	float amplitudeEnvelopeDecay = 0.f;
	float amplitudeEnvelopeSustain = 0.f;
	float amplitudeEnvelopeRelease = 0.f;
	float cutoff = 0.f;
	float resonance = 0.f;
	float cutoffEnvelopeAmount = 0.f;
	float cutoffEnvelopeVelocity = 0.f;
	float cutoffEnvelopeAttack = 0.f;
	float cutoffEnvelopeDecay = 0.f;
	float lfo1Frequency = 0.f;
	float lfo1ModAmount = 0.f;
	float lfo2Frequency = 0.f;
	float lfo2ModAmount = 0.f;
	float overdrive = 0.f;

	float osc1CycleBase = 0.5f;
	float osc2CycleBase = 0.5f;

	SampleParameters &withFrequencyValues(float *newFrequencyValues) {
		frequencyValues = newFrequencyValues;
		return *this;
	}

	void fetchValues(unsigned int sample) {
		frequency = getCurrentValue(frequencyValues, sample);
		osc2Amplitude = getCurrentValue(osc2AmplitudeValues, sample, midiRange, zeroOneRange);
		noiseLevel = getCurrentValue(noiseLevelValues, sample, midiRange, zeroOneRange);
		cutoff = getCurrentValue(cutoffValues, sample, midiRange, cutoffRange);
		resonance = getCurrentValue(resonanceValues, sample, midiRange, resonanceRange);
		overdrive = getCurrentValue(driveValues, sample, midiRange, driveRange);
		lfo1Frequency = getCurrentValue(lfo1FrequencyValues, sample, midiRange, lfoFrequencyRange);
		lfo1ModAmount = getCurrentValue(lfo1ModAmountValues, sample, midiRange, zeroOneRange);
		lfo2Frequency = getCurrentValue(lfo2FrequencyValues, sample, midiRange, lfoFrequencyRange);
		lfo2ModAmount = getCurrentValue(lfo2ModAmountValues, sample, midiRange, zeroOneRange);

		osc1Cycle = osc1CycleBase;
		osc2Cycle = osc2CycleBase;

		osc1Amplitude = 1.f - osc2Amplitude;
	}

	private:
	float getCurrentValue(float *valuesPtr, unsigned int i) {
		if (valuesPtr == nullptr) {
			return 0.f;
		}
		return valuesPtr[i];
	}

	float getCurrentValue(float *valuesPtr, unsigned int i, Range sourceRange, Range targetRange) {
		auto value = getCurrentValue(valuesPtr, i);
		return targetRange.map(value, sourceRange);
	}
};

} // namespace wasm_audio
