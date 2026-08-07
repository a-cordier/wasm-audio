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
#include "waveshaper.h"
#include <algorithm>
#include <cmath>
#include <cstdint>

namespace wasm_audio {
namespace Monolog {

	enum class FilterModel {
		MOOG = 0,
		ACID = 1,
		SCREAM = 2,
		KORG = 3,
	};

	enum class LfoDestination {
		PITCH = 0,
		CUTOFF = 1,
		PULSE_WIDTH = 2,
	};

	enum class VoiceState {
		DISPOSED,
		STARTED,
		STOPPING,
		STOPPED,
	};

	class Voice {
	public:
		Voice(float sampleRate) :
			sampleRate(sampleRate),
			smoothAlpha(1.0f - std::exp(-1.0f / (0.010f * sampleRate))),
			osc(sampleRate),
			osc2(sampleRate),
			subOsc(sampleRate),
			noise(),
			moogFilter(sampleRate),
			diodeFilter(sampleRate),
			screamerFilter(sampleRate),
			korgFilter(sampleRate),
			lfo(sampleRate),
			dcBlocker(sampleRate),
			ampEnv(sampleRate, 1.f, 0.f, 0.01f, 0.3f, 0.5f),
			// 50 ms filter-env release: with 0 the cutoff modulation vanished in
			// one sample at note-off — an audible timbre snap while the amp
			// release was still sounding. (No FILTER RELEASE param exists.)
			filterEnv(sampleRate, 1.f, 0.f, 0.01f, 0.5f, 0.05f),
			state(VoiceState::DISPOSED) {
			osc.setAmplitude(1.0f);
			osc2.setAmplitude(1.0f);
			subOsc.setAmplitude(1.0f);
			// Osc mode / sub octave / wave / detune are all param-driven (set every
			// block in Engine::applyParams), so nothing is hard-coded here.
			moogFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			diodeFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			screamerFilter.setMode(Filter::Mode::LOWPASS_PLUS);
			korgFilter.setMode(Filter::Mode::LOWPASS_PLUS);
		}

