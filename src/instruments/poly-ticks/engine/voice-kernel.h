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
#include "dc-blocker.h"
#include "envelope.h"
#include "filter.h"
#include "oscillator.h"
#include "range.h"
#include "sample-parameters.h"
#include "sub-oscillator.h"
#include "waveshaper.h"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <memory>

namespace wasm_audio {
namespace Voice {

	enum class State {
		DISPOSED,
		STARTED,
		STOPPING,
		STOPPED
	};

	enum class LfoDestination {
		FREQUENCY = 0,
		OSCILLATOR_MIX = 1,
		CUTOFF = 2,
		RESONANCE = 3,
		OSC1_CYCLE = 4,
		OSC2_CYCLE = 5,
	};

	struct ParameterBlock {
		float velocity;
		uint32_t osc1Mode;
		uint32_t osc2Mode;
		uint32_t filterMode;
		uint32_t lfo1Mode;
		uint32_t lfo1Destination;
		uint32_t lfo2Mode;
		uint32_t lfo2Destination;
		uintptr_t frequencyPtr;
		float amplitudeAttack;
		float amplitudeDecay;
		float amplitudeSustain;
		float amplitudeRelease;
		float osc1SemiShift;
		float osc1CentShift;
		float osc1Cycle;
		float osc2SemiShift;
		float osc2CentShift;
		float osc2Cycle;
		uintptr_t osc2AmplitudePtr;
		uintptr_t noiseLevelPtr;
		uintptr_t cutoffPtr;
		uintptr_t resonancePtr;
		uintptr_t drivePtr;
		float cutoffEnvelopeAmount;
		float cutoffEnvelopeVelocity;
		float cutoffEnvelopeAttack;
		float cutoffEnvelopeDecay;
		uintptr_t lfo1FrequencyPtr;
		uintptr_t lfo1ModAmountPtr;
		uintptr_t lfo2FrequencyPtr;
		uintptr_t lfo2ModAmountPtr;
	};

