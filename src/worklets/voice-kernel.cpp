#include "envelope.cpp"
#include "filter.cpp"
#include "oscillator.cpp"
#include "range.cpp"
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

	float lfo1Frequency;
	float lfo1ModAmount;

	float lfo2Frequency;
	float lfo2ModAmount;

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

	SampleParameters &setLfo1Frequency(float newFrequency) {
		lfo1Frequency = newFrequency;
		return *this;
	}

	SampleParameters &setLfo1ModAmount(float newModAmount) {
		lfo1ModAmount = newModAmount;
		return *this;
	}

	SampleParameters &setLfo2Frequency(float newFrequency) {
		lfo2Frequency = newFrequency;
		return *this;
	}

	SampleParameters &setLfo2ModAmount(float newModAmount) {
		lfo2ModAmount = newModAmount;
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
	RESONANCE = 3
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
				sampleParameters
								.setFrequency(getCurrentValue(frequencyValues, i))
								.setOsc2Amplitude(getCurrentValue(osc2AmplitudeValues, i, midiRange, zeroOneRange))
								.setCutoff(getCurrentValue(cutoffValues, i, midiRange, cutoffRange))
								.setResonance(getCurrentValue(resonanceValues, i, midiRange, resonanceRange))
								.setLfo1Frequency(getCurrentValue(lfo1FrequencyValues, i, midiRange, lfoFrequencyRange))
								.setLfo1ModAmount(getCurrentValue(lfo1ModAmountValues, i, midiRange, zeroOneRange))
								.setLfo2Frequency(getCurrentValue(lfo2FrequencyValues, i, midiRange, lfoFrequencyRange))
								.setLfo2ModAmount(getCurrentValue(lfo2ModAmountValues, i, midiRange, zeroOneRange));

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
	void setLfo1Mode(Oscillator::Mode newMode) {
		lfo1.setMode(newMode);
	}

	public:
	void setLfo1ModAmount(uintptr_t lfoModAmountValuesPtr) {
		lfo1ModAmountValues = reinterpret_cast<float *>(lfoModAmountValuesPtr);
	}

	public:
	void setLfo1Frequency(uintptr_t lfoFrequencyValuesPtr) {
		lfo1FrequencyValues = reinterpret_cast<float *>(lfoFrequencyValuesPtr);
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
	void setLfo2ModAmount(uintptr_t lfoModAmountValuesPtr) {
		lfo2ModAmountValues = reinterpret_cast<float *>(lfoModAmountValuesPtr);
	}

	public:
	void setLfo2Frequency(uintptr_t lfoFrequencyValuesPtr) {
		lfo2FrequencyValues = reinterpret_cast<float *>(lfoFrequencyValuesPtr);
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
		float lfo1Mod = parameters.lfo1ModAmount * lfo1.nextSample(parameters.lfo1Frequency);
		float lfo2Mod = parameters.lfo2ModAmount * lfo2.nextSample(parameters.lfo2Frequency);
		float cutoffMod = cutoffEnvelopeAmount * cutoffEnvelope.nextLevel();

		applyLFO(parameters, lfo1Destination, lfo1Mod);
		applyLFO(parameters, lfo2Destination, lfo2Mod);
		parameters.cutoff = cutoffRange.clamp(parameters.cutoff + cutoffMod);
	}

	private:
	inline void applyLFO(SampleParameters &parameters, LfoDestination destination, float mod) {
		switch (destination) {
			case LfoDestination::FREQUENCY:
				parameters.frequency += mod * parameters.frequency;
				break;
			case LfoDestination::CUTOFF:
				parameters.cutoff = cutoffRange.clamp(parameters.cutoff + mod);
				break;
			case LfoDestination::RESONANCE:
				parameters.resonance = resonanceRange.clamp(parameters.resonance + mod);
				break;
			case LfoDestination::OSCILLATOR_MIX:
				parameters.osc2Amplitude = zeroOneRange.clamp(parameters.osc2Amplitude + mod);
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
	float *osc2AmplitudeValues;

	Oscillator::Kernel lfo1;
	LfoDestination lfo1Destination;
	float *lfo1FrequencyValues;
	float *lfo1ModAmountValues;

	Oscillator::Kernel lfo2;
	LfoDestination lfo2Destination;
	float *lfo2FrequencyValues;
	float *lfo2ModAmountValues;

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
					.function("setLfo1Frequency", &VoiceKernel::setLfo1Frequency)
					.function("setLfo1ModAmount", &VoiceKernel::setLfo1ModAmount)
					.function("setLfo1Mode", &VoiceKernel::setLfo1Mode)
					.function("setLfo1Destination", &VoiceKernel::setLfo1Destination)
					.function("setLfo2Frequency", &VoiceKernel::setLfo2Frequency)
					.function("setLfo2ModAmount", &VoiceKernel::setLfo2ModAmount)
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