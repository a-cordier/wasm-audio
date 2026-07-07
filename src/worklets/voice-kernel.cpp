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
#include "constants.cpp"
#include "envelope.cpp"
#include "filter.cpp"
#include "oscillator.cpp"
#include "range.cpp"
#include "sample-parameters.cpp"
#include "sub-oscillator.cpp"
#include <algorithm>
#include <bitset>
#include <cmath>
#include <cstdint>
#include <memory>

#include "emscripten/bind.h"

namespace Voice {
	using namespace emscripten;

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
			noise(Oscillator::Kernel{ sampleRate }),
			lfo1(Oscillator::Kernel{ sampleRate }),
			lfo2(Oscillator::Kernel{ sampleRate }),
			filter(std::make_unique<Filter::ResonantKernel>()),
			subOsc(sampleRate),
			amplitudeEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.5f, 0.5f, 0.9f }),
			cutoffEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.01f, 2.f, 0.f }),
			state(State::DISPOSED) {
			noise.setMode(Oscillator::Mode::NOISE);
		}

		public:
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

		public:
		void setVelocity(float velocityValue) {
			velocity = zeroOneRange.map(velocityValue, midiRange);
		}

		public:
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

			// A-rate params: store pointers for per-sample reading
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

			// K-rate params: map from MIDI range once per quantum
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

		public:
		void setOsc1Mode(Oscillator::Mode newMode) {
			osc1.setMode(newMode);
			subOsc.setOsc1Mode(newMode);
		}

		public:
		void setOsc1SemiShift(float value) {
			sampleParameters.osc1SemiShift = semiShiftRange.map(value, midiRange);
		}

		public:
		void setOsc1CentShift(float value) {
			sampleParameters.osc1CentShift = centShiftRange.map(value, midiRange);
		}

		public:
		void setOsc1Cycle(float value) {
			sampleParameters.osc1CycleBase = zeroOneRange.map(value, midiRange);
			sampleParameters.osc1Cycle = sampleParameters.osc1CycleBase;
		}

		public:
		void setOsc2Mode(Oscillator::Mode newMode) {
			osc2.setMode(newMode);
			subOsc.setOsc2Mode(newMode);
		}

		public:
		void setOsc2SemiShift(float value) {
			sampleParameters.osc2SemiShift = semiShiftRange.map(value, midiRange);
		}

		public:
		void setOsc2CentShift(float value) {
			sampleParameters.osc2CentShift = centShiftRange.map(value, midiRange);
		}

		public:
		void setOsc2Cycle(float value) {
			sampleParameters.osc2CycleBase = zeroOneRange.map(value, midiRange);
			sampleParameters.osc2Cycle = sampleParameters.osc2CycleBase;
		}

		public:
		void setOsc2Amplitude(uintptr_t osc2AmplitudeValuesPtr) {
			sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(osc2AmplitudeValuesPtr);
		}

		public:
		void setNoiseLevel(uintptr_t newLevelValuesPtr) {
			sampleParameters.noiseLevelValues = reinterpret_cast<float *>(newLevelValuesPtr);
		}

		public:
		void enterReleaseStage() {
			state = State::STOPPING;
			amplitudeEnvelope.enterReleaseStage();
		}

		public:
		void setAmplitudeAttack(float value) {
			sampleParameters.amplitudeEnvelopeAttack = attackRange.map(value, midiRange);
		}

		public:
		void setAmplitudeDecay(float value) {
			sampleParameters.amplitudeEnvelopeDecay = decayRange.map(value, midiRange);
		}

		public:
		void setAmplitudeSustain(float value) {
			sampleParameters.amplitudeEnvelopeSustain = zeroOneRange.map(value, midiRange);
		}

		public:
		void setAmplitudeRelease(float value) {
			sampleParameters.amplitudeEnvelopeRelease = releaseRange.map(value, midiRange);
		}

		public:
		void setFilterMode(Filter::Mode newFilterMode) {
			filter->setMode(newFilterMode);
		}

		public:
		void setCutoff(uintptr_t newCutoffValuesPtr) {
			sampleParameters.cutoffValues = reinterpret_cast<float *>(newCutoffValuesPtr);
		}

		public:
		void setResonance(uintptr_t newResonanceValuesPtr) {
			sampleParameters.resonanceValues = reinterpret_cast<float *>(newResonanceValuesPtr);
		}

		public:
		void setDrive(uintptr_t newDriveValuesPtr) {
			sampleParameters.driveValues = reinterpret_cast<float *>(newDriveValuesPtr);
		}

		public:
		void setCutoffEnvelopeAmount(float value) {
			sampleParameters.cutoffEnvelopeAmount = zeroOneRange.map(value, midiRange);
		}

		public:
		void setCutoffEnvelopeVelocity(float value) {
			sampleParameters.cutoffEnvelopeVelocity = zeroOneRange.map(value, midiRange);
		}

		public:
		void setCutoffEnvelopeAttack(float value) {
			sampleParameters.cutoffEnvelopeAttack = attackRange.map(value, midiRange);
		}

		public:
		void setCutoffEnvelopeDecay(float value) {
			sampleParameters.cutoffEnvelopeDecay = decayRange.map(value, midiRange);
		}

		public:
		void setLfo1Mode(Oscillator::Mode newMode) {
			lfo1.setMode(newMode);
		}

		public:
		void setLfo1ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo1ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		public:
		void setLfo1Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo1FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		public:
		void setLfo1Destination(LfoDestination newLfoDestination) {
			lfo1Destination = newLfoDestination;
		}

		public:
		void setLfo2Mode(Oscillator::Mode newMode) {
			lfo2.setMode(newMode);
		}

		public:
		void setLfo2ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo2ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		public:
		void setLfo2Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo2FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		public:
		void setLfo2Destination(LfoDestination newLfoDestination) {
			lfo2Destination = newLfoDestination;
		}

		public:
		bool isStopped() {
			return state == State::STOPPED;
		}

		public:
		void reset() {
			osc1.reset();
			osc2.reset();
			noise.reset();
			lfo1.reset();
			lfo2.reset();
			filter->reset();
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

		private:
		float computeSample() {
			float sample = computeRawSample() * velocity * amplitudeEnvelope.nextLevel();
			float filtered = filter->nextSample(sample, sampleParameters.cutoff, sampleParameters.resonance);
			return shape(filtered);
		}

		private: // from https://www.musicdsp.org/en/latest/Effects/46-waveshaper.html
		float shape(float sample) {
			float amount = sampleParameters.overdrive;
			float k = 2.f * amount / (1.f - amount);
			return (1.f + k) * sample / (1.f + k * abs(sample));
		}

		private:
		float computeRawSample() {
			float osc1Sample = osc1.nextSample(sampleParameters.frequency) * sampleParameters.osc1Amplitude;
			float osc2Sample = osc2.nextSample(sampleParameters.frequency) * sampleParameters.osc2Amplitude;
			float noiseSample = noise.nextSample(sampleParameters.frequency) * sampleParameters.noiseLevel;
			subOsc.setOsc2Amplitude(sampleParameters.osc2Amplitude);
			float subOscSample = subOsc.nextSample(sampleParameters.frequency) * Constants::subOscPresence;
			return (1 - Constants::subOscPresence) * (osc1Sample + osc2Sample) + subOscSample + noiseSample;
		}

		private:
		void applyModulations() {
			float lfo1Mod = sampleParameters.lfo1ModAmount * lfo1.nextSample(sampleParameters.lfo1Frequency);
			float lfo2Mod = sampleParameters.lfo2ModAmount * lfo2.nextSample(sampleParameters.lfo2Frequency);
			float cutoffMod = sampleParameters.cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();
			cutoffMod += velocity * sampleParameters.cutoffEnvelopeVelocity;
			applyLFO(lfo1Destination, lfo1Mod);
			applyLFO(lfo2Destination, lfo2Mod);
			sampleParameters.cutoff = cutoffRange.clamp(sampleParameters.cutoff + cutoffMod);
		}

		private:
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

		private:
		void startIfNecessary() {
			if (state == State::DISPOSED) {
				amplitudeEnvelope.enterAttackStage();
				cutoffEnvelope.enterAttackStage();
				state = State::STARTED;
			}
		}

		private:
		void stopIfNecessary() {
			if (state == State::STOPPING && amplitudeEnvelope.isDone()) {
				state = State::STOPPED;
			}
		}

		private:
		Oscillator::Kernel osc1;
		Oscillator::Kernel osc2;
		Oscillator::Kernel noise;
		SubOsc subOsc;

		Oscillator::Kernel lfo1;
		LfoDestination lfo1Destination;

		Oscillator::Kernel lfo2;
		LfoDestination lfo2Destination;

		Envelope::Kernel amplitudeEnvelope;

		std::unique_ptr<Filter::Kernel> filter;

		Envelope::Kernel cutoffEnvelope;

		State state;

		SampleParameters sampleParameters;

		float sampleRate = Constants::sampleRate;
		unsigned renderFrames = Constants::renderFrames;
		float velocity = 1.f;
	};

	EMSCRIPTEN_BINDINGS(CLASS_VoiceKernel) {
		class_<Voice::Kernel>("VoiceKernel")
						.constructor<float, float>()
						.function("process", &Voice::Kernel::process, allow_raw_pointers())
						.function("setParameters", &Voice::Kernel::setParameters, allow_raw_pointers())
						.function("setVelocity", &Voice::Kernel::setVelocity)
						.function("setOsc1Mode", &Voice::Kernel::setOsc1Mode)
						.function("setOsc1SemiShift", &Voice::Kernel::setOsc1SemiShift)
						.function("setOsc1CentShift", &Voice::Kernel::setOsc1CentShift)
						.function("setOsc1Cycle", &Voice::Kernel::setOsc1Cycle)
						.function("setOsc2Mode", &Voice::Kernel::setOsc2Mode)
						.function("setOsc2SemiShift", &Voice::Kernel::setOsc2SemiShift)
						.function("setOsc2CentShift", &Voice::Kernel::setOsc2CentShift)
						.function("setOsc2Cycle", &Voice::Kernel::setOsc2Cycle)
						.function("setOsc2Amplitude", &Voice::Kernel::setOsc2Amplitude, allow_raw_pointers())
						.function("setNoiseLevel", &Voice::Kernel::setNoiseLevel, allow_raw_pointers())
						.function("setAmplitudeAttack", &Voice::Kernel::setAmplitudeAttack)
						.function("setAmplitudeDecay", &Voice::Kernel::setAmplitudeDecay)
						.function("setAmplitudeSustain", &Voice::Kernel::setAmplitudeSustain)
						.function("setAmplitudeRelease", &Voice::Kernel::setAmplitudeRelease)
						.function("setFilterMode", &Voice::Kernel::setFilterMode)
						.function("setCutoff", &Voice::Kernel::setCutoff, allow_raw_pointers())
						.function("setResonance", &Voice::Kernel::setResonance, allow_raw_pointers())
						.function("setDrive", &Voice::Kernel::setDrive, allow_raw_pointers())
						.function("setCutoffEnvelopeAmount", &Voice::Kernel::setCutoffEnvelopeAmount)
						.function("setCutoffEnvelopeVelocity", &Voice::Kernel::setCutoffEnvelopeVelocity)
						.function("setCutoffEnvelopeAttack", &Voice::Kernel::setCutoffEnvelopeAttack)
						.function("setCutoffEnvelopeDecay", &Voice::Kernel::setCutoffEnvelopeDecay)
						.function("setLfo1Frequency", &Voice::Kernel::setLfo1Frequency, allow_raw_pointers())
						.function("setLfo1ModAmount", &Voice::Kernel::setLfo1ModAmount, allow_raw_pointers())
						.function("setLfo1Mode", &Voice::Kernel::setLfo1Mode)
						.function("setLfo1Destination", &Voice::Kernel::setLfo1Destination)
						.function("setLfo2Frequency", &Voice::Kernel::setLfo2Frequency, allow_raw_pointers())
						.function("setLfo2ModAmount", &Voice::Kernel::setLfo2ModAmount, allow_raw_pointers())
						.function("setLfo2Mode", &Voice::Kernel::setLfo2Mode)
						.function("setLfo2Destination", &Voice::Kernel::setLfo2Destination)
						.function("isStopped", &Voice::Kernel::isStopped)
						.function("enterReleaseStage", &Voice::Kernel::enterReleaseStage)
						.function("reset", &Voice::Kernel::reset);
	}

	EMSCRIPTEN_BINDINGS(ENUM_OscillatorMode) {
		enum_<Oscillator::Mode>("WaveForm")
						.value("SINE", Oscillator::Mode::SINE)
						.value("SAW", Oscillator::Mode::SAW)
						.value("SQUARE", Oscillator::Mode::SQUARE)
						.value("TRIANGLE", Oscillator::Mode::TRIANGLE);
	}

	EMSCRIPTEN_BINDINGS(ENUM_FilterMode) {
		enum_<Filter::Mode>("FilterMode")
						.value("LOWPASS", Filter::Mode::LOWPASS)
						.value("LOWPASS_PLUS", Filter::Mode::LOWPASS_PLUS)
						.value("BANDPASS", Filter::Mode::BANDPASS)
						.value("HIGHPASS", Filter::Mode::HIGHPASS);
	}

	EMSCRIPTEN_BINDINGS(ENUM_VoiceState) {
		enum_<Voice::State>("VoiceState")
						.value("DISPOSED", Voice::State::DISPOSED)
						.value("STARTED", Voice::State::STARTED)
						.value("STOPPING", Voice::State::STOPPING)
						.value("STOPPED", Voice::State::STOPPED);
	}

	EMSCRIPTEN_BINDINGS(ENUM_LfoDestination) {
		enum_<Voice::LfoDestination>("LfoDestination")
						.value("FREQUENCY", Voice::LfoDestination::FREQUENCY)
						.value("OSCILLATOR_MIX", Voice::LfoDestination::OSCILLATOR_MIX)
						.value("CUTOFF", Voice::LfoDestination::CUTOFF)
						.value("RESONANCE", Voice::LfoDestination::RESONANCE)
						.value("OSC1_CYCLE", Voice::LfoDestination::OSC1_CYCLE)
						.value("OSC2_CYCLE", Voice::LfoDestination::OSC2_CYCLE);
	}
} // namespace Voice