		float processSample(float frequency, float velocity) {

			// One-pole smoothing (~10 ms) between the block-rate param targets
			// and the audio path: raw 0-127 knob/CC steps otherwise land as
			// ~semitone cutoff jumps and audible gain steps at every 128-sample
			// boundary. A fresh voice snaps straight to its targets so note
			// attacks stay percussive.
			if (snapSmoothing) {
				sCutoff = cutoffBase;
				sResonance = resonance;
				sDrive = drive;
				sSubLevel = subLevel;
				sNoiseLevel = noiseLevel;
				sPulseWidth = pulseWidthBase;
				sLfoAmount = lfoAmount;
				sVelocity = velocity;
				snapSmoothing = false;
			}
			sCutoff = smoothStep(sCutoff, cutoffBase, smoothAlpha);
			sResonance = smoothStep(sResonance, resonance, smoothAlpha);
			sDrive = smoothStep(sDrive, drive, smoothAlpha);
			sSubLevel = smoothStep(sSubLevel, subLevel, smoothAlpha);
			sNoiseLevel = smoothStep(sNoiseLevel, noiseLevel, smoothAlpha);
			sPulseWidth = smoothStep(sPulseWidth, pulseWidthBase, smoothAlpha);
			sLfoAmount = smoothStep(sLfoAmount, lfoAmount, smoothAlpha);
			sVelocity = smoothStep(sVelocity, velocity, smoothAlpha);

			// LFO with per-note fade-in (delay): lfoFade ramps 0 -> 1 over the
			// delay time so the modulation blooms in after the note starts.
			lfoFade = std::min(lfoFade + lfoFadeInc, 1.0f);
			float lfoMod = sLfoAmount * lfoFade * lfo.nextSample(lfoRate);
			applyLfo(lfoMod, frequency);

			osc.setDutyCycle(pulseWidth);
			osc2.setDutyCycle(pulseWidth);
			// Detuned unison: a second main oscillator offset by a few cents. At
			// detune 0 the two are bit-identical, so osc2 is skipped outright —
			// same output, half the oscillator cost (they are detuned anyway
			// when it re-enters, so its stale phase is irrelevant).
			float oscOut = (detuneCents == 0.f)
				? osc.nextSample(frequency)
				: 0.5f * (osc.nextSample(frequency) + osc2.nextSample(frequency));
			float subOut = (sSubLevel > 0.f) ? subOsc.nextSample(frequency) * sSubLevel : 0.f;
			float noiseOut = noise.nextSample() * sNoiseLevel;
			// Deliberately unnormalised. The sum can exceed unity and push the
			// filter models into their own input saturators, and that overload
			// is where a lot of monolog's loudness and grit comes from.
			float mix = oscOut + subOut + noiseOut;

			// Pre-filter wavefolder ("dirt"), run at 2x. The piecewise-linear
			// foldback has unbounded bandwidth, and at 1x its products reflect
			// straight back into the audio band as inharmonic grit that no
			// downstream lowpass can remove. The dry/wet blend happens INSIDE
			// the oversampler so both paths share its small group delay (a
			// dry path outside would comb against the delayed wet one).
			if (dirtAmount > 0.f) {
				float threshold = 1.0f - 0.6f * dirtAmount;               // 1.0 -> 0.4
				mix = dirtOversampler.process(mix, [&](float s) {
					float safe = std::clamp(s, -4.f, 4.f);                // bound foldback's loop
					float folded = Waveshaper::foldback(safe, threshold) * (1.0f + 0.5f * dirtAmount);
					return (1.0f - dirtAmount) * s + dirtAmount * folded; // crossfade blend
				});
			}

			float filterEnvMod = filterEnvAmount * filterEnv.nextLevel();
			float velMod = sVelocity * filterEnvVelocity;
			// 303-style accent: a per-note boost keyed on high velocity (sequencer
			// steps clear the threshold; the keyboards send a fixed velocity).
			// Rides the smoothed velocity, so retriggers glide instead of stepping.
			float accent = accentAmount * zeroOneRange.clamp((sVelocity - ACCENT_VEL_THRESH) / (1.0f - ACCENT_VEL_THRESH));
			float modulatedCutoff = cutoffRange.clamp(cutoff + filterEnvMod + velMod + accent * ACCENT_CUTOFF);

			// Drive follows the smoothed value per sample; setDrive only stores
			// the target now, so the kernel's drive is set here.
			float filterDrive = 1.0f + sDrive * 2.5f;

			float filtered;
			switch (filterModel) {
				case FilterModel::ACID:
					diodeFilter.setDrive(filterDrive);
					filtered = diodeFilter.nextSample(mix, modulatedCutoff, sResonance);
					break;
				case FilterModel::SCREAM:
					screamerFilter.setDrive(filterDrive);
					filtered = screamerFilter.nextSample(mix, modulatedCutoff, sResonance);
					break;
				case FilterModel::KORG:
					korgFilter.setDrive(filterDrive);
					filtered = korgFilter.nextSample(mix, modulatedCutoff, sResonance);
					break;
				case FilterModel::MOOG:
				default:
					moogFilter.setDrive(filterDrive);
					filtered = moogFilter.nextSample(mix, modulatedCutoff, sResonance);
					break;
			}

			// The saturator sits ahead of the VCA on purpose: it compresses the
			// filter output on every note, and that compression is a good part
			// of the density and perceived loudness of the instrument.
			float shaped = Waveshaper::tanhLimit(filtered, 1.0f + sDrive * 1.5f);
			float clean = dcBlocker.process(shaped);
			float ampLevel = ampEnv.nextLevel();

			stopIfNecessary();

			return clean * sVelocity * ampLevel * (1.0f + accent * ACCENT_AMP);
		}

		void noteOn() {
			ampEnv.enterAttackStage();
			filterEnv.enterAttackStage();
			lfoFade = 0.0f;
			state = VoiceState::STARTED;
		}

		void noteOff() {
			ampEnv.enterReleaseStage();
			filterEnv.enterReleaseStage();
			state = VoiceState::STOPPING;
		}

		// Re-attack while still audibly sounding (non-legato retrigger): the
		// envelopes restart from their CURRENT level and the oscillator/filter
		// state is left untouched, so the waveform stays continuous instead of
		// clicking to zero. A full reset() is for a voice that is silent.
		void retrigger() {
			if (lfoKeySync) lfo.reset();
			ampEnv.enterAttackStage();
			filterEnv.enterAttackStage();
			lfoFade = 0.0f;
			state = VoiceState::STARTED;
		}

