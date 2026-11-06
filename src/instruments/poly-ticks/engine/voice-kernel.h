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
#include "lfo.h"
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
		// Tempo sync (appended): per-block absolute master-clock phase +
		// per-sample increment per LFO, identical for every voice — which
		// is exactly what makes a chord's synced LFOs phase-coherent.
		uint32_t lfo1Synced;
		float lfo1SyncPhase01;
		float lfo1SyncInc;
		float lfo1SyncHz;
		uint32_t lfo2Synced;
		float lfo2SyncPhase01;
		float lfo2SyncInc;
		float lfo2SyncHz;
	};

	class Kernel {
		public:
		// Initialiser order follows the member declaration order below.
		Kernel(float sampleRate, float renderFrames) :
			osc1(Oscillator::Kernel{ sampleRate }),
			osc2(Oscillator::Kernel{ sampleRate }),
			subOsc(sampleRate),
			// LFOKernel (shared with monolog, dsp/lfo.h): unit amplitude by
			// construction — the mod-amount mapping is halved to compensate,
			// so existing presets keep their depth — NOISE is true
			// sample-and-hold, and nextSampleAt is the tempo-sync path.
			lfo1(sampleRate),
			lfo2(sampleRate),
			amplitudeEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.5f, 0.5f, 0.9f }),
			filter(sampleRate),
			dcBlockerLeft(sampleRate),
			dcBlockerRight(sampleRate),
			cutoffEnvelope(Envelope::Kernel{ sampleRate, 1.f, 0.f, 0.01f, 2.f, 0.f }),
			state(State::DISPOSED),
			sampleRate(sampleRate),
			renderFrames(renderFrames) {}

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
			// Synced LFO phase re-seeds from the clock every block (absolute
			// readout, never an accumulator) and advances per sample below.
			lfo1Synced = block->lfo1Synced != 0;
			lfo1SyncPhase = block->lfo1SyncPhase01;
			lfo1SyncInc = block->lfo1SyncInc;
			lfo1SyncHz = block->lfo1SyncHz;
			lfo2Synced = block->lfo2Synced != 0;
			lfo2SyncPhase = block->lfo2SyncPhase01;
			lfo2SyncInc = block->lfo2SyncInc;
			lfo2SyncHz = block->lfo2SyncHz;

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
			lastEnvLevel = 1.f;
			silentSamples = 0;
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
			lastEnvLevel = 1.f;
			silentSamples = 0;
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

			// voiceGain: per-voice headroom, working with the ENGINE's
			// 1/sqrt(N) polyphony compensation on the sum (synth-engine.h) —
			// together they keep dense chords inside the rails without
			// starving single notes.
			float envLevel = amplitudeEnvelope.nextLevel();
			lastEnvLevel = envLevel;
			float gain = velocity * envLevel * PolyTicksConstants::voiceGain;
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
			// The sub is two full band-limited oscillators — skip them entirely
			// while it is silent (phase continuity is irrelevant to a crossfaded
			// sub that re-enters against already-free-running mains).
			float subOscSample = 0.f;
			if (subLevel > 0.f) {
				subOsc.setOsc2Amplitude(sampleParameters.osc2Amplitude);
				subOscSample = subOsc.nextSample(sampleParameters.frequency) * subLevel;
			}
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
			// Synced: the phase is forced from the master clock (advanced per
			// sample from the block-start seed), so every voice of a chord
			// wobbles together on the shared downbeat and PHASE_DRIFT's
			// randomised LFO start phases are naturally inert.
			float lfo1Raw;
			if (lfo1Synced) {
				lfo1Raw = lfo1.nextSampleAt(lfo1SyncPhase, lfo1SyncHz);
				lfo1SyncPhase += lfo1SyncInc;
				if (lfo1SyncPhase >= 1.f) lfo1SyncPhase -= 1.f;
			} else {
				lfo1Raw = lfo1.nextSample(sampleParameters.lfo1Frequency);
			}
			float lfo2Raw;
			if (lfo2Synced) {
				lfo2Raw = lfo2.nextSampleAt(lfo2SyncPhase, lfo2SyncHz);
				lfo2SyncPhase += lfo2SyncInc;
				if (lfo2SyncPhase >= 1.f) lfo2SyncPhase -= 1.f;
			} else {
				lfo2Raw = lfo2.nextSample(sampleParameters.lfo2Frequency);
			}
			float lfo1Mod = sampleParameters.lfo1ModAmount * lfo1Raw;
			float lfo2Mod = sampleParameters.lfo2ModAmount * lfo2Raw;
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
			// A held note whose envelope has decayed to effective silence
			// (sustain ~0) otherwise renders at full cost forever. 50 ms of
			// sustained silence retires the voice; the engine's normal
			// allocation paths take over from there.
			if (state == State::STARTED && lastEnvLevel < 1e-5f) {
				if (++silentSamples > static_cast<int>(sampleRate * 0.05f)) {
					state = State::STOPPED;
				}
			} else {
				silentSamples = 0;
			}
		}

		Oscillator::Kernel osc1;
		Oscillator::Kernel osc2;
		Oscillator::NoiseKernel noise;
		SubOsc subOsc;

		LFOKernel lfo1;
		LfoDestination lfo1Destination = LfoDestination::FREQUENCY;
		bool lfo1Synced = false;
		float lfo1SyncPhase = 0.f;
		float lfo1SyncInc = 0.f;
		float lfo1SyncHz = 1.f;

		LFOKernel lfo2;
		LfoDestination lfo2Destination = LfoDestination::FREQUENCY;
		bool lfo2Synced = false;
		float lfo2SyncPhase = 0.f;
		float lfo2SyncInc = 0.f;
		float lfo2SyncHz = 1.f;

		Envelope::Kernel amplitudeEnvelope;

		Filter::SVFStereoKernel filter;
		DCBlocker dcBlockerLeft;
		DCBlocker dcBlockerRight;

		HalfBandDecimator decimatorLeft;
		HalfBandDecimator decimatorRight;

		Envelope::Kernel cutoffEnvelope;

		State state;
		float lastEnvLevel = 1.f;
		int silentSamples = 0;

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