	class Kernel {
		public:
		Kernel(float sampleRate, float renderFrames) :
			sampleRate(sampleRate),
			renderFrames(renderFrames),
			osc1(Oscillator::Kernel{ sampleRate }),
			osc2(Oscillator::Kernel{ sampleRate }),
			lfo1(Oscillator::Kernel{ sampleRate }),
			lfo2(Oscillator::Kernel{ sampleRate }),
			filter(std::make_unique<Filter::SVFKernel>(sampleRate)),
			subOsc(sampleRate),
			dcBlocker(sampleRate),
			amplitudeEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.5f, 0.5f, 0.9f }),
			cutoffEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.01f, 2.f, 0.f }),
			state(State::DISPOSED) {
		}

		void process(uintptr_t outputPtr, unsigned channelCount) {
			float *outputBuffer = reinterpret_cast<float *>(outputPtr);
			float *firstChannel = outputBuffer;

			for (unsigned sample = 0; sample < renderFrames; ++sample) {
				startIfNecessary();
				assignParameters(sample);
				firstChannel[sample] = computeSample();
				stopIfNecessary();
			}
			for (unsigned channel = 1; channel < channelCount; ++channel) {
				float *channelBuffer = outputBuffer + channel * renderFrames;
				std::copy(firstChannel, firstChannel + renderFrames, channelBuffer);
			}
		}

		void setVelocity(float velocityValue) {
			velocity = zeroOneRange.map(velocityValue, midiRange);
		}

		void setParameters(uintptr_t blockPtr) {
			const ParameterBlock *block = reinterpret_cast<const ParameterBlock *>(blockPtr);

			velocity = zeroOneRange.map(block->velocity, midiRange);

			osc1.setMode(static_cast<Oscillator::Mode>(block->osc1Mode));
			subOsc.setOsc1Mode(static_cast<Oscillator::Mode>(block->osc1Mode));
			osc2.setMode(static_cast<Oscillator::Mode>(block->osc2Mode));
			subOsc.setOsc2Mode(static_cast<Oscillator::Mode>(block->osc2Mode));
			filter->setMode(static_cast<Filter::Mode>(block->filterMode));
			lfo1.setMode(static_cast<Oscillator::Mode>(block->lfo1Mode));
			lfo1Destination = static_cast<LfoDestination>(block->lfo1Destination);
			lfo2.setMode(static_cast<Oscillator::Mode>(block->lfo2Mode));
			lfo2Destination = static_cast<LfoDestination>(block->lfo2Destination);

			sampleParameters.frequencyValues = reinterpret_cast<float *>(block->frequencyPtr);
			sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(block->osc2AmplitudePtr);
			sampleParameters.noiseLevelValues = reinterpret_cast<float *>(block->noiseLevelPtr);
			sampleParameters.cutoffValues = reinterpret_cast<float *>(block->cutoffPtr);
			sampleParameters.resonanceValues = reinterpret_cast<float *>(block->resonancePtr);
			sampleParameters.driveValues = reinterpret_cast<float *>(block->drivePtr);
			sampleParameters.lfo1FrequencyValues = reinterpret_cast<float *>(block->lfo1FrequencyPtr);
			sampleParameters.lfo1ModAmountValues = reinterpret_cast<float *>(block->lfo1ModAmountPtr);
			sampleParameters.lfo2FrequencyValues = reinterpret_cast<float *>(block->lfo2FrequencyPtr);
			sampleParameters.lfo2ModAmountValues = reinterpret_cast<float *>(block->lfo2ModAmountPtr);

			sampleParameters.amplitudeEnvelopeAttack = attackRange.map(block->amplitudeAttack, midiRange);
			sampleParameters.amplitudeEnvelopeDecay = decayRange.map(block->amplitudeDecay, midiRange);
			sampleParameters.amplitudeEnvelopeSustain = zeroOneRange.map(block->amplitudeSustain, midiRange);
			sampleParameters.amplitudeEnvelopeRelease = releaseRange.map(block->amplitudeRelease, midiRange);
			sampleParameters.osc1SemiShift = semiShiftRange.map(block->osc1SemiShift, midiRange);
			sampleParameters.osc1CentShift = centShiftRange.map(block->osc1CentShift, midiRange);
			sampleParameters.osc1CycleBase = zeroOneRange.map(block->osc1Cycle, midiRange);
			sampleParameters.osc1Cycle = sampleParameters.osc1CycleBase;
			sampleParameters.osc2SemiShift = semiShiftRange.map(block->osc2SemiShift, midiRange);
			sampleParameters.osc2CentShift = centShiftRange.map(block->osc2CentShift, midiRange);
			sampleParameters.osc2CycleBase = zeroOneRange.map(block->osc2Cycle, midiRange);
			sampleParameters.osc2Cycle = sampleParameters.osc2CycleBase;
			sampleParameters.cutoffEnvelopeAmount = zeroOneRange.map(block->cutoffEnvelopeAmount, midiRange);
			sampleParameters.cutoffEnvelopeVelocity = zeroOneRange.map(block->cutoffEnvelopeVelocity, midiRange);
			sampleParameters.cutoffEnvelopeAttack = attackRange.map(block->cutoffEnvelopeAttack, midiRange);
			sampleParameters.cutoffEnvelopeDecay = decayRange.map(block->cutoffEnvelopeDecay, midiRange);
		}

		void setOsc1Mode(Oscillator::Mode newMode) {
			osc1.setMode(newMode);
			subOsc.setOsc1Mode(newMode);
		}

		void setOsc1SemiShift(float value) {
			sampleParameters.osc1SemiShift = semiShiftRange.map(value, midiRange);
		}

		void setOsc1CentShift(float value) {
			sampleParameters.osc1CentShift = centShiftRange.map(value, midiRange);
		}

		void setOsc1Cycle(float value) {
			sampleParameters.osc1CycleBase = zeroOneRange.map(value, midiRange);
			sampleParameters.osc1Cycle = sampleParameters.osc1CycleBase;
		}

		void setOsc2Mode(Oscillator::Mode newMode) {
			osc2.setMode(newMode);
			subOsc.setOsc2Mode(newMode);
		}

		void setOsc2SemiShift(float value) {
			sampleParameters.osc2SemiShift = semiShiftRange.map(value, midiRange);
		}

		void setOsc2CentShift(float value) {
			sampleParameters.osc2CentShift = centShiftRange.map(value, midiRange);
		}

		void setOsc2Cycle(float value) {
			sampleParameters.osc2CycleBase = zeroOneRange.map(value, midiRange);
			sampleParameters.osc2Cycle = sampleParameters.osc2CycleBase;
		}

		void setOsc2Amplitude(uintptr_t osc2AmplitudeValuesPtr) {
			sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(osc2AmplitudeValuesPtr);
		}

		void setNoiseLevel(uintptr_t newLevelValuesPtr) {
			sampleParameters.noiseLevelValues = reinterpret_cast<float *>(newLevelValuesPtr);
		}

		void enterReleaseStage() {
			state = State::STOPPING;
			amplitudeEnvelope.enterReleaseStage();
		}

		void setAmplitudeAttack(float value) {
			sampleParameters.amplitudeEnvelopeAttack = attackRange.map(value, midiRange);
		}

		void setAmplitudeDecay(float value) {
			sampleParameters.amplitudeEnvelopeDecay = decayRange.map(value, midiRange);
		}

		void setAmplitudeSustain(float value) {
			sampleParameters.amplitudeEnvelopeSustain = zeroOneRange.map(value, midiRange);
		}

		void setAmplitudeRelease(float value) {
			sampleParameters.amplitudeEnvelopeRelease = releaseRange.map(value, midiRange);
		}

		void setFilterMode(Filter::Mode newFilterMode) {
			filter->setMode(newFilterMode);
		}

		void setCutoff(uintptr_t newCutoffValuesPtr) {
			sampleParameters.cutoffValues = reinterpret_cast<float *>(newCutoffValuesPtr);
		}

		void setResonance(uintptr_t newResonanceValuesPtr) {
			sampleParameters.resonanceValues = reinterpret_cast<float *>(newResonanceValuesPtr);
		}

		void setDrive(uintptr_t newDriveValuesPtr) {
			sampleParameters.driveValues = reinterpret_cast<float *>(newDriveValuesPtr);
		}

		void setCutoffEnvelopeAmount(float value) {
			sampleParameters.cutoffEnvelopeAmount = zeroOneRange.map(value, midiRange);
		}

		void setCutoffEnvelopeVelocity(float value) {
			sampleParameters.cutoffEnvelopeVelocity = zeroOneRange.map(value, midiRange);
		}

		void setCutoffEnvelopeAttack(float value) {
			sampleParameters.cutoffEnvelopeAttack = attackRange.map(value, midiRange);
		}

		void setCutoffEnvelopeDecay(float value) {
			sampleParameters.cutoffEnvelopeDecay = decayRange.map(value, midiRange);
		}

		void setLfo1Mode(Oscillator::Mode newMode) {
			lfo1.setMode(newMode);
		}

		void setLfo1ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo1ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		void setLfo1Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo1FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		void setLfo1Destination(LfoDestination newLfoDestination) {
			lfo1Destination = newLfoDestination;
		}

		void setLfo2Mode(Oscillator::Mode newMode) {
			lfo2.setMode(newMode);
		}

		void setLfo2ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo2ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		void setLfo2Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo2FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		void setLfo2Destination(LfoDestination newLfoDestination) {
			lfo2Destination = newLfoDestination;
		}

		bool isStopped() {
			return state == State::STOPPED;
		}

		void reset() {
			osc1.reset();
			osc2.reset();
			lfo1.reset();
			lfo2.reset();
			filter->reset();
			dcBlocker.reset();
			amplitudeEnvelope.reset();
			cutoffEnvelope.reset();
			state = State::DISPOSED;
		}

		private:
		void assignParameters(unsigned int sampleCursor) {
			sampleParameters.fetchValues(sampleCursor);
			applyModulations();
			osc1.setSemiShift(sampleParameters.osc1SemiShift);
			subOsc.setOsc1SemiShift(sampleParameters.osc1SemiShift);
			osc1.setCentShift(sampleParameters.osc1CentShift);
			subOsc.setOsc1CentShift(sampleParameters.osc1CentShift);
			osc1.setDutyCycle(sampleParameters.osc1Cycle);
			subOsc.setOsc1Cycle(sampleParameters.osc1Cycle);
			osc2.setSemiShift(sampleParameters.osc2SemiShift);
			subOsc.setOsc2SemiShift(sampleParameters.osc2SemiShift);
			osc2.setCentShift(sampleParameters.osc2CentShift);
			subOsc.setOsc2CentShift(sampleParameters.osc2CentShift);
			osc2.setDutyCycle(sampleParameters.osc2Cycle);
			subOsc.setOsc2Cycle(sampleParameters.osc2Cycle);
			amplitudeEnvelope.setAttackTime(sampleParameters.amplitudeEnvelopeAttack);
			amplitudeEnvelope.setDecayTime(sampleParameters.amplitudeEnvelopeDecay);
			amplitudeEnvelope.setSustainLevel(sampleParameters.amplitudeEnvelopeSustain);
			amplitudeEnvelope.setReleaseTime(sampleParameters.amplitudeEnvelopeRelease);
			cutoffEnvelope.setAttackTime(sampleParameters.cutoffEnvelopeAttack);
			cutoffEnvelope.setDecayTime(sampleParameters.cutoffEnvelopeDecay);
		}

		float computeSample() {
			float sample = computeRawSample();
			float filtered = filter->nextSample(sample, sampleParameters.cutoff, sampleParameters.resonance);
			float shaped = Waveshaper::softClip(filtered, sampleParameters.overdrive);
			float clean = dcBlocker.process(shaped);
			return clean * velocity * amplitudeEnvelope.nextLevel();
		}

		float computeRawSample() {
			float osc1Sample = osc1.nextSample(sampleParameters.frequency) * sampleParameters.osc1Amplitude;
			float osc2Sample = osc2.nextSample(sampleParameters.frequency) * sampleParameters.osc2Amplitude;
			float noiseSample = noise.nextSample() * sampleParameters.noiseLevel;
			subOsc.setOsc2Amplitude(sampleParameters.osc2Amplitude);
			float subOscSample = subOsc.nextSample(sampleParameters.frequency) * PolyTicksConstants::subOscPresence;
			return (1 - PolyTicksConstants::subOscPresence) * (osc1Sample + osc2Sample) + subOscSample + noiseSample;
		}

		void applyModulations() {
			float lfo1Mod = sampleParameters.lfo1ModAmount * lfo1.nextSample(sampleParameters.lfo1Frequency);
			float lfo2Mod = sampleParameters.lfo2ModAmount * lfo2.nextSample(sampleParameters.lfo2Frequency);
			float cutoffMod = sampleParameters.cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();
			cutoffMod += velocity * sampleParameters.cutoffEnvelopeVelocity;
			applyLFO(lfo1Destination, lfo1Mod);
			applyLFO(lfo2Destination, lfo2Mod);
			sampleParameters.cutoff = cutoffRange.clamp(sampleParameters.cutoff + cutoffMod);
		}

		void applyLFO(LfoDestination destination, float mod) {
			switch (destination) {
				case LfoDestination::FREQUENCY:
					sampleParameters.frequency += mod * sampleParameters.frequency;
					break;
				case LfoDestination::CUTOFF:
					sampleParameters.cutoff = cutoffRange.clamp(sampleParameters.cutoff + mod);
					break;
				case LfoDestination::RESONANCE:
					sampleParameters.resonance = resonanceRange.clamp(sampleParameters.resonance + mod);
					break;
				case LfoDestination::OSCILLATOR_MIX:
					sampleParameters.osc2Amplitude = zeroOneRange.clamp(sampleParameters.osc2Amplitude + mod);
					break;
				case LfoDestination::OSC1_CYCLE:
					sampleParameters.osc1Cycle = oscCycleRange.clamp(sampleParameters.osc1Cycle + mod);
					break;
				case LfoDestination::OSC2_CYCLE:
					sampleParameters.osc2Cycle = oscCycleRange.clamp(sampleParameters.osc2Cycle + mod);
					break;
			}
		}

		void startIfNecessary() {
			if (state == State::DISPOSED) {
				amplitudeEnvelope.enterAttackStage();
				cutoffEnvelope.enterAttackStage();
				state = State::STARTED;
			}
		}

		void stopIfNecessary() {
			if (state == State::STOPPING && amplitudeEnvelope.isDone()) {
				state = State::STOPPED;
			}
		}

		Oscillator::Kernel osc1;
		Oscillator::Kernel osc2;
		Oscillator::NoiseKernel noise;
		SubOsc subOsc;

		Oscillator::Kernel lfo1;
		LfoDestination lfo1Destination = LfoDestination::FREQUENCY;

		Oscillator::Kernel lfo2;
		LfoDestination lfo2Destination = LfoDestination::FREQUENCY;

		Envelope::Kernel amplitudeEnvelope;

		std::unique_ptr<Filter::Kernel> filter;
		DCBlocker dcBlocker;

		Envelope::Kernel cutoffEnvelope;

		State state;

		SampleParameters sampleParameters;

		float sampleRate;
		unsigned renderFrames;
		float velocity = 1.f;
	};

} // namespace Voice
} // namespace wasm_audio
