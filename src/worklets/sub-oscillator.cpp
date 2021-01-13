#pragma once

#include "oscillator.cpp"

class SubOsc {
	public:
	SubOsc(float sampleRate) :
		osc1(Oscillator::Kernel{ sampleRate }),
		osc2(Oscillator::Kernel{ sampleRate }) {}

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
	void setOsc1Cycle(float newCycle) {
		osc1.setDutyCycle(newCycle);
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
	void setOsc2Cycle(float newCycle) {
		osc2.setDutyCycle(newCycle);
	}

	public:
	void setOsc2Amplitude(float newOsc2Amplitude) {
		osc2Amplitude = newOsc2Amplitude;
	}

	public:
	void reset() {
		osc1.reset();
		osc2.reset();
	}

	private:
	Oscillator::Kernel osc1;
	Oscillator::Kernel osc2;
	float osc2Amplitude;
};