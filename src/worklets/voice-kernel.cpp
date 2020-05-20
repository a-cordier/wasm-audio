#include "envelope.cpp"
#include "filter.cpp"
#include "oscillator.cpp"
#include "range.cpp"
#include <algorithm>
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

class VoiceKernel {
	public:
	VoiceKernel() :
		amplitudeEnvelope(Envelope::Kernel(1.f, 0.5f, 0.5f, 0.5f, 0.9f)),
		cutoffEnvelope(Envelope::Kernel(1.f, -0.5f, 0.01f, 2.f, 0.f)),
		state(VoiceState::DISPOSED) {
		osc2.setSemiShift(12);
	}

	public:
	void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
		float *outputBuffer = reinterpret_cast<float *>(outputPtr);
		float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

		// frequency may have been automated (eg by an LFO)
		bool hasConstantFrequency = sizeof(frequencyValues) == sizeof(frequencyValues[0]);

		for (unsigned channel = 0; channel < channelCount; ++channel) {
			float *channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

			for (auto i = 0; i < kRenderQuantumFrames; ++i) {
				float frequency = hasConstantFrequency ? frequencyValues[0] : frequencyValues[i];
				startIfNecessary();
				channelBuffer[i] = computeSample(frequency);
				stopIfNecessary();
			}
		}
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
	void setCutoff(float newCutoff) {
		cutoff = cutoffRange.map(newCutoff, midiRange);
	}

	public:
	void setResonance(float newResonance) {
		resonance = resonanceRange.map(newResonance, midiRange);
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
	bool isStopped() {
		return state == VoiceState::STOPPED;
	}

	private:
	inline float computeSample(float frequency) {
		float osc1Sample = osc1.nextSample(frequency) * (1.f - osc2Amplitude);
		float osc2Sample = osc2.nextSample(frequency) * osc2Amplitude;
		float rawSample = (osc1Sample + osc2Sample) * amplitudeEnvelope.nextLevel();
		float cutoffMod = cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();
		return filter.nextSample(rawSample, cutoff, resonance, cutoffMod);
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
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;
	float osc2Amplitude = 0.5f;

	Envelope::Kernel amplitudeEnvelope;
	float amplitudeMultiplier = .1f;

	Filter::Kernel filter;
	float cutoff = 0.75f;
	float resonance = 0.f;

	Envelope::Kernel cutoffEnvelope;
	float cutoffEnvelopeAmount = 0.8f;

	VoiceState state;

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
					.function("setOsc2Amplitude", &VoiceKernel::setOsc2Amplitude)
					.function("setAmplitudeAttack", &VoiceKernel::setAmplitudeAttack)
					.function("setAmplitudeDecay", &VoiceKernel::setAmplitudeDecay)
					.function("setAmplitudeSustain", &VoiceKernel::setAmplitudeSustain)
					.function("setAmplitudeRelease", &VoiceKernel::setAmplitudeRelease)
					.function("setFilterMode", &VoiceKernel::setFilterMode)
					.function("setCutoff", &VoiceKernel::setCutoff)
					.function("setResonance", &VoiceKernel::setResonance)
					.function("setCutoffEnvelopeAmount", &VoiceKernel::setCutoffEnvelopeAmount)
					.function("setCutoffEnvelopeAttack", &VoiceKernel::setCutoffEnvelopeAttack)
					.function("setCutoffEnvelopeDecay", &VoiceKernel::setCutoffEnvelopeDecay)
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