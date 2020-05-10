#include <algorithm>
#include <cmath>
#include <memory>
#include "envelope.cpp"
#include "filter.cpp"
#include "range.cpp"

#include "emscripten/bind.h"
#include <iostream>

using namespace emscripten;

constexpr unsigned kRenderQuantumFrames = 128.f;
constexpr float sampleRate = 44100.f;
constexpr float PI = 3.14159265358979f;
constexpr float TWO_PI = 2.f * PI;
constexpr float semiFactor = 1.0594630943592953f;
constexpr float centFactor = 1.0005777895065548f;

constexpr float attackRangeMin = 0.001f;
constexpr float attackRangeMax = 1.f;

enum class OscillatorMode {
	SAW,
	SINE,
	SQUARE,
	TRIANGLE
};

enum class VoiceState {
	STARTING,
	STARTED,
	STOPPING,
	STOPPED
};

class VoiceKernel {
	public:
	VoiceKernel(): 
	amplitudeEnvelope(Envelope::Generator(1.f, 0.5f, 0.5f, 0.5f, 0.9f)),
	cutoffEnvelope(Envelope::Generator(1.f, -0.5f, 0.01f, 2.f, 0.f)) {}

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
				frequency = shiftFrequency(frequency);
				startIfNecessary(frequency);
				phaseIncrement = computePhaseIncrement(frequency);
				amplitudeMultiplier = amplitudeEnvelope.nextLevel();
				float sample = computeSample(frequency) * amplitude * amplitudeMultiplier;
				sample = filter.filter(sample, cutoff, resonance, cutoffEnvelopeAmount * cutoffEnvelope.nextLevel());
				channelBuffer[i] = sample;
				updatePhase(frequency);
				stopIfNecessary();
			}
		}
	}

	public:
	void setMode(OscillatorMode _mode) { mode = _mode; }

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
	inline float computeSample(float frequency) {
		switch (mode) {
			case OscillatorMode::SINE:
				return computeSine(frequency);
			case OscillatorMode::SAW:
				return computeSaw(frequency);
			case OscillatorMode::SQUARE:
				return computeSquare(frequency);
			case OscillatorMode::TRIANGLE:
				return computeTriangle(frequency);
		}
	}

	private:
	inline float computeSine(float frequency) { return std::sin(phase); }

	private:
	inline float computeSaw(float frequency) {
		float value = 1.0 - (2.0 * phase / TWO_PI);
		return value - computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
	}

	private:
	inline float computeSquare(float frequency) {
		auto value = phase <= PI ? 1 : -1;
		value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
		value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
		return value;
	}

	private:
	inline float computeTriangle(float frequency) {
		auto value = computeSquare(frequency);
		value = phaseIncrement * value + (1.f - phaseIncrement) * lastValue;
		lastValue = value;
		return value;
	}

	private:
	inline float shiftFrequency(float frequency) {
		for (auto i = 1; i <= semiShift; ++i) frequency *= semiFactor;
		for (auto i = 1; i <= centShift; ++i) frequency *= centFactor;
		return frequency;
	}

	private:
	inline void updatePhase(float frequency) {
		phase += phaseIncrement;
		if (phase >= TWO_PI) {
			phase -= TWO_PI;
		}
	}

	private:
	inline void startIfNecessary(float frequency) {
		if (state == VoiceState::STARTING) {
			amplitudeEnvelope.enterAttackStage();
			cutoffEnvelope.enterAttackStage();
			state = VoiceState::STARTED;
		}
	}

	private:
	inline void stopIfNecessary() {
		if (amplitudeEnvelope.isDone()) {
			state = VoiceState::STOPPED;
		}
	}

	private:
	inline float computePhaseIncrement(float frequency) {
		return frequency * TWO_PI / sampleRate;
	}

	private:
	inline float computePolyBLEP(float t, float dt) {
		if (t < dt) {
			t /= dt;
			return t + t - t * t - 1.f;
		} else if (t > 1.f - dt) {
			t = (t - 1.f) / dt;
			return t * t + t + t + 1.f;
		} else {
			return 0.f;
		}
	}

	private:
	float phase = 0.f;
	float phaseIncrement = 0.f;
	float lastValue = 0.f;

	float amplitude = 0.5f;
	float amplitudeMultiplier = .1f;

	float semiShift = 0.f;
	float centShift = 0.f;

	OscillatorMode mode = OscillatorMode::SINE;
	VoiceState state = VoiceState::STARTING;
	Envelope::Generator amplitudeEnvelope;

	Filter filter;
	Envelope::Generator cutoffEnvelope;
	float cutoff = 0.75f;
	float resonance = 0.f;
	float cutoffEnvelopeAmount = 0.8f;
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
	enum_<OscillatorMode>("WaveForm")
					.value("SINE", OscillatorMode::SINE)
					.value("SAW", OscillatorMode::SAW)
					.value("SQUARE", OscillatorMode::SQUARE)
					.value("TRIANGLE", OscillatorMode::TRIANGLE);
}

EMSCRIPTEN_BINDINGS(ENUM_VoiceState) {
	enum_<VoiceState>("State")
					.value("STARTING", VoiceState::STARTING)
					.value("STARTED", VoiceState::STARTED)
					.value("STOPPING", VoiceState::STOPPING)
					.value("STOPPED", VoiceState::STOPPED);
}