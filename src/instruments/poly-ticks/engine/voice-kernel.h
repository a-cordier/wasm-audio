/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include "constants.h"
#include "dc-blocker.h"
#include "envelope.h"
#include "filter.h"
#include "oscillator.h"
#include "oversampling.h"
#include "range.h"
#include "sample-parameters.h"
#include "sub-oscillator.h"
#include "waveshaper.h"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <memory>

namespace wasm_audio {
namespace Voice {

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

	// How osc2 is derived from osc1. The mix knob keeps one meaning in every
	// routing — "how much of the second signal" — so a mix of 0 is always
	// plain osc1 and the LFO mix destination stays useful throughout.
	// MIX is 0 so a zero-initialised parameter block reproduces the original
	// crossfade behaviour.
	enum class OscRouting {
		MIX = 0,
		RING = 1,
		SYNC = 2,
		FM = 3,
	};

	struct StereoSample {
		float left = 0.f;
		float right = 0.f;
	};

	// Constant-power pan, normalised so that a centred signal passes through at
	// unit gain on both channels (rather than the usual -3dB), which keeps
	// pan 0 / width 0 identical to the original mono path.
	struct PanGains {
		float left = 1.f;
		float right = 1.f;
	};

	inline PanGains computePanGains(float position) {
		float theta = (position + 1.f) * Constants::quarterPi;
		return PanGains{
			Constants::sqrtTwo * std::cos(theta),
			Constants::sqrtTwo * std::sin(theta),
		};
	}

	struct ParameterBlock {
		float velocity;
		uint32_t osc1Mode;
		uint32_t osc2Mode;
		uint32_t filterMode;
		uint32_t lfo1Mode;
		uint32_t lfo1Destination;
		uint32_t lfo2Mode;
		uint32_t lfo2Destination;
		uintptr_t frequencyPtr;
		float amplitudeAttack;
		float amplitudeDecay;
		float amplitudeSustain;
		float amplitudeRelease;
		float osc1SemiShift;
		float osc1CentShift;
		float osc1Cycle;
		float osc2SemiShift;
		float osc2CentShift;
		float osc2Cycle;
		uintptr_t osc2AmplitudePtr;
		uintptr_t noiseLevelPtr;
		uintptr_t cutoffPtr;
		uintptr_t resonancePtr;
		uintptr_t drivePtr;
		float cutoffEnvelopeAmount;
		float cutoffEnvelopeVelocity;
		float cutoffEnvelopeAttack;
		float cutoffEnvelopeDecay;
		uintptr_t lfo1FrequencyPtr;
		uintptr_t lfo1ModAmountPtr;
		uintptr_t lfo2FrequencyPtr;
		uintptr_t lfo2ModAmountPtr;
		uint32_t oscRouting;
		float fmIndex;
		float subLevel;
		float stereoWidth;
		float pan;
	};

