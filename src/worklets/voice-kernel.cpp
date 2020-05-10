#include <algorithm>
#include <cmath>
#include <memory>
#include "envelope.cpp"
#include "filter.cpp"
#include "range.cpp"
#include "oscillator.cpp"

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
	VoiceKernel(): 
	amplitudeEnvelope(Envelope::Kernel(1.f, 0.5f, 0.5f, 0.5f, 0.9f)),
	cutoffEnvelope(Envelope::Kernel(1.f, -0.5f, 0.01f, 2.f, 0.f)) {}

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
				amplitudeMultiplier = amplitudeEnvelope.nextLevel();
				float sample = osc1.nextSample(frequency) * amplitudeMultiplier;
				sample = filter.filter(sample, cutoff, resonance, cutoffEnvelopeAmount * cutoffEnvelope.nextLevel());
				channelBuffer[i] = sample;
				stopIfNecessary();
			}
		}
	}

	public:
	void setMode(Oscillator::Mode newMode) { 
		osc1.setMode(newMode);
	}

	public:
	void enterReleaseStage() {
		state = VoiceState::STOPPING;
		amplitudeEnvelope.enterReleaseStage();
	}

	public:
	void setAmplitudeAttack(const float a) { 
		amplitudeEnvelope.setAttackTime(attackRange.map(a, midiRange)); 
	}

	public:
	void setAmplitudeDecay(float d) { 
		amplitudeEnvelope.setDecayTime(decayRange.map(d, midiRange)); 
	}

	public:
	void setAmplitudeSustain(float s) { 
		amplitudeEnvelope.setSustainLevel(sustainRange.map(s, midiRange)); 
	} 

	public:
	void setAmplitudeRelease(float r) { 
		amplitudeEnvelope.setReleaseTime(releaseRange.map(r, midiRange)); 
	}

	public:
	void setCutoff(float c) {
		cutoff = cutoffRange.map(c, midiRange);
	}

	public:
	void setResonance(float r) {
		resonance = resonanceRange.map(r, midiRange);
	}

	public:
	void setCutoffEnvelopeAmount(float a) {
		cutoffEnvelopeAmount = envelopeAmountRange.map(a, midiRange);
	}

	public:
	void setCutoffEnvelopeAttack(float a) {
		cutoffEnvelope.setAttackTime(attackRange.map(a, midiRange));
	}

	public:
	void setCutoffEnvelopeDecay(float d) {
		cutoffEnvelope.setDecayTime(decayRange.map(d, midiRange));
	}

	public:
	bool isStopped() {
		return state == VoiceState::STOPPED;
	}

	private:
	inline void startIfNecessary() {
		if (state == VoiceState::DISPOSED) {
			amplitudeEnvelope.enterAttackStage();
			cutoffEnvelope.enterAttackStage();
			state = VoiceState::STARTED;
			std::cout << "started" << std::endl;
		}
	}

	private:
	inline void stopIfNecessary() {
		if (amplitudeEnvelope.isDone()) {
			state = VoiceState::STOPPED;
		}
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;

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
					.function("setMode", &VoiceKernel::setMode)
					.function("setAmplitudeAttack", &VoiceKernel::setAmplitudeAttack)
					.function("setAmplitudeDecay", &VoiceKernel::setAmplitudeDecay)
					.function("setAmplitudeSustain", &VoiceKernel::setAmplitudeSustain)
					.function("setAmplitudeRelease", &VoiceKernel::setAmplitudeRelease)
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

EMSCRIPTEN_BINDINGS(ENUM_VoiceState) {
	enum_<VoiceState>("VoiceState")
					.value("DISPOSED", VoiceState::DISPOSED)
					.value("STARTED", VoiceState::STARTED)
					.value("STOPPING", VoiceState::STOPPING)
					.value("STOPPED", VoiceState::STOPPED);
}