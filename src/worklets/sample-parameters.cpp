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

#include "oscillator.cpp"
#include "range.cpp"

struct SampleParameters {
	public:
	// A-rate parameter buffers (per-sample interpolation)
	float *frequencyValues;
	float *osc2AmplitudeValues;
	float *noiseLevelValues;
	float *cutoffValues;
	float *resonanceValues;
	float *driveValues;
	float *lfo1FrequencyValues;
	float *lfo1ModAmountValues;
	float *lfo2FrequencyValues;
	float *lfo2ModAmountValues;

	public:
	// Working values (set per-sample for a-rate, once per quantum for k-rate)
	float frequency;
	float velocity;
	float osc1SemiShift;
	float osc1CentShift;
	float osc1Cycle;
	float osc2SemiShift;
	float osc2CentShift;
	float osc2Cycle;
	float osc2Amplitude;
	float osc1Amplitude;
	float noiseLevel;
	float amplitudeEnvelopeAttack;
	float amplitudeEnvelopeDecay;
	float amplitudeEnvelopeSustain;
	float amplitudeEnvelopeRelease;
	float cutoff;
	float resonance;
	float cutoffEnvelopeAmount;
	float cutoffEnvelopeVelocity;
	float cutoffEnvelopeAttack;
	float cutoffEnvelopeDecay;
	float lfo1Frequency;
	float lfo1ModAmount;
	float lfo2Frequency;
	float lfo2ModAmount;
	float overdrive = 0.f;

	// Base values for k-rate params modified by per-sample modulations
	float osc1CycleBase;
	float osc2CycleBase;

	public:
	SampleParameters &withFrequencyValues(float *newFrequencyValues) {
		frequencyValues = newFrequencyValues;
		return *this;
	}

	public:
	void fetchValues(unsigned int sample) {
		// A-rate params: read per-sample from pointer arrays
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

		// Restore k-rate base values that may have been modified by modulations
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

	private:
	float getCurrentValue(float *valuesPtr, unsigned int i, Range sourceRange, Range targetRange) {
		auto value = getCurrentValue(valuesPtr, i);
		return targetRange.map(value, sourceRange);
	}
};