		bool isStopped() const { return state == VoiceState::STOPPED; }
		bool isActive() const { return state == VoiceState::STARTED || state == VoiceState::STOPPING; }

		// Key sync means "the LFO phase locks to note starts" — every note-on,
		// legato included. The delay fade only re-arms on retriggered notes.
		void syncLfoToNote() {
			if (lfoKeySync) lfo.reset();
		}

		void reset() {
			osc.reset();
			osc2.reset();
			subOsc.reset();
			moogFilter.reset();
			diodeFilter.reset();
			screamerFilter.reset();
			korgFilter.reset();
			// Key sync on = LFO phase retriggers with the note; off = free-running.
			if (lfoKeySync) lfo.reset();
			dirtOversampler.reset();
			dcBlocker.reset();
			ampEnv.reset();
			filterEnv.reset();
			// Fresh voice: land on the targets immediately (percussive attack),
			// don't glide in from stale smoothed values.
			snapSmoothing = true;
			state = VoiceState::DISPOSED;
		}

		void setOscMode(Oscillator::Mode mode) { osc.setMode(mode); osc2.setMode(mode); }
		void setPulseWidth(float pw) { pulseWidthBase = pw; pulseWidth = pw; }
		void setSubLevel(float level) { subLevel = level; }
		void setNoiseLevel(float level) { noiseLevel = level; }
		void setSubOctave(float semi) { subOsc.setSemiShift(semi); }
		void setSubMode(Oscillator::Mode mode) { subOsc.setMode(mode); }
		// Unison detune: offsets the second main oscillator (osc2) in cents.
		void setDetune(float cents) {
			detuneCents = cents;
			osc2.setCentShift(cents);
		}
		void setAccentAmount(float a) { accentAmount = a; }
		void setDirt(float d) { dirtAmount = d; }

		void setFilterModel(FilterModel model) {
			if (model == filterModel) return;
			filterModel = model;
			// The incoming kernel's state froze whenever it was last selected;
			// entering it stale mid-note is a click. (Called every block from
			// applyParams, hence the same-model early return.)
			switch (model) {
				case FilterModel::ACID: diodeFilter.reset(); break;
				case FilterModel::SCREAM: screamerFilter.reset(); break;
				case FilterModel::KORG: korgFilter.reset(); break;
				case FilterModel::MOOG: moogFilter.reset(); break;
			}
		}
		void setCutoff(float c) { cutoffBase = c; cutoff = c; }
		void setResonance(float r) { resonance = r; }
		// Target only: processSample derives the per-sample filter drive from
		// the smoothed value and pushes it to the selected kernel.
		void setDrive(float d) { drive = d; }

		void setAmpAttack(float v) { ampEnv.setAttackTime(attackRange.map(v, midiRange)); }
		void setAmpDecay(float v) { ampEnv.setDecayTime(decayRange.map(v, midiRange)); }
		void setAmpSustain(float v) { ampEnv.setSustainLevel(zeroOneRange.map(v, midiRange)); }
		void setAmpRelease(float v) { ampEnv.setReleaseTime(releaseRange.map(v, midiRange)); }

		void setFilterAttack(float v) { filterEnv.setAttackTime(attackRange.map(v, midiRange)); }
		void setFilterDecay(float v) { filterEnv.setDecayTime(decayRange.map(v, midiRange)); }
		void setFilterEnvAmount(float v) { filterEnvAmount = zeroOneRange.map(v, midiRange); }
		void setFilterEnvVelocity(float v) { filterEnvVelocity = zeroOneRange.map(v, midiRange); }

		void setLfoMode(Oscillator::Mode mode) { lfo.setMode(mode); }
		void setLfoRate(float v) { lfoRate = lfoFrequencyRange.map(v, midiRange); }
		void setLfoAmount(float v) { lfoAmount = zeroOneRange.map(v, midiRange); }
		void setLfoDestination(LfoDestination dest) { lfoDest = dest; }
		// Delay/fade-in time in seconds; 0 = instant. Sets the per-sample ramp.
		void setLfoDelay(float sec) { lfoFadeInc = (sec > 0.0001f) ? 1.0f / (sec * sampleRate) : 1.0f; }
		void setLfoKeySync(bool on) { lfoKeySync = on; }