	class Kernel {
		public:
		// Initialiser order follows the member declaration order below.
		Kernel(float sampleRate, float renderFrames) :
			osc1(Oscillator::Kernel{ sampleRate }),
			osc2(Oscillator::Kernel{ sampleRate }),
			subOsc(sampleRate),
			lfo1(Oscillator::Kernel{ sampleRate }),
			lfo2(Oscillator::Kernel{ sampleRate }),
			amplitudeEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.5f, 0.5f, 0.9f }),
			filter(sampleRate),
			dcBlockerLeft(sampleRate),
			dcBlockerRight(sampleRate),
			cutoffEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.01f, 2.f, 0.f }),
			state(State::DISPOSED),
			sampleRate(sampleRate),
			renderFrames(renderFrames) {
			// Unit-amplitude LFOs (the house convention, matching monolog);
			// the mod-amount mapping is halved to compensate, so existing
			// presets keep their depth.
			lfo1.setAmplitude(1.f);
			lfo2.setAmplitude(1.f);
		}

		// Writes planar channels: channel n starts at outputPtr + n * renderFrames,
		// matching the layout the worklet reads back out of the WASM heap.
		void process(uintptr_t outputPtr, unsigned channelCount) {
			float *outputBuffer = reinterpret_cast<float *>(outputPtr);

			if (channelCount < 2) {
				for (unsigned sample = 0; sample < renderFrames; ++sample) {
					startIfNecessary();
					assignParameters(sample);
					StereoSample out = computeSample();
					outputBuffer[sample] = out.left + out.right;
					stopIfNecessary();
				}
				return;
			}

			float *leftChannel = outputBuffer;
			float *rightChannel = outputBuffer + renderFrames;

			for (unsigned sample = 0; sample < renderFrames; ++sample) {
				startIfNecessary();
				assignParameters(sample);
				StereoSample out = computeSample();
				leftChannel[sample] = out.left;
				rightChannel[sample] = out.right;
				stopIfNecessary();
			}
			for (unsigned channel = 2; channel < channelCount; ++channel) {
				float *source = (channel & 1u) ? rightChannel : leftChannel;
				float *channelBuffer = outputBuffer + channel * renderFrames;
				std::copy(source, source + renderFrames, channelBuffer);
			}
		}

		void setVelocity(float velocityValue) {
			velocity = zeroOneRange.map(velocityValue, midiRange);
		}

		void setParameters(uintptr_t blockPtr) {
			const ParameterBlock *block = reinterpret_cast<const ParameterBlock *>(blockPtr);

			// Perceptual velocity curve: linear velocity-to-gain leaves the
			// bottom half of the keybed nearly inaudible.
			velocity = std::pow(zeroOneRange.map(block->velocity, midiRange), 0.6f);

			osc1.setMode(static_cast<Oscillator::Mode>(block->osc1Mode));
			subOsc.setOsc1Mode(static_cast<Oscillator::Mode>(block->osc1Mode));
			osc2.setMode(static_cast<Oscillator::Mode>(block->osc2Mode));
			subOsc.setOsc2Mode(static_cast<Oscillator::Mode>(block->osc2Mode));
			filter.setMode(static_cast<Filter::Mode>(block->filterMode));
			setRouting(static_cast<OscRouting>(block->oscRouting));
			lfo1.setMode(static_cast<Oscillator::Mode>(block->lfo1Mode));
			lfo1Destination = static_cast<LfoDestination>(block->lfo1Destination);
			lfo2.setMode(static_cast<Oscillator::Mode>(block->lfo2Mode));
			lfo2Destination = static_cast<LfoDestination>(block->lfo2Destination);

			sampleParameters.frequencyValues = reinterpret_cast<float *>(block->frequencyPtr);
			sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(block->osc2AmplitudePtr);
			sampleParameters.noiseLevelValues = reinterpret_cast<float *>(block->noiseLevelPtr);
			sampleParameters.cutoffValues = reinterpret_cast<float *>(block->cutoffPtr);
			sampleParameters.resonanceValues = reinterpret_cast<float *>(block->resonancePtr);
			sampleParameters.driveValues = reinterpret_cast<float *>(block->drivePtr);
			sampleParameters.lfo1FrequencyValues = reinterpret_cast<float *>(block->lfo1FrequencyPtr);
			sampleParameters.lfo1ModAmountValues = reinterpret_cast<float *>(block->lfo1ModAmountPtr);
			sampleParameters.lfo2FrequencyValues = reinterpret_cast<float *>(block->lfo2FrequencyPtr);
			sampleParameters.lfo2ModAmountValues = reinterpret_cast<float *>(block->lfo2ModAmountPtr);

			sampleParameters.amplitudeEnvelopeAttack = attackRange.map(block->amplitudeAttack, midiRange);
			sampleParameters.amplitudeEnvelopeDecay = decayRange.map(block->amplitudeDecay, midiRange);
			sampleParameters.amplitudeEnvelopeSustain = zeroOneRange.map(block->amplitudeSustain, midiRange);
			sampleParameters.amplitudeEnvelopeRelease = releaseRange.map(block->amplitudeRelease, midiRange);
			sampleParameters.osc1SemiShift = semiShiftRange.map(block->osc1SemiShift, midiRange);
			sampleParameters.osc1CentShift = centShiftRange.map(block->osc1CentShift, midiRange);
			sampleParameters.osc1CycleBase = pulseWidthSafeRange.clamp(zeroOneRange.map(block->osc1Cycle, midiRange));
			sampleParameters.osc1Cycle = sampleParameters.osc1CycleBase;
			sampleParameters.osc2SemiShift = semiShiftRange.map(block->osc2SemiShift, midiRange);
			sampleParameters.osc2CentShift = centShiftRange.map(block->osc2CentShift, midiRange);
			sampleParameters.osc2CycleBase = pulseWidthSafeRange.clamp(zeroOneRange.map(block->osc2Cycle, midiRange));
			sampleParameters.osc2Cycle = sampleParameters.osc2CycleBase;
			sampleParameters.cutoffEnvelopeAmount = zeroOneRange.map(block->cutoffEnvelopeAmount, midiRange);
			sampleParameters.cutoffEnvelopeVelocity = zeroOneRange.map(block->cutoffEnvelopeVelocity, midiRange);
			sampleParameters.cutoffEnvelopeAttack = attackRange.map(block->cutoffEnvelopeAttack, midiRange);
			sampleParameters.cutoffEnvelopeDecay = decayRange.map(block->cutoffEnvelopeDecay, midiRange);

			fmIndex = fmIndexRange.map(block->fmIndex, midiRange);
			subLevel = zeroOneRange.map(block->subLevel, midiRange);

			// Pan positions only change per block, so the trigonometry stays out
			// of the per-sample path.
			float width = zeroOneRange.map(block->stereoWidth, midiRange);
			osc1Pan = computePanGains(-width);
			osc2Pan = computePanGains(width);
			voicePan = computePanGains(std::max(-1.f, std::min(1.f, block->pan)));
		}

		void setOsc1Mode(Oscillator::Mode newMode) {
			osc1.setMode(newMode);
			subOsc.setOsc1Mode(newMode);
		}

		void setOsc1SemiShift(float value) {
			sampleParameters.osc1SemiShift = semiShiftRange.map(value, midiRange);
		}

		void setOsc1CentShift(float value) {
			sampleParameters.osc1CentShift = centShiftRange.map(value, midiRange);
		}

		void setOsc1Cycle(float value) {
			sampleParameters.osc1CycleBase = pulseWidthSafeRange.clamp(zeroOneRange.map(value, midiRange));
			sampleParameters.osc1Cycle = sampleParameters.osc1CycleBase;
		}

		void setOsc2Mode(Oscillator::Mode newMode) {
			osc2.setMode(newMode);
			subOsc.setOsc2Mode(newMode);
		}

		void setOsc2SemiShift(float value) {
			sampleParameters.osc2SemiShift = semiShiftRange.map(value, midiRange);
		}

		void setOsc2CentShift(float value) {
			sampleParameters.osc2CentShift = centShiftRange.map(value, midiRange);
		}

		void setOsc2Cycle(float value) {
			sampleParameters.osc2CycleBase = pulseWidthSafeRange.clamp(zeroOneRange.map(value, midiRange));
			sampleParameters.osc2Cycle = sampleParameters.osc2CycleBase;
		}

		void setOsc2Amplitude(uintptr_t osc2AmplitudeValuesPtr) {
			sampleParameters.osc2AmplitudeValues = reinterpret_cast<float *>(osc2AmplitudeValuesPtr);
		}

		void setNoiseLevel(uintptr_t newLevelValuesPtr) {
			sampleParameters.noiseLevelValues = reinterpret_cast<float *>(newLevelValuesPtr);
		}

		void enterReleaseStage() {
			state = State::STOPPING;
			amplitudeEnvelope.enterReleaseStage();
		}

		void setAmplitudeAttack(float value) {
			sampleParameters.amplitudeEnvelopeAttack = attackRange.map(value, midiRange);
		}

		void setAmplitudeDecay(float value) {
			sampleParameters.amplitudeEnvelopeDecay = decayRange.map(value, midiRange);
		}

		void setAmplitudeSustain(float value) {
			sampleParameters.amplitudeEnvelopeSustain = zeroOneRange.map(value, midiRange);
		}

		void setAmplitudeRelease(float value) {
			sampleParameters.amplitudeEnvelopeRelease = releaseRange.map(value, midiRange);
		}

		void setFilterMode(Filter::Mode newFilterMode) {
			filter.setMode(newFilterMode);
		}

		void setCutoff(uintptr_t newCutoffValuesPtr) {
			sampleParameters.cutoffValues = reinterpret_cast<float *>(newCutoffValuesPtr);
		}

		void setResonance(uintptr_t newResonanceValuesPtr) {
			sampleParameters.resonanceValues = reinterpret_cast<float *>(newResonanceValuesPtr);
		}

		void setDrive(uintptr_t newDriveValuesPtr) {
			sampleParameters.driveValues = reinterpret_cast<float *>(newDriveValuesPtr);
		}

		void setCutoffEnvelopeAmount(float value) {
			sampleParameters.cutoffEnvelopeAmount = zeroOneRange.map(value, midiRange);
		}

		void setCutoffEnvelopeVelocity(float value) {
			sampleParameters.cutoffEnvelopeVelocity = zeroOneRange.map(value, midiRange);
		}

		void setCutoffEnvelopeAttack(float value) {
			sampleParameters.cutoffEnvelopeAttack = attackRange.map(value, midiRange);
		}

		void setCutoffEnvelopeDecay(float value) {
			sampleParameters.cutoffEnvelopeDecay = decayRange.map(value, midiRange);
		}

		void setLfo1Mode(Oscillator::Mode newMode) {
			lfo1.setMode(newMode);
		}

		void setLfo1ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo1ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		void setLfo1Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo1FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		void setLfo1Destination(LfoDestination newLfoDestination) {
			lfo1Destination = newLfoDestination;
		}

		void setLfo2Mode(Oscillator::Mode newMode) {
			lfo2.setMode(newMode);
		}

		void setLfo2ModAmount(uintptr_t newLfoModAmountValuesPtr) {
			sampleParameters.lfo2ModAmountValues = reinterpret_cast<float *>(newLfoModAmountValuesPtr);
		}

		void setLfo2Frequency(uintptr_t newLfoFrequencyValuesPtr) {
			sampleParameters.lfo2FrequencyValues = reinterpret_cast<float *>(newLfoFrequencyValuesPtr);
		}

		void setLfo2Destination(LfoDestination newLfoDestination) {
			lfo2Destination = newLfoDestination;
		}

		bool isStopped() {
			return state == State::STOPPED;
		}

		void reset() {
			reset(0.f);
		}

		// Re-attack a voice that is still audibly sounding (same-note repress,
		// mono retrigger, voice steal): the envelopes restart from their
		// CURRENT level and every phase-carrying state (oscillators, filter,
		// DC blockers) is left untouched, so the waveform stays continuous
		// instead of clicking to zero. A full reset() is for silent voices.
		void retrigger() {
			amplitudeEnvelope.enterAttackStage();
			cutoffEnvelope.enterAttackStage();
			state = State::STARTED;
		}

		// drift scales how far every phase is randomised on note-on.
		// At 0 each note starts from an identical state, which keeps transients
		// repeatable and percussive; at 1 the voices of a chord no longer start
		// phase-locked, which is what stops held chords sounding static.
		void reset(float drift) {
			osc1.reset(drift * osc1.randomPhase());
			osc2.reset(drift * osc2.randomPhase());
			lfo1.reset(drift * lfo1.randomPhase());
			lfo2.reset(drift * lfo2.randomPhase());
			subOsc.reset(drift);
			noise.reset();
			filter.reset();
			decimatorLeft.reset();
			decimatorRight.reset();
			dcBlockerLeft.reset();
			dcBlockerRight.reset();
			amplitudeEnvelope.reset();
			cutoffEnvelope.reset();
			state = State::DISPOSED;
		}

		private:
		void setRouting(OscRouting newRouting) {
			if (newRouting == routing) return;
			routing = newRouting;
			// Oversampled routings synthesise at 2x; the sub oscillator is left
			// at the base rate since it is already band-limited.
			float oscSampleRate = (routing == OscRouting::MIX) ? sampleRate : sampleRate * 2.f;
			osc1.setSampleRate(oscSampleRate);
			osc2.setSampleRate(oscSampleRate);
			decimatorLeft.reset();
			decimatorRight.reset();
		}

		void assignParameters(unsigned int sampleCursor) {
			sampleParameters.fetchValues(sampleCursor);
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

		StereoSample computeSample() {
			StereoSample raw = computeRawSample();

			float filteredLeft = 0.f;
			float filteredRight = 0.f;
			filter.nextSample(raw.left, raw.right,
			                  sampleParameters.cutoff, sampleParameters.resonance,
			                  filteredLeft, filteredRight);

			float shapedLeft = Waveshaper::softClip(filteredLeft, sampleParameters.overdrive);
			float shapedRight = Waveshaper::softClip(filteredRight, sampleParameters.overdrive);

			float cleanLeft = dcBlockerLeft.process(shapedLeft);
			float cleanRight = dcBlockerRight.process(shapedRight);

			// voiceGain: 16 voices sum with no other attenuation, so dense
			// chords clipped the output stage hard at drive 0. -6 dB per voice
			// keeps an 8-note chord inside the rails.
			float gain = velocity * amplitudeEnvelope.nextLevel() * PolyTicksConstants::voiceGain;
			return StereoSample{
				cleanLeft * gain * voicePan.left,
				cleanRight * gain * voicePan.right,
			};
		}

		StereoSample computeRawSample() {
			StereoSample pair = (routing == OscRouting::MIX)
				? computeOscPair()
				: computeOversampledOscPair();

			// Sub and noise stay centred: a mono low end is what makes the
			// stereo field read as wide rather than smeared.
			float noiseSample = noise.nextSample() * sampleParameters.noiseLevel;
			subOsc.setOsc2Amplitude(sampleParameters.osc2Amplitude);
			float subOscSample = subOsc.nextSample(sampleParameters.frequency) * subLevel;
			float centre = subOscSample + noiseSample;

			float headroom = 1.f - subLevel;
			return StereoSample{
				headroom * pair.left + centre,
				headroom * pair.right + centre,
			};
		}

		// Ring modulation, hard sync and phase modulation all generate content
		// well above Nyquist, so in those routings the oscillators run at twice
		// the sample rate and each channel is decimated back down.
		StereoSample computeOversampledOscPair() {
			StereoSample first = computeOscPair();
			StereoSample second = computeOscPair();
			return StereoSample{
				decimatorLeft.decimate(first.left, second.left),
				decimatorRight.decimate(first.right, second.right),
			};
		}

		StereoSample computeOscPair() {
			float frequency = sampleParameters.frequency;
			float osc1Sample = osc1.nextSample(frequency);
			float osc2Sample = 0.f;

			switch (routing) {
				case OscRouting::MIX:
					osc2Sample = osc2.nextSample(frequency);
					break;
				case OscRouting::RING:
					// x2 compensates for the product of two half-scale oscillators.
					osc2Sample = 2.f * osc1Sample * osc2.nextSample(frequency);
					break;
				case OscRouting::SYNC:
					osc2Sample = osc2.nextSample(frequency);
					if (osc1.didWrap()) {
						osc2.syncPhase(osc1.wrapFraction());
					}
					break;
				case OscRouting::FM:
					osc2Sample = osc2.nextSample(frequency, osc1Sample * fmIndex);
					break;
			}

			// mix 0 is always the routing's primary output. For MIX, RING and
			// SYNC that is osc1. For FM it is the carrier: the raw modulator is
			// not a useful sound on its own, so the roles swap and mix blends
			// the modulator back in rather than out.
			float primary = osc1Sample;
			float secondary = osc2Sample;
			if (routing == OscRouting::FM) {
				primary = osc2Sample;
				secondary = osc1Sample;
			}

			float a = primary * sampleParameters.osc1Amplitude;
			float b = secondary * sampleParameters.osc2Amplitude;

			// Opposing pan positions on the two oscillators: combined with the
			// osc2 cent detune this buys real stereo width without a second
			// oscillator pair. At width 0 both gains are 1 and this collapses
			// back to the original mono sum.
			return StereoSample{
				a * osc1Pan.left + b * osc2Pan.left,
				a * osc1Pan.right + b * osc2Pan.right,
			};
		}

		void applyModulations() {
			float lfo1Mod = sampleParameters.lfo1ModAmount * lfo1.nextSample(sampleParameters.lfo1Frequency);
			float lfo2Mod = sampleParameters.lfo2ModAmount * lfo2.nextSample(sampleParameters.lfo2Frequency);
			// CUT VEL scales the envelope's depth by velocity rather than
			// adding a constant offset — a static filter opening is not
			// velocity sensitivity.
			float velAmount = sampleParameters.cutoffEnvelopeVelocity;
			float cutoffMod = sampleParameters.cutoffEnvelopeAmount
				* (1.f - velAmount + velAmount * velocity)
				* cutoffEnvelope.nextLevel();
			applyLFO(lfo1Destination, lfo1Mod);
			applyLFO(lfo2Destination, lfo2Mod);
			sampleParameters.cutoff = cutoffRange.clamp(sampleParameters.cutoff + cutoffMod);
			// Re-derive the crossfade AFTER modulation: an LFO on the mix
			// otherwise amplitude-modulates osc2 over a stale osc1 instead of
			// crossfading, and the total level pumps.
			sampleParameters.osc1Amplitude = 1.f - sampleParameters.osc2Amplitude;
		}

		void applyLFO(LfoDestination destination, float mod) {
			switch (destination) {
				case LfoDestination::FREQUENCY:
					// Exponential (semitone) pitch modulation: the old linear
					// form swung -12/+7 semitones from the same excursion and
					// could reach 0 Hz. +/-7 semitones at full depth.
					sampleParameters.frequency *= std::exp2(mod * (7.f / 12.f));
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
					sampleParameters.osc1Cycle = pulseWidthSafeRange.clamp(sampleParameters.osc1Cycle + mod);
					break;
				case LfoDestination::OSC2_CYCLE:
					sampleParameters.osc2Cycle = pulseWidthSafeRange.clamp(sampleParameters.osc2Cycle + mod);
					break;
			}
		}

		void startIfNecessary() {
			if (state == State::DISPOSED) {
				amplitudeEnvelope.enterAttackStage();
				cutoffEnvelope.enterAttackStage();
				state = State::STARTED;
			}
		}

		void stopIfNecessary() {
			if (state == State::STOPPING && amplitudeEnvelope.isDone()) {
				state = State::STOPPED;
			}
		}

		Oscillator::Kernel osc1;
		Oscillator::Kernel osc2;
		Oscillator::NoiseKernel noise;
		SubOsc subOsc;

		Oscillator::Kernel lfo1;
		LfoDestination lfo1Destination = LfoDestination::FREQUENCY;

		Oscillator::Kernel lfo2;
		LfoDestination lfo2Destination = LfoDestination::FREQUENCY;

		Envelope::Kernel amplitudeEnvelope;

		Filter::SVFStereoKernel filter;
		DCBlocker dcBlockerLeft;
		DCBlocker dcBlockerRight;

		HalfBandDecimator decimatorLeft;
		HalfBandDecimator decimatorRight;

		Envelope::Kernel cutoffEnvelope;

		State state;

		SampleParameters sampleParameters;

		OscRouting routing = OscRouting::MIX;
		float fmIndex = 0.f;
		float subLevel = PolyTicksConstants::subOscPresence;
		PanGains osc1Pan;
		PanGains osc2Pan;
		PanGains voicePan;

		float sampleRate;
		unsigned renderFrames;
		float velocity = 1.f;
	};

} // namespace Voice
} // namespace wasm_audio
