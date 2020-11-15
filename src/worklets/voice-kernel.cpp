#include "envelope.cpp"
#include "filter.cpp"
#include "oscillator.cpp"
#include "range.cpp"
#include "sample-parameters.cpp"
#include <algorithm>
#include <bitset>
#include <cmath>
#include <memory>

#include "emscripten/bind.h"

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
		osc2Amplitude = newOsc2Amplitude;
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;
	float osc2Amplitude;
};

enum class LfoDestination {
	FREQUENCY = 0,
	OSCILLATOR_MIX = 1,
	CUTOFF = 2,
	RESONANCE = 3
};

class VoiceKernel {
	public:
	VoiceKernel() :
		amplitudeEnvelope(Envelope::Kernel{ 1.f, 0.f, 0.5f, 0.5f, 0.9f }),
		cutoffEnvelope(Envelope::Kernel{ 1.f, 0.f, 0.01f, 2.f, 0.f }),
		state(VoiceState::DISPOSED) {
	}

	public:
	void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr) {
		float *outputBuffer = reinterpret_cast<float *>(outputPtr);
		float *frequencyValues = reinterpret_cast<float *>(frequencyValuesPtr);

		for (unsigned channel = 0; channel < channelCount; ++channel) {
			float *channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

			for (auto sample = 0; sample < kRenderQuantumFrames; ++sample) {
				startIfNecessary();
				preCompute(frequencyValues, sample);
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
	void setOsc2Amplitude(uintptr_t osc2AmplitudeValuesPtr) {
		sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(osc2AmplitudeValuesPtr);
	}

	public:
	void enterReleaseStage() {
		state = VoiceState::STOPPING;
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
		filter.setMode(newFilterMode);
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
		return state == VoiceState::STOPPED;
	}

	private:
	inline void preCompute(float *frequencyValues, unsigned int sampleCursor) {
		sampleParameters.withFrequencyValues(frequencyValues).fetchValues(sampleCursor);
		osc1.setSemiShift(sampleParameters.osc1SemiShift);
		subOsc.setOsc1SemiShift(sampleParameters.osc1SemiShift);
		osc1.setCentShift(sampleParameters.osc1CentShift);
		subOsc.setOsc1CentShift(sampleParameters.osc1CentShift);
		osc2.setSemiShift(sampleParameters.osc2SemiShift);
		subOsc.setOsc2SemiShift(sampleParameters.osc2SemiShift);
		osc2.setCentShift(sampleParameters.osc2CentShift);
		subOsc.setOsc2CentShift(sampleParameters.osc2CentShift);
		amplitudeEnvelope.setAttackTime(sampleParameters.amplitudeEnvelopeAttack);
		amplitudeEnvelope.setDecayTime(sampleParameters.amplitudeEnvelopeDecay);
		amplitudeEnvelope.setSustainLevel(sampleParameters.amplitudeEnvelopeSustain);
		amplitudeEnvelope.setReleaseTime(sampleParameters.amplitudeEnvelopeRelease);
		cutoffEnvelope.setAttackTime(sampleParameters.cutoffEnvelopeAttack);
		cutoffEnvelope.setDecayTime(sampleParameters.cutoffEnvelopeDecay);
		applyModulations();
	}

	private:
	inline float computeSample() {
		float rawSample = computeRawSample();
		return filter.nextSample(rawSample, sampleParameters.cutoff, sampleParameters.resonance);
	}

	private:
	inline float computeRawSample() {
		static constexpr float subOscPresence = 0.4f;
		static constexpr float finalAmplitude = 0.5f;

		float osc1Sample = osc1.nextSample(sampleParameters.frequency) * sampleParameters.osc1Amplitude;
		float osc2Sample = osc2.nextSample(sampleParameters.frequency) * sampleParameters.osc2Amplitude;
		subOsc.setOsc2Amplitude(sampleParameters.osc2Amplitude);
		float subOscSample = subOsc.nextSample(sampleParameters.frequency);
		float rawSample = (1 - subOscPresence) * (osc1Sample + osc2Sample) + subOscPresence * subOscSample;
		return rawSample * amplitudeEnvelope.nextLevel() * finalAmplitude;
	}

	private:
	inline void applyModulations() {
		float lfo1Mod = sampleParameters.lfo1ModAmount * lfo1.nextSample(sampleParameters.lfo1Frequency);
		float lfo2Mod = sampleParameters.lfo2ModAmount * lfo2.nextSample(sampleParameters.lfo2Frequency);
		float cutoffMod = sampleParameters.cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();
		applyLFO(lfo1Destination, lfo1Mod);
		applyLFO(lfo2Destination, lfo2Mod);
		sampleParameters.cutoff = cutoffRange.clamp(sampleParameters.cutoff + cutoffMod);
	}

	private:
	inline void applyLFO(LfoDestination destination, float mod) {
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
		}
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

	Oscillator::Kernel lfo1;
	LfoDestination lfo1Destination;

	Oscillator::Kernel lfo2;
	LfoDestination lfo2Destination;

	Envelope::Kernel amplitudeEnvelope;

	Filter::Kernel filter;
	Envelope::Kernel cutoffEnvelope;

	VoiceState state;

	SampleParameters sampleParameters;

	float sampleRate = 44100.f;
};

EMSCRIPTEN_BINDINGS(CLASS_VoiceKernel) {
	class_<VoiceKernel>("VoiceKernel")
					.smart_ptr_constructor("VoiceKernel", &std::make_shared<VoiceKernel>)
					.function("process", &VoiceKernel::process, allow_raw_pointers())
					.function("setOsc1Mode", &VoiceKernel::setOsc1Mode)
					.function("setOsc1SemiShift", &VoiceKernel::setOsc1SemiShift, allow_raw_pointers())
					.function("setOsc1CentShift", &VoiceKernel::setOsc1CentShift, allow_raw_pointers())
					.function("setOsc2Mode", &VoiceKernel::setOsc2Mode)
					.function("setOsc2SemiShift", &VoiceKernel::setOsc2SemiShift, allow_raw_pointers())
					.function("setOsc2CentShift", &VoiceKernel::setOsc2CentShift, allow_raw_pointers())
					.function("setOsc2Amplitude", &VoiceKernel::setOsc2Amplitude, allow_raw_pointers())
					.function("setAmplitudeAttack", &VoiceKernel::setAmplitudeAttack, allow_raw_pointers())
					.function("setAmplitudeDecay", &VoiceKernel::setAmplitudeDecay, allow_raw_pointers())
					.function("setAmplitudeSustain", &VoiceKernel::setAmplitudeSustain, allow_raw_pointers())
					.function("setAmplitudeRelease", &VoiceKernel::setAmplitudeRelease, allow_raw_pointers())
					.function("setFilterMode", &VoiceKernel::setFilterMode)
					.function("setCutoff", &VoiceKernel::setCutoff, allow_raw_pointers())
					.function("setResonance", &VoiceKernel::setResonance, allow_raw_pointers())
					.function("setCutoffEnvelopeAmount", &VoiceKernel::setCutoffEnvelopeAmount, allow_raw_pointers())
					.function("setCutoffEnvelopeAttack", &VoiceKernel::setCutoffEnvelopeAttack, allow_raw_pointers())
					.function("setCutoffEnvelopeDecay", &VoiceKernel::setCutoffEnvelopeDecay, allow_raw_pointers())
					.function("setLfo1Frequency", &VoiceKernel::setLfo1Frequency, allow_raw_pointers())
					.function("setLfo1ModAmount", &VoiceKernel::setLfo1ModAmount, allow_raw_pointers())
					.function("setLfo1Mode", &VoiceKernel::setLfo1Mode)
					.function("setLfo1Destination", &VoiceKernel::setLfo1Destination)
					.function("setLfo2Frequency", &VoiceKernel::setLfo2Frequency, allow_raw_pointers())
					.function("setLfo2ModAmount", &VoiceKernel::setLfo2ModAmount, allow_raw_pointers())
					.function("setLfo2Mode", &VoiceKernel::setLfo2Mode)
					.function("setLfo2Destination", &VoiceKernel::setLfo2Destination)
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
					.value("RESONANCE", LfoDestination::RESONANCE);
}