	private:
		// One-pole step that snaps once converged, so zero-tests downstream
		// (sub/noise early-outs) actually reach zero.
		static float smoothStep(float current, float target, float alpha) {
			current += alpha * (target - current);
			return std::fabs(target - current) < 1e-4f ? target : current;
		}

		void startIfNecessary() {
			if (state == VoiceState::DISPOSED) {
				ampEnv.enterAttackStage();
				filterEnv.enterAttackStage();
				lfoFade = 0.0f;
				state = VoiceState::STARTED;
			}
		}

		void stopIfNecessary() {
			if (state == VoiceState::STOPPING && ampEnv.isDone()) {
				state = VoiceState::STOPPED;
			}
		}

		// Every destination re-derives from its base each sample. Writing back
		// into a member that is only re-seeded once per block would make the
		// modulation integrate instead of offset, and rail within a few samples.
		// Bases are the SMOOTHED values, so knob steps glide under the LFO.
		void applyLfo(float mod, float &frequency) {
			pulseWidth = sPulseWidth;
			cutoff = sCutoff;
			switch (lfoDest) {
				case LfoDestination::PITCH:
					// Exponential (semitone) modulation: the linear form swung
					// -12/+7 semitones from the same excursion and reached 0 Hz
					// at full depth. +/-7 semitones at full depth.
					frequency *= std::exp2(mod * (7.f / 12.f));
					break;
				case LfoDestination::CUTOFF:
					cutoff = cutoffRange.clamp(sCutoff + mod);
					break;
				case LfoDestination::PULSE_WIDTH:
					pulseWidth = oscCycleRange.clamp(sPulseWidth + mod);
					break;
			}
		}

		float sampleRate;

		Oscillator::Kernel osc;
		Oscillator::Kernel osc2;
		Oscillator::Kernel subOsc;
		Oscillator::NoiseKernel noise;

		Filter::Moog::LadderKernel moogFilter;
		Filter::Diode::LadderKernel diodeFilter;
		Filter::Screamer::ScreamerKernel screamerFilter;
		Filter::Korg::Korg35Kernel korgFilter;
		LFOKernel lfo;
		Oversampler2x dirtOversampler;
		DCBlocker dcBlocker;

		Envelope::Kernel ampEnv;
		Envelope::Kernel filterEnv;

		VoiceState state;
		FilterModel filterModel = FilterModel::MOOG;

		float cutoff = 0.5f;
		float cutoffBase = 0.5f;
		float resonance = 0.0f;
		float drive = 0.0f;
		float subLevel = 0.0f;
		float noiseLevel = 0.0f;
		float pulseWidth = 0.5f;
		float pulseWidthBase = 0.5f;

		float filterEnvAmount = 0.0f;
		float filterEnvVelocity = 0.0f;

		// One-pole smoothing (~10 ms) state between param targets and audio.
		float smoothAlpha;
		bool snapSmoothing = true;
		float sCutoff = 0.5f;
		float sResonance = 0.0f;
		float sDrive = 0.0f;
		float sSubLevel = 0.0f;
		float sNoiseLevel = 0.0f;
		float sPulseWidth = 0.5f;
		float sLfoAmount = 0.0f;
		float sVelocity = 0.0f;

		float accentAmount = 0.0f;
		float dirtAmount = 0.0f;
		float detuneCents = 0.0f;
		static constexpr float ACCENT_CUTOFF = 0.30f;    // cutoff add at full accent
		static constexpr float ACCENT_AMP = 0.30f;       // amp boost at full accent
		// 0.75 so the default keyboard/sequencer velocity of 100 (curved:
		// (100/127)^0.6 ~= 0.87) clears it; at 0.8 raw-linear, accent was
		// unreachable from every on-screen input.
		static constexpr float ACCENT_VEL_THRESH = 0.75f; // velocity (0..1) that starts accenting

		LfoDestination lfoDest = LfoDestination::CUTOFF;
		float lfoRate = 1.0f;
		float lfoAmount = 0.0f;
		float lfoFade = 1.0f;      // current per-note fade-in level (0..1)
		float lfoFadeInc = 1.0f;   // fade-in increment per sample (from LFO delay)
		bool lfoKeySync = true;    // retrigger LFO phase on note-on vs free-run
	};

} // namespace Monolog
} // namespace wasm_audio
