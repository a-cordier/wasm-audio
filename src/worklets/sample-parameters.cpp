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
	float *frequencyValues;
	float *osc1SemiShiftValues;
	float *osc1CentShiftValues;
	float *osc1CycleValues;
	float *osc2AmplitudeValues;
	float *osc2SemiShiftValues;
	float *osc2CentShiftValues;
	float *osc2CycleValues;
	float *noiseLevelValues;
	float *amplitudeEnvelopeAttackValues;
	float *amplitudeEnvelopeDecayValues;
	float *amplitudeEnvelopeSustainValues;
	float *amplitudeEnvelopeReleaseValues;
	float *cutoffValues;
	float *resonanceValues;
	float *driveValues;
	float *cutoffEnvelopeAmountValues;
	float *cutoffEnvelopeVelocityValues;
	float *cutoffEnvelopeAttackValues;
	float *cutoffEnvelopeDecayValues;
	float *lfo1FrequencyValues;
	float *lfo1ModAmountValues;
	float *lfo2FrequencyValues;
	float *lfo2ModAmountValues;

	public:
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

	public:
	SampleParameters &withFrequencyValues(float *newFrequencyValues) {
		frequencyValues = newFrequencyValues;
		return *this;
	}

	public:
	void fetchValues(unsigned int sample) {
		frequency = getCurrentValue(frequencyValues, sample);
		osc1SemiShift = getCurrentValue(osc1SemiShiftValues, sample, midiRange, semiShiftRange);
		osc1CentShift = getCurrentValue(osc1CentShiftValues, sample, midiRange, centShiftRange);
		osc1Cycle = getCurrentValue(osc1CycleValues, sample, midiRange, zeroOneRange);
		osc2SemiShift = getCurrentValue(osc2SemiShiftValues, sample, midiRange, semiShiftRange);
		osc2CentShift = getCurrentValue(osc2CentShiftValues, sample, midiRange, centShiftRange);
		osc2Cycle = getCurrentValue(osc2CycleValues, sample, midiRange, zeroOneRange);
		osc2Amplitude = getCurrentValue(osc2AmplitudeValues, sample, midiRange, zeroOneRange);
		noiseLevel = getCurrentValue(noiseLevelValues, sample, midiRange, zeroOneRange);
		amplitudeEnvelopeAttack = getCurrentValue(amplitudeEnvelopeAttackValues, sample, midiRange, attackRange);
		amplitudeEnvelopeDecay = getCurrentValue(amplitudeEnvelopeDecayValues, sample, midiRange, decayRange);
		amplitudeEnvelopeSustain = getCurrentValue(amplitudeEnvelopeSustainValues, sample, midiRange, zeroOneRange);
		amplitudeEnvelopeRelease = getCurrentValue(amplitudeEnvelopeReleaseValues, sample, midiRange, releaseRange);
		cutoff = getCurrentValue(cutoffValues, sample, midiRange, cutoffRange);
		resonance = getCurrentValue(resonanceValues, sample, midiRange, resonanceRange);
		overdrive = getCurrentValue(driveValues, sample, midiRange, driveRange),
		cutoffEnvelopeAmount = getCurrentValue(cutoffEnvelopeAmountValues, sample, midiRange, zeroOneRange);
		cutoffEnvelopeVelocity = getCurrentValue(cutoffEnvelopeVelocityValues, sample, midiRange, zeroOneRange);
		cutoffEnvelopeAttack = getCurrentValue(cutoffEnvelopeAttackValues, sample, midiRange, attackRange);
		cutoffEnvelopeDecay = getCurrentValue(cutoffEnvelopeDecayValues, sample, midiRange, decayRange);
		lfo1Frequency = getCurrentValue(lfo1FrequencyValues, sample, midiRange, lfoFrequencyRange);
		lfo1ModAmount = getCurrentValue(lfo1ModAmountValues, sample, midiRange, zeroOneRange);
		lfo2Frequency = getCurrentValue(lfo2FrequencyValues, sample, midiRange, lfoFrequencyRange);
		lfo2ModAmount = getCurrentValue(lfo2ModAmountValues, sample, midiRange, zeroOneRange);
		osc1Amplitude = 1.f - osc2Amplitude;
	}

	private:
	float getCurrentValue(float *valuesPtr, unsigned int i) {
		if (valuesPtr == nullptr) {
			return 0.f;
		}
		return hasConstantValue(valuesPtr) ? valuesPtr[0] : valuesPtr[i];
	}

	private:
	float getCurrentValue(float *valuesPtr, unsigned int i, Range sourceRange, Range targetRange) {
		auto value = getCurrentValue(valuesPtr, i);
		return targetRange.map(value, sourceRange);
	}

	private:
	bool hasConstantValue(float *valuesPtr) {
		return sizeof(valuesPtr) == sizeof(valuesPtr[0]);
	}
};