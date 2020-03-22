#include <cmath>
#include <memory>

#include "emscripten/bind.h"

#include <iostream>

using namespace emscripten;

constexpr unsigned kRenderQuantumFrames = 128.f;
constexpr float sampleRate = 44100.f;
constexpr float PI = 3.14159265358979f;
constexpr float TWO_PI = 2.f * PI;

enum class OscillatorMode {
	SINE,
	SAW,
	SQUARE
};

enum class OscillatorState {
	STARTING,
	STARTED,
	STOPPING,
	STOPPED
};

enum class EnvelopeStage {
	ATTACK,
	DECAY,
	SUSTAIN,
	RELEASE,
	DONE
};

class EnvelopeGenerator {
	public:
	EnvelopeGenerator() :
					tick(0),
					stage(EnvelopeStage::ATTACK) {}

	public:
	float computeMultiplier(int a, int d, float s, int r) {
		float multiplier;
		switch (stage) {
			case EnvelopeStage::ATTACK:
				multiplier = computeLinearRampUp(0.f, 1.f, a);
				stage = computeNextStage(a);
				return multiplier;
			case EnvelopeStage::DECAY:
				multiplier = computeLinearRampDown(s, 1.f, d);
				stage = computeNextStage(d);
				return multiplier;
			case EnvelopeStage::SUSTAIN:
				return s;
			case EnvelopeStage::RELEASE:
				multiplier = computeLinearRampDown(0.f, s, r);
				stage = computeNextStage(r);
				return multiplier;
			default: return 0.f;
		}
	}

	void enterReleaseStage() {
		if (stage != EnvelopeStage::RELEASE) {
			tick = 0;
			stage = EnvelopeStage::RELEASE;
		}
	}

	bool isDone() {
		return stage == EnvelopeStage::DONE;
	}

	void reset() {
		tick = 0;
		stage = EnvelopeStage::ATTACK;
	}

	private:
	float computeLinearRampUp(float min, float max, int t) {
		return tick == 0 ? min : static_cast<float>(tick) * ((max - min) / static_cast<float>(t));
	}

	float computeLinearRampDown(float max, float min, int t) {
		return max - computeLinearRampUp(min, max, t);
	}

	EnvelopeStage computeNextStage(int t) {
		if (stage == EnvelopeStage::RELEASE) {
			if (++tick == t) {
				tick = 0;
				return EnvelopeStage::DONE;
			}
		}
		if (stage == EnvelopeStage::DECAY) {
			if (++tick == t) {
				tick = 0;
				return EnvelopeStage::SUSTAIN;
			}
		}
		if (stage == EnvelopeStage::ATTACK) {
			if (++tick == t) {
				tick = 0;
				return EnvelopeStage::DECAY;
			}
		}
		return stage; // SUSTAIN
	}

	private:
	EnvelopeStage stage;
	int tick;
};

class OscillatorKernel {
	public:
	void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
		float *outputBuffer = reinterpret_cast<float *>(outputPtr);
		float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

		bool hasConstantFrequency = sizeof(frequencyValues) == sizeof(frequencyValues[0]);

		startIfNecessary();

		std::cout << amplitudeMultiplier << std::endl;
		for (unsigned channel = 0; channel < channelCount; ++channel) {
			float *channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

			for (auto i = 0; i < kRenderQuantumFrames; ++i) {
				float frequency = hasConstantFrequency ? frequencyValues[0] : frequencyValues[i];
				phaseIncrement = computePhaseIncrement(frequency);
				channelBuffer[i] = computeSample(frequency) * amplitude * amplitudeMultiplier;
				updatePhase();
			}
		}
	}

	void setMode(OscillatorMode _mode) { mode = _mode; }

	void enterReleaseStage() {
		state = OscillatorState::STOPPING;
		envelope.enterReleaseStage();
	}

	void reset() {
		envelope.reset();
		state = OscillatorState::STARTING;
	}

	void setAttack(int a) { attackT = a; }

	void setDecay(int d) { decayT = d; }

	void setSustain(float s) { sustain = s; }

	void setRelease(int r) { releaseT = r; }

	bool isStopped() {
		return state == OscillatorState::STOPPED;
	}

	private:
	float computeSample(float frequency) {
		switch (mode) {
			case OscillatorMode::SINE:
				return computeSine(frequency);
			case OscillatorMode::SAW:
				return computeSaw(frequency);
			case OscillatorMode::SQUARE:
				return computeSquare(frequency);
		}
	}

	float computeSine(float frequency) { return std::sin(phase); }

	float computeSaw(float frequency) {
		float value = 1.0 - (2.0 * phase / TWO_PI);
		return value - computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
	}

	float computeSquare(float frequency) {
		auto value = phase <= PI ? 1 : -1;
		value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
		value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
		return value;
	}

	void updatePhase() {
		phase += phaseIncrement;
		if (phase >= TWO_PI) {
			amplitudeMultiplier = envelope.computeMultiplier(attackT, decayT, sustain, releaseT);
			phase -= TWO_PI;
		}
		stopIfNecessary();
	}

	void startIfNecessary() {
		if (state == OscillatorState::STARTING) {
			amplitudeMultiplier = envelope.computeMultiplier(attackT, decayT, sustain, releaseT);
			state = OscillatorState::STARTED;
		}
	}

	void stopIfNecessary() {
		if (envelope.isDone()) {
			state = OscillatorState::STOPPED;
		}
	}

	float computePhaseIncrement(float frequency) {
		return frequency * TWO_PI / sampleRate;
	}

	float computePolyBLEP(float t, float dt) {
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

	float amplitude = 0.5f;
	/**
   * ADSR envelope
   * Attack, decay and release time are defined as integer multiples of the phase T
   */
	int attackT = 20;
	int decayT = 100;
	int releaseT = 100;
	float sustain = .5f; // sustain level
	float amplitudeMultiplier = .1f;

	OscillatorMode mode = OscillatorMode::SINE;
	OscillatorState state = OscillatorState::STARTING;
	EnvelopeGenerator envelope;
};

EMSCRIPTEN_BINDINGS(CLASS_OscillatorKernel) {
	class_<OscillatorKernel>("OscillatorKernel")
					.smart_ptr_constructor("OscillatorKernel",
									&std::make_shared<OscillatorKernel>)
					.function("process", &OscillatorKernel::process, allow_raw_pointers())
					.function("setMode", &OscillatorKernel::setMode)
					.function("isStopped", &OscillatorKernel::isStopped)
					.function("reset", &OscillatorKernel::reset)
					.function("enterReleaseStage", &OscillatorKernel::enterReleaseStage);
}

EMSCRIPTEN_BINDINGS(ENUM_OscillatorMode) {
	enum_<OscillatorMode>("WaveForm")
					.value("SINE", OscillatorMode::SINE)
					.value("SAW", OscillatorMode::SAW)
					.value("SQUARE", OscillatorMode::SQUARE);
}

EMSCRIPTEN_BINDINGS(ENUM_OscillatorState) {
	enum_<OscillatorState>("State")
					.value("STARTING", OscillatorState::STARTING)
					.value("STARTED", OscillatorState::STARTED)
					.value("STOPPING", OscillatorState::STOPPING)
					.value("STOPPED", OscillatorState::STOPPED);
}