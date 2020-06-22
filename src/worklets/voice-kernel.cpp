#include "envelope.cpp"
#include "filter.cpp"
#include "oscillator.cpp"
#include "range.cpp"
#include <algorithm>
#include <bitset>
#include <cmath>
#include <memory>

#include "emscripten/bind.h"
#include <iostream>

using namespace emscripten;

constexpr unsigned kRenderQuantumFrames = 128.f; // this value is fixed by the Web Audio API spec.

enum class VoiceState {
	DISPOSED,
	STARTED,
	STOPPING,
	STOPPED
};

class SubOsc {
	public:
	float nextSample(float frequency) {
		float osc1Sample = osc1.nextSample(frequency / 2) * (1.f - osc2Amplitude);
		float osc2Sample = osc2.nextSample(frequency / 2) * osc2Amplitude;
		return osc1Sample + osc2Sample;
	}

	public:
	void setOsc1Mode(Oscillator::Mode newMode) {
		osc1.setMode(newMode);
	}

	public:
	void setOsc1SemiShift(float newSemiShift) {
		osc1.setSemiShift(newSemiShift);
	}

	public:
	void setOsc1CentShift(float newCentShift) {
		osc1.setCentShift(newCentShift);
	}

	public:
	void setOsc2Mode(Oscillator::Mode newMode) {
		osc2.setMode(newMode);
	}

	public:
	void setOsc2SemiShift(float newSemiShift) {
		osc2.setSemiShift(newSemiShift);
	}

	public:
	void setOsc2CentShift(float newCentShift) {
		osc2.setCentShift(newCentShift);
	}

	public:
	void setOsc2Amplitude(float newOsc2Amplitude) {
		osc2Amplitude = zeroOneRange.map(newOsc2Amplitude, midiRange);
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;

	float osc2Amplitude;
};

struct SampleParameters {
	float frequency;
	float osc2Amplitude;
	float cutoff;
	float resonance;

	float lfoFrequency;
	float lfoModAmount;

	SampleParameters &setFrequency(float newFrequency) {
		frequency = newFrequency;
		return *this;
	}

	SampleParameters &setOsc2Amplitude(float newOsc2Amplitude) {
		osc2Amplitude = newOsc2Amplitude;
		return *this;
	}

	SampleParameters &setCutoff(float newCutoff) {
		cutoff = newCutoff;
		return *this;
	}

	SampleParameters &setResonance(float newResonance) {
		resonance = newResonance;
		return *this;
	}

	SampleParameters &setLfoFrequency(float newFrequency) {
		lfoFrequency = newFrequency;
		return *this;
	}

	SampleParameters &setLfoModAmount(float newModAmount) {
		lfoModAmount = newModAmount;
		return *this;
	}

	float osc1Amplitude() {
		return 1.f - osc2Amplitude;
	}
};

enum class LfoDestination {
	FREQUENCY = 0,
	OSCILLATOR_MIX = 1,
	CUTOFF = 2,
	RESONANCE = 3,
	INVERSED_RESONANCE = 4,

	VALUES_COUNT = INVERSED_RESONANCE + 1
};

class VoiceKernel {
	public:
	VoiceKernel() :
		amplitudeEnvelope(Envelope::Kernel(1.f, 0.5f, 0.5f, 0.5f, 0.9f)),
		cutoffEnvelope(Envelope::Kernel(1.f, -0.5f, 0.01f, 2.f, 0.f)),
		state(VoiceState::DISPOSED) {
	}

	public:
	void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
		float *outputBuffer = reinterpret_cast<float *>(outputPtr);
		float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

