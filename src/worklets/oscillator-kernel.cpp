#include <algorithm>
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
					phase(0),
					stage(EnvelopeStage::ATTACK) {}

	public:
	float computeMultiplier(float f, int a, int d, float s, int r) {
		int phaseRatio = computePhaseRatio(f);
		if (++phase % phaseRatio != 0) {
			return multiplier;
		}

		switch (stage) {
			case EnvelopeStage::ATTACK: return computeAttackMultiplier(a);
			case EnvelopeStage::DECAY: return computeDecayMultiplier(s, d);
			case EnvelopeStage::SUSTAIN: return computeSustainLevel(s);
			case EnvelopeStage::RELEASE: return computeReleaseMultiplier(s, r);
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
		return max - static_cast<float>(tick) * ((max - min) / static_cast<float>(t));
	}

	float computeAttackMultiplier(int attackT) {
		multiplier = attackT <= 1 ? 1.f : computeLinearRampUp(0.f, 1.f, attackT);
		stage = computeNextStage(attackT);
		return multiplier;
	}

	float computeDecayMultiplier(float sustain, int decayT) {
		multiplier = multiplier <= sustain ? multiplier : computeLinearRampDown(multiplier, sustain, decayT);
		stage = computeNextStage(decayT);
		return multiplier;
	}

	float computeSustainLevel(float sustain) {
		return multiplier <= sustain ? multiplier : sustain;
	}

	float computeReleaseMultiplier(float sustain, int releaseT) {
		multiplier = computeLinearRampDown(computeSustainLevel(sustain), 0.f, releaseT);
		stage = computeNextStage(releaseT);
		return multiplier;
	}

	/**
	 * As t is divided by 2 as we increase f,
	 * time values need to be extended when f
	 * raises.
	 */
	int computePhaseRatio(float f) {
		if (f <= 128) return 1;
		if (128 < f && f <= 256) return 2;
		if (256 < f && f <= 512) return 4;
		if (512 < f && f <= 1024) return 8;
		if (1024 < f && f <= 2048) return 16;
		if (2048 < f && f <= 4096) return 32;
		if (4096 < f && f <= 8192) return 64;
		if (8192 < f && f <= 16384) return 128;
		return 256;
	}

	EnvelopeStage computeNextStage(int t) {
		if (stage == EnvelopeStage::RELEASE) {
			if (++tick >= t) {
				tick = 0;
				return EnvelopeStage::DONE;
			}
		}
		if (stage == EnvelopeStage::DECAY) {
			if (++tick >= t) {
				tick = 0;
				return EnvelopeStage::SUSTAIN;
			}
		}
		if (stage == EnvelopeStage::ATTACK) {
			if (++tick >= t) {
				tick = 0;
				return EnvelopeStage::DECAY;
			}
		}
		return stage; // SUSTAIN
	}

	private:
	EnvelopeStage stage;
	int tick;
	int phase;
	float multiplier;
};

class OscillatorKernel {
	public:
	void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
		float *outputBuffer = reinterpret_cast<float *>(outputPtr);
		float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

		bool hasConstantFrequency = sizeof(frequencyValues) == sizeof(frequencyValues[0]);

		for (unsigned channel = 0; channel < channelCount; ++channel) {
			float *channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

			for (auto i = 0; i < kRenderQuantumFrames; ++i) {
				float frequency = hasConstantFrequency ? frequencyValues[0] : frequencyValues[i];
				startIfNecessary(frequency);
				phaseIncrement = computePhaseIncrement(frequency);
				channelBuffer[i] = computeSample(frequency) * amplitude * amplitudeMultiplier;
				updatePhase(frequency);
				stopIfNecessary();
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

	void updatePhase(float frequency) {
		phase += phaseIncrement;
		if (phase >= TWO_PI) {
			amplitudeMultiplier = envelope.computeMultiplier(frequency, attackT, decayT, sustain, releaseT);
			phase -= TWO_PI;
		}
	}

	void startIfNecessary(float frequency) {
		if (state == OscillatorState::STARTING) {
			amplitudeMultiplier = envelope.computeMultiplier(frequency, attackT, decayT, sustain, releaseT);
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
	int attackT = 1;
	int decayT = 5;
	int releaseT = 5;
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
					.function("setAttack", &OscillatorKernel::setAttack)
					.function("setDecay", &OscillatorKernel::setDecay)
					.function("setSustain", &OscillatorKernel::setSustain)
					.function("setRelease", &OscillatorKernel::setRelease)
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