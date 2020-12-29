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
		void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
			float *outputBuffer = reinterpret_cast<float *>(outputPtr);
			float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

			for (unsigned channel = 0; channel < channelCount; ++channel) {
				float *channelBuffer = outputBuffer + channel * renderFrames;

				for (auto sample = 0; sample < renderFrames; ++sample) {
					startIfNecessary();
					assignParameters(frequencyValues, sample);
					channelBuffer[sample] = computeSample();
					stopIfNecessary();
				}
			}
		}

		public:
		void setOsc1Mode(Oscillator::Mode newMode) {
			osc1.setMode(newMode);
			subOsc.setOsc1Mode(newMode);
		}

		public:
		void setOsc1SemiShift(uintptr_t newSemiShiftValuesPtr) {
			sampleParameters.osc1SemiShiftValues = reinterpret_cast<float *>(newSemiShiftValuesPtr);
		}

		public:
		void setOsc1CentShift(uintptr_t newCentShiftValuesPtr) {
			sampleParameters.osc1CentShiftValues = reinterpret_cast<float *>(newCentShiftValuesPtr);
		}

		public:
		void setOsc1Cycle(uintptr_t newCycleValuesPtr) {
			sampleParameters.osc1CycleValues = reinterpret_cast<float *>(newCycleValuesPtr);
		}

		public:
		void setOsc2Mode(Oscillator::Mode newMode) {
			osc2.setMode(newMode);
			subOsc.setOsc2Mode(newMode);
		}

		public:
		void setOsc2SemiShift(uintptr_t newSemiShiftValuesPtr) {
			sampleParameters.osc2SemiShiftValues = reinterpret_cast<float *>(newSemiShiftValuesPtr);
		}

		public:
		void setOsc2CentShift(uintptr_t newCentShiftValuesPtr) {
			sampleParameters.osc2CentShiftValues = reinterpret_cast<float *>(newCentShiftValuesPtr);
		}

		public:
		void setOsc2Cycle(uintptr_t newCycleValuesPtr) {
			sampleParameters.osc2CycleValues = reinterpret_cast<float *>(newCycleValuesPtr);
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
		void setAmplitudeAttack(uintptr_t newAmplitudeAttackValuesPtr) {
			sampleParameters.amplitudeEnvelopeAttackValues = reinterpret_cast<float *>(newAmplitudeAttackValuesPtr);
		}

		public:
		void setAmplitudeDecay(uintptr_t newAmplitudeDecayValuesPtr) {
			sampleParameters.amplitudeEnvelopeDecayValues = reinterpret_cast<float *>(newAmplitudeDecayValuesPtr);
		}

		public:
		void setAmplitudeSustain(uintptr_t newAmplitudeSustainValuesPtr) {
			sampleParameters.amplitudeEnvelopeSustainValues = reinterpret_cast<float *>(newAmplitudeSustainValuesPtr);
		}

		public:
		void setAmplitudeRelease(uintptr_t newAmplitudeReleaseValuesPtr) {
			sampleParameters.amplitudeEnvelopeReleaseValues = reinterpret_cast<float *>(newAmplitudeReleaseValuesPtr);
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
		void setCutoffEnvelopeAmount(uintptr_t newCutoffEnvelopeAmountValuesPtr) {
			sampleParameters.cutoffEnvelopeAmountValues = reinterpret_cast<float *>(newCutoffEnvelopeAmountValuesPtr);
		}

		public:
		void setCutoffEnvelopeAttack(uintptr_t newCutoffEnvelopeAttackValuesPtr) {
			sampleParameters.cutoffEnvelopeAttackValues = reinterpret_cast<float *>(newCutoffEnvelopeAttackValuesPtr);
		}

		public:
		void setCutoffEnvelopeDecay(uintptr_t newCutoffEnvelopeDecayValuesPtr) {
			sampleParameters.cutoffEnvelopeDecayValues = reinterpret_cast<float *>(newCutoffEnvelopeDecayValuesPtr);
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

		private:
		void assignParameters(float *frequencyValues, unsigned int sampleCursor) {
			sampleParameters.withFrequencyValues(frequencyValues).fetchValues(sampleCursor);
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
			float sample = computeRawSample() * amplitudeEnvelope.nextLevel();
			float filtered = filter->nextSample(sample, sampleParameters.cutoff, sampleParameters.resonance);
			return shape(filtered);
		}

		private:
		float shape(float input) {
			float amount = sampleParameters.overdrive;
			float k = 2 * amount / (1 - amount);
			float shaped = (1 + k) * input / (1 + k * abs(input));
			return amplitudeRange.clamp(shaped);
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
	};

	EMSCRIPTEN_BINDINGS(CLASS_VoiceKernel) {
		class_<Voice::Kernel>("VoiceKernel")
						.constructor<float, float>()
						.function("process", &Voice::Kernel::process, allow_raw_pointers())
						.function("setOsc1Mode", &Voice::Kernel::setOsc1Mode)
						.function("setOsc1SemiShift", &Voice::Kernel::setOsc1SemiShift, allow_raw_pointers())
						.function("setOsc1CentShift", &Voice::Kernel::setOsc1CentShift, allow_raw_pointers())
						.function("setOsc1Cycle", &Voice::Kernel::setOsc1Cycle, allow_raw_pointers())
						.function("setOsc2Mode", &Voice::Kernel::setOsc2Mode)
						.function("setOsc2SemiShift", &Voice::Kernel::setOsc2SemiShift, allow_raw_pointers())
						.function("setOsc2CentShift", &Voice::Kernel::setOsc2CentShift, allow_raw_pointers())
						.function("setOsc2Cycle", &Voice::Kernel::setOsc2Cycle, allow_raw_pointers())
						.function("setOsc2Amplitude", &Voice::Kernel::setOsc2Amplitude, allow_raw_pointers())
						.function("setNoiseLevel", &Voice::Kernel::setNoiseLevel, allow_raw_pointers())
						.function("setAmplitudeAttack", &Voice::Kernel::setAmplitudeAttack, allow_raw_pointers())
						.function("setAmplitudeDecay", &Voice::Kernel::setAmplitudeDecay, allow_raw_pointers())
						.function("setAmplitudeSustain", &Voice::Kernel::setAmplitudeSustain, allow_raw_pointers())
						.function("setAmplitudeRelease", &Voice::Kernel::setAmplitudeRelease, allow_raw_pointers())
						.function("setFilterMode", &Voice::Kernel::setFilterMode)
						.function("setCutoff", &Voice::Kernel::setCutoff, allow_raw_pointers())
						.function("setResonance", &Voice::Kernel::setResonance, allow_raw_pointers())
						.function("setDrive", &Voice::Kernel::setDrive, allow_raw_pointers())
						.function("setCutoffEnvelopeAmount", &Voice::Kernel::setCutoffEnvelopeAmount, allow_raw_pointers())
						.function("setCutoffEnvelopeAttack", &Voice::Kernel::setCutoffEnvelopeAttack, allow_raw_pointers())
						.function("setCutoffEnvelopeDecay", &Voice::Kernel::setCutoffEnvelopeDecay, allow_raw_pointers())
						.function("setLfo1Frequency", &Voice::Kernel::setLfo1Frequency, allow_raw_pointers())
						.function("setLfo1ModAmount", &Voice::Kernel::setLfo1ModAmount, allow_raw_pointers())
						.function("setLfo1Mode", &Voice::Kernel::setLfo1Mode)
						.function("setLfo1Destination", &Voice::Kernel::setLfo1Destination)
						.function("setLfo2Frequency", &Voice::Kernel::setLfo2Frequency, allow_raw_pointers())
						.function("setLfo2ModAmount", &Voice::Kernel::setLfo2ModAmount, allow_raw_pointers())
						.function("setLfo2Mode", &Voice::Kernel::setLfo2Mode)
						.function("setLfo2Destination", &Voice::Kernel::setLfo2Destination)
						.function("isStopped", &Voice::Kernel::isStopped)
						.function("enterReleaseStage", &Voice::Kernel::enterReleaseStage);
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