		for (unsigned channel = 0; channel < channelCount; ++channel) {
			float *channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

			for (auto i = 0; i < kRenderQuantumFrames; ++i) {
				sampleParameters.setFrequency(getCurrentValue(frequencyValues, i))
								.setOsc2Amplitude(getCurrentValue(osc2AmplitudeValues, i, midiRange, zeroOneRange))
								.setCutoff(getCurrentValue(cutoffValues, i, midiRange, cutoffRange))
								.setResonance(getCurrentValue(resonanceValues, i, midiRange, resonanceRange))
								.setLfoFrequency(getCurrentValue(lfoFrequencyValues, i, midiRange, lfoFrequencyRange))
								.setLfoModAmount(getCurrentValue(lfoModAmountValues, i, midiRange, zeroOneRange));

				startIfNecessary();
				channelBuffer[i] = computeSample(sampleParameters);
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
	void setOsc1SemiShift(float newSemiShift) {
		osc1.setSemiShift(newSemiShift);
		subOsc.setOsc1SemiShift(newSemiShift);
	}

	public:
	void setOsc1CentShift(float newCentShift) {
		osc1.setCentShift(newCentShift);
		subOsc.setOsc1CentShift(newCentShift);
	}

	public:
	void setOsc2Mode(Oscillator::Mode newMode) {
		osc2.setMode(newMode);
		subOsc.setOsc2Mode(newMode);
	}

	public:
	void setOsc2SemiShift(float newSemiShift) {
		osc2.setSemiShift(newSemiShift);
		subOsc.setOsc2SemiShift(newSemiShift);
	}

	public:
	void setOsc2CentShift(float newCentShift) {
		osc2.setCentShift(newCentShift);
		subOsc.setOsc2CentShift(newCentShift);
	}

	public:
	void setOsc2Amplitude(uintptr_t osc2AmplitudeValuesPtr) {
		osc2AmplitudeValues = reinterpret_cast<float *>(osc2AmplitudeValuesPtr);
	}

	public:
	void enterReleaseStage() {
		state = VoiceState::STOPPING;
		amplitudeEnvelope.enterReleaseStage();
	}

	public:
	void setAmplitudeAttack(const float newAmplitudeAttack) {
		amplitudeEnvelope.setAttackTime(attackRange.map(newAmplitudeAttack, midiRange));
	}

	public:
	void setAmplitudeDecay(float newAmplitudeDecay) {
		amplitudeEnvelope.setDecayTime(decayRange.map(newAmplitudeDecay, midiRange));
	}

	public:
	void setAmplitudeSustain(float newAmplitudeSustain) {
		amplitudeEnvelope.setSustainLevel(sustainRange.map(newAmplitudeSustain, midiRange));
	}

	public:
	void setAmplitudeRelease(float newAmplitudeRelease) {
		amplitudeEnvelope.setReleaseTime(releaseRange.map(newAmplitudeRelease, midiRange));
	}

	public:
	void setFilterMode(Filter::Mode newFilterMode) {
		filter.setMode(newFilterMode);
	}

	public:
	void setCutoff(uintptr_t cutoffValuesPtr) {
		cutoffValues = reinterpret_cast<float *>(cutoffValuesPtr);
	}

	public:
	void setResonance(uintptr_t resonanceValuesPtr) {
		resonanceValues = reinterpret_cast<float *>(resonanceValuesPtr);
	}

	public:
	void setCutoffEnvelopeAmount(float newCutoffEnvelopeAmount) {
		cutoffEnvelopeAmount = envelopeAmountRange.map(newCutoffEnvelopeAmount, midiRange);
	}

	public:
	void setCutoffEnvelopeAttack(float newCutoffEnvelopeAttack) {
		cutoffEnvelope.setAttackTime(attackRange.map(newCutoffEnvelopeAttack, midiRange));
	}

	public:
	void setCutoffEnvelopeDecay(float newCutoffEnvelopeDecay) {
		cutoffEnvelope.setDecayTime(decayRange.map(newCutoffEnvelopeDecay, midiRange));
	}

	public:
	void setLfoMode(Oscillator::Mode newMode) {
		lfo.setMode(newMode);
	}

	public:
	void setLfoModAmount(uintptr_t lfoModAmountValuesPtr) {
		lfoModAmountValues = reinterpret_cast<float *>(lfoModAmountValuesPtr);
	}

	public:
	void setLfoFrequency(uintptr_t lfoFrequencyValuesPtr) {
		lfoFrequencyValues = reinterpret_cast<float *>(lfoFrequencyValuesPtr);
	}

	public:
	void setLfoDestination(LfoDestination destination) {
		lfoDestinations.set(static_cast<size_t>(destination));
	}

	public:
	void unsetLfoDestination(LfoDestination destination) {
		lfoDestinations.reset(static_cast<size_t>(destination));
	}

	public:
	bool isStopped() {
		return state == VoiceState::STOPPED;
	}

	private:
	inline float computeSample(SampleParameters &parameters) {
		applyModulations(parameters);
		float rawSample = computeRawSample(parameters);
		return filter.nextSample(rawSample, parameters.cutoff, parameters.resonance);
	}

	private:
	inline float computeRawSample(SampleParameters &parameters) {
		static constexpr float subOscPresence = 0.5f;
		static constexpr float finalAmplitude = 0.8f;

		subOsc.setOsc2Amplitude(parameters.osc2Amplitude);
		float osc1Sample = osc1.nextSample(parameters.frequency) * parameters.osc1Amplitude();
		float osc2Sample = osc2.nextSample(parameters.frequency) * parameters.osc2Amplitude;
		float subOscSample = subOsc.nextSample(parameters.frequency);
		float rawSample = (1 - subOscPresence) * (osc1Sample + osc2Sample) + subOscPresence * subOscSample;
		return rawSample * amplitudeEnvelope.nextLevel() * finalAmplitude;
	}

	private:
	inline void applyModulations(SampleParameters &parameters) {
		float lfoMod = parameters.lfoModAmount * lfo.nextSample(parameters.lfoFrequency);
		float cutoffMod = cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();
		parameters.cutoff = cutoffRange.clamp(parameters.cutoff + cutoffMod);

		if (isSet(LfoDestination::FREQUENCY)) {
			parameters.frequency += lfoMod * 100;
		}
		if (isSet(LfoDestination::CUTOFF)) {
			parameters.cutoff = cutoffRange.clamp(parameters.cutoff + lfoMod);
		}
		if (isSet(LfoDestination::RESONANCE)) {
			parameters.resonance = resonanceRange.clamp(parameters.resonance + lfoMod);
		} else if (isSet(LfoDestination::INVERSED_RESONANCE)) {
			parameters.resonance = resonanceRange.clamp(parameters.resonance - lfoMod);
		}
		if (isSet(LfoDestination::OSCILLATOR_MIX)) {
			parameters.osc2Amplitude = zeroOneRange.clamp(parameters.osc2Amplitude + lfoMod);
		}
	}

	private:
	inline bool isSet(LfoDestination LfoDestination) {
		return lfoDestinations.test(static_cast<size_t>(LfoDestination));
	}

	private:
	inline void startIfNecessary() {
		if (state == VoiceState::DISPOSED) {
			amplitudeEnvelope.enterAttackStage();
			cutoffEnvelope.enterAttackStage();
			state = VoiceState::STARTED;
		}
	}

	private:
	inline void stopIfNecessary() {
		if (state == VoiceState::STOPPING && amplitudeEnvelope.isDone()) {
			state = VoiceState::STOPPED;
		}
	}

	private:
	inline float getCurrentValue(float *valuesPtr, unsigned int i) {
		return hasConstantValue(valuesPtr) ? valuesPtr[0] : valuesPtr[i];
	}

	private:
	inline float getCurrentValue(float *valuesPtr, unsigned int i, Range sourceRange, Range targetRange) {
		auto value = getCurrentValue(valuesPtr, i);
		return targetRange.map(value, sourceRange);
	}

	private:
	inline bool hasConstantValue(float *valuesPtr) {
		return sizeof(valuesPtr) == sizeof(valuesPtr[0]);
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;
	SubOsc subOsc;
	float *osc2AmplitudeValues;

	Oscillator::Kernel lfo;
	float *lfoFrequencyValues;
	float *lfoModAmountValues;

	std::bitset<static_cast<size_t>(LfoDestination::VALUES_COUNT)> lfoDestinations;

	Envelope::Kernel amplitudeEnvelope;

	Filter::Kernel filter;
	float *cutoffValues;
	float *resonanceValues;

	Envelope::Kernel cutoffEnvelope;
	float cutoffEnvelopeAmount = 0.8f;

	VoiceState state;

	SampleParameters sampleParameters;

	float sampleRate = 44100.f;
};

EMSCRIPTEN_BINDINGS(CLASS_VoiceKernel) {
	class_<VoiceKernel>("VoiceKernel")
					.smart_ptr_constructor("VoiceKernel", &std::make_shared<VoiceKernel>)
					.function("process", &VoiceKernel::process, allow_raw_pointers())
					.function("setOsc1Mode", &VoiceKernel::setOsc1Mode)
					.function("setOsc1SemiShift", &VoiceKernel::setOsc1SemiShift)
					.function("setOsc1CentShift", &VoiceKernel::setOsc1CentShift)
					.function("setOsc2Mode", &VoiceKernel::setOsc2Mode)
					.function("setOsc2SemiShift", &VoiceKernel::setOsc2SemiShift)
					.function("setOsc2CentShift", &VoiceKernel::setOsc2CentShift)
					.function("setOsc2Amplitude", &VoiceKernel::setOsc2Amplitude, allow_raw_pointers())
					.function("setAmplitudeAttack", &VoiceKernel::setAmplitudeAttack)
					.function("setAmplitudeDecay", &VoiceKernel::setAmplitudeDecay)
					.function("setAmplitudeSustain", &VoiceKernel::setAmplitudeSustain)
					.function("setAmplitudeRelease", &VoiceKernel::setAmplitudeRelease)
					.function("setFilterMode", &VoiceKernel::setFilterMode)
					.function("setCutoff", &VoiceKernel::setCutoff, allow_raw_pointers())
					.function("setResonance", &VoiceKernel::setResonance, allow_raw_pointers())
					.function("setCutoffEnvelopeAmount", &VoiceKernel::setCutoffEnvelopeAmount)
					.function("setCutoffEnvelopeAttack", &VoiceKernel::setCutoffEnvelopeAttack)
					.function("setCutoffEnvelopeDecay", &VoiceKernel::setCutoffEnvelopeDecay)
					.function("setLfoFrequency", &VoiceKernel::setLfoFrequency)
					.function("setLfoModAmount", &VoiceKernel::setLfoModAmount)
					.function("setLfoMode", &VoiceKernel::setLfoMode)
					.function("setLfoDestination", &VoiceKernel::setLfoDestination)
					.function("unsetLfoDestination", &VoiceKernel::unsetLfoDestination)
					.function("isStopped", &VoiceKernel::isStopped)
					.function("enterReleaseStage", &VoiceKernel::enterReleaseStage);
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
	enum_<VoiceState>("VoiceState")
					.value("DISPOSED", VoiceState::DISPOSED)
					.value("STARTED", VoiceState::STARTED)
					.value("STOPPING", VoiceState::STOPPING)
					.value("STOPPED", VoiceState::STOPPED);
}

EMSCRIPTEN_BINDINGS(ENUM_LfoDestination) {
	enum_<LfoDestination>("LfoDestination")
					.value("FREQUENCY", LfoDestination::FREQUENCY)
					.value("OSCILLATOR_MIX", LfoDestination::OSCILLATOR_MIX)
					.value("CUTOFF", LfoDestination::CUTOFF)
					.value("INVERSED_RESONANCE", LfoDestination::INVERSED_RESONANCE)
					.value("RESONANCE", LfoDestination::RESONANCE);
}