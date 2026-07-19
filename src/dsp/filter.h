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
#include "range.h"
#include <cmath>
#include <array>

namespace wasm_audio {
namespace Filter {
	enum class Mode {
		LOWPASS,
		LOWPASS_PLUS,
		HIGHPASS,
		BANDPASS
	};

	class Kernel {
		public:
		virtual ~Kernel() = default;

		protected:
		Kernel(Mode mode) :
			mode(mode) {}

		public:
		virtual float nextSample(float sample, float cutoff, float resonance) = 0;

		virtual void reset() = 0;

		void setMode(Mode newMode) {
			mode = newMode;
		}

		protected:
		Mode mode = Mode::LOWPASS_PLUS;
	};

	// Linear-trapezoidal State Variable Filter (Andrew Simper / Cytomic).
	// Cutoff: 0..1 mapped exponentially to 20..20000 Hz internally.
	// Resonance: 0..1 where 1 approaches self-oscillation.
	class SVFKernel : public Kernel {
		public:
		SVFKernel(float sampleRate) :
			Kernel(Mode::LOWPASS),
			sampleRate(sampleRate) {}

		SVFKernel(float sampleRate, Mode mode) :
			Kernel(mode),
			sampleRate(sampleRate) {}

		float nextSample(float sample, float cutoff, float resonance) override {
			float cutoffHz = 20.0f * std::pow(1000.0f, cutoff);
			cutoffHz = std::min(cutoffHz, sampleRate * 0.49f);

			float g = std::tan(Constants::pi * cutoffHz / sampleRate);
			float k = 2.0f * (1.0f - resonance);
			k = std::max(k, 0.01f);

			float a1 = 1.0f / (1.0f + g * (g + k));
			float a2 = g * a1;
			float a3 = g * a2;

			float v3 = sample - ic2eq;
			float v1 = a1 * ic1eq + a2 * v3;
			float v2 = ic2eq + a2 * ic1eq + a3 * v3;
			ic1eq = 2.0f * v1 - ic1eq;
			ic2eq = 2.0f * v2 - ic2eq;

			switch (mode) {
				case Mode::LOWPASS:
					return v2;
				case Mode::LOWPASS_PLUS:
					return processCascade(v2, g);
				case Mode::HIGHPASS:
					return sample - k * v1 - v2;
				case Mode::BANDPASS:
					return v1;
				default:
					return 0.0f;
			}
		}

		void reset() override {
			ic1eq = 0.0f;
			ic2eq = 0.0f;
			ic1eq2 = 0.0f;
			ic2eq2 = 0.0f;
		}

		private:
		float processCascade(float input, float g) {
			float k2 = Constants::sqrtTwo;
			float a1 = 1.0f / (1.0f + g * (g + k2));
			float a2 = g * a1;
			float a3 = g * a2;

			float v3 = input - ic2eq2;
			float v1 = a1 * ic1eq2 + a2 * v3;
			float v2 = ic2eq2 + a2 * ic1eq2 + a3 * v3;
			ic1eq2 = 2.0f * v1 - ic1eq2;
			ic2eq2 = 2.0f * v2 - ic2eq2;

			return v2;
		}

		float sampleRate;
		float ic1eq = 0.0f;
		float ic2eq = 0.0f;
		float ic1eq2 = 0.0f;
		float ic2eq2 = 0.0f;
	};

	class NaiveResonantKernel : public Kernel {
		public:
		NaiveResonantKernel() :
			Kernel(Mode::LOWPASS) {
		}

		NaiveResonantKernel(Mode mode) :
			Kernel(mode) {
		}

		float nextSample(float sample, float cutoff, float resonance) override {
			float feedbackAmount = resonance + resonance / (1.0 - cutoff);
			buf0 += cutoff * (sample - buf0 + feedbackAmount * (buf0 - buf1));
			buf1 += cutoff * (buf0 - buf1);
			buf2 += cutoff * (buf1 - buf2);
			buf3 += cutoff * (buf2 - buf3);
			switch (mode) {
				case Mode::LOWPASS_PLUS:
					return buf3;
				case Mode::LOWPASS:
					return buf1;
				case Mode::HIGHPASS:
					return sample - buf3;
			case Mode::BANDPASS:
				return (buf0 - buf3) * 5.0f;
				default:
					return 0.0;
			}
		}

		void reset() override {
			buf0 = 0;
			buf1 = 0;
			buf2 = 0;
			buf3 = 0;
		}

		private:
		float buf0 = 0.f;
		float buf1 = 0.f;
		float buf2 = 0.f;
		float buf3 = 0.f;
	};

	inline float fastTanh(float x) {
		float x2 = x * x;
		return x * (27.f + x2) / (27.f + 9.f * x2);
	}

	namespace Moog {
		// TPT Moog Ladder: 4-pole (24dB/oct) with tanh saturation in feedback.
		// Warm, bass-preserving character. Based on Zavalishin TPT approach.
		// Cutoff: 0..1 mapped exponentially to 20..16000 Hz.
		// Resonance: 0..1 where ~0.95 approaches self-oscillation.
		class LadderKernel : public Kernel {
			public:
			LadderKernel(float sampleRate) :
				Kernel(Mode::LOWPASS),
				sampleRate(sampleRate) {
				state.fill(0.f);
			}

			void setDrive(float d) { drive = d; }

			float nextSample(float sample, float cutoff, float resonance) override {
				float cutoffHz = 20.0f * std::pow(800.0f, cutoff);
				cutoffHz = std::min(cutoffHz, sampleRate * 0.45f);

				float g = std::tan(Constants::pi * cutoffHz / sampleRate);
				float G = g / (1.0f + g);

				float k = resonance * 3.8f;

				float G2 = G * G;
				float G3 = G2 * G;
				float G4 = G3 * G;
				float S = G3 * state[0] + G2 * state[1] + G * state[2] + state[3];

				float u = (sample - k * S) / (1.0f + k * G4);
				u = fastTanh(drive * u);

				float y = u;
				for (int i = 0; i < 4; ++i) {
					float v = G * (y - state[i]);
					y = v + state[i];
					state[i] = y + v;
				}

				float lp4 = y;
				float lp2 = state[1] + G * (state[0] - state[1]);

				// Moog bass compensation: restore low-end lost to resonance
				float bassComp = 1.0f + resonance * 0.4f;

				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return lp4 * bassComp;
					case Mode::LOWPASS:
						return lp2 * bassComp;
					case Mode::BANDPASS:
						return u - lp4;
					case Mode::HIGHPASS:
						return sample - k * lp4 - lp4;
					default:
						return 0.0f;
				}
			}

			void reset() override {
				state.fill(0.f);
			}

			private:
			float sampleRate;
			float drive = 1.0f;
			float gComp = 0.5f;
			std::array<float, 4> state;
		};
	} // namespace Moog

	namespace Diode {
		// TPT Diode Ladder: 4-pole with asymmetric stage coupling.
		// TB-303 acid character: nasal, biting resonance peak.
		// Based on Zavalishin VA Filter Design (p.170) and rygrob's TPT implementation.
		// Cutoff: 0..1 mapped exponentially to 20..16000 Hz.
		// Resonance: 0..1 mapped to 0..17 (diode ladders tolerate higher feedback).
		class LadderKernel : public Kernel {
			public:
			LadderKernel(float sampleRate) :
				Kernel(Mode::LOWPASS),
				sampleRate(sampleRate) {}

			void setDrive(float d) { drive = d; }

			float nextSample(float sample, float cutoff, float resonance) override {
				float cutoffHz = 30.0f * std::pow(530.0f, cutoff);
				cutoffHz = std::min(cutoffHz, sampleRate * 0.45f);

				float g = std::tan(Constants::pi * cutoffHz / sampleRate);
				float G = g / (1.0f + g);

				float k = resonance * 17.0f;

				float gp = 1.0f - G;
				float s1 = s[0] * gp;
				float s2 = s[1] * gp;
				float s3 = s[2] * gp;
				float s4 = s[3] * gp;

				float gh = 0.5f * G;
				float g34 = gh;
				float g23 = gh / (1.0f - gh * gh);
				float g12 = gh / (1.0f - gh * g23);
				float g01 = 2.0f * gh / (1.0f - 2.0f * gh * g12);

				float s34 = s4;
				float s23 = (gh * s4 + s3) / (1.0f - gh * gh);
				float s12 = (gh * s23 + s2) / (1.0f - gh * g23);
				float s01 = (2.0f * gh * s12 + s1) / (1.0f - 2.0f * gh * g12);

				float g04 = g01 * g12 * g23 * g34;
				float s04 = g12 * g23 * g34 * s01 + g23 * g34 * s12 + g34 * s23 + s34;

				float input = fastTanh(drive * sample);
				float u = (input - k * s04) / (1.0f + k * g04);

				// Per-stage saturation: this is what gives the diode ladder its
				// asymmetric, nasal, "spitting" character vs a clean Moog ladder
				float y1 = fastTanh(g01 * u + s01);
				float y2 = fastTanh(g12 * y1 + s12);
				float y3 = fastTanh(g23 * y2 + s23);
				float y4 = g34 * y3 + s34;

				s[0] = 2.0f * y1 - s[0];
				s[1] = 2.0f * y2 - s[1];
				s[2] = 2.0f * y3 - s[2];
				s[3] = 2.0f * y4 - s[3];

				float bp = y1 - y3;
				float acidMix = 0.2f + resonance * 0.3f;
				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return y4 + acidMix * bp;
					case Mode::LOWPASS:
						return y2 + acidMix * bp;
					case Mode::BANDPASS:
						return bp;
					case Mode::HIGHPASS:
						return input - y1;
					default:
						return 0.0f;
				}
			}

			void reset() override {
				s[0] = s[1] = s[2] = s[3] = 0.0f;
			}

			private:
			float sampleRate;
			float drive = 1.0f;
			float s[4] = {0.0f, 0.0f, 0.0f, 0.0f};
		};
	} // namespace Diode

	namespace Korg {
		// Korg35 / MS-20 Rev1: TPT 2-pole Sallen-Key with forward-path saturation.
		// Based on Will Pirkle AN-5 (Zavalishin TPT, delay-free feedback).
		// The key to the MS-20 "screaming" character is diodes IN the signal path:
		// resonance boosts signal at cutoff → drives diodes harder → harmonics.
		// Cutoff: 0..1 mapped exponentially to 20..18000 Hz.
		// Resonance: 0..1 mapped to K=0..2.0 (self-oscillation at K=2).
		// Highpass is 6dB/oct (authentic MS-20 behavior).
		class Korg35Kernel : public Kernel {
			public:
			Korg35Kernel(float sampleRate) :
				Kernel(Mode::LOWPASS),
				sampleRate(sampleRate) {}

			void setDrive(float d) { drive = d; }

			float nextSample(float sample, float cutoff, float resonance) override {
				float cutoffHz = 20.0f * std::pow(900.0f, cutoff);
				cutoffHz = std::min(cutoffHz, sampleRate * 0.45f);

				float g = std::tan(Constants::pi * cutoffHz / sampleRate);
				float G = g / (1.0f + g);

				float K = resonance * 2.0f;

				// Delay-free feedback resolution (Pirkle/Zavalishin TPT Sallen-Key)
				float S = (1.0f - G) * (G * s1 + s2);
				float denom = 1.0f - K * G * G;
				if (denom < 0.001f) denom = 0.001f;
				float u = (sample + K * S) / denom;

				// Forward-path saturation (MS-20 Rev1 diodes in signal path)
				u = std::tanh(drive * u);

				// TPT Stage 1 (lowpass)
				float v1 = G * (u - s1);
				float y1 = v1 + s1;
				s1 = y1 + v1;

				// TPT Stage 2 (lowpass)
				float v2 = G * (y1 - s2);
				float y2 = v2 + s2;
				s2 = y2 + v2;

				float bp = y1 - y2;
				float hp = u - y1;

				float norm = 1.0f / (1.0f + K * 0.3f);

				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return (y2 + bp * 0.25f) * norm;
					case Mode::LOWPASS:
						return y2 * norm;
					case Mode::BANDPASS:
						return bp * norm;
					case Mode::HIGHPASS:
						return hp * norm;
					default:
						return 0.0f;
				}
			}

			void reset() override {
				s1 = 0.0f;
				s2 = 0.0f;
			}

			private:
			float sampleRate;
			float drive = 1.0f;
			float s1 = 0.0f;
			float s2 = 0.0f;
		};
	} // namespace Korg

	namespace Screamer {
		// Purpose-built 4-pole (24dB/oct) dirty ladder for dense, aggressive
		// harmonic content. Per-stage tanh saturation creates cumulative distortion
		// that intensifies with resonance. Designed for "Rollin' & Scratchin'" territory.
		// Cutoff: 0..1 mapped exponentially to 20..16000 Hz.
		// Resonance: 0..1 mapped to K=0..5.0 (aggressive self-oscillation).
		class ScreamerKernel : public Kernel {
			public:
			ScreamerKernel(float sampleRate) :
				Kernel(Mode::LOWPASS),
				sampleRate(sampleRate) {
				state[0] = state[1] = state[2] = state[3] = 0.0f;
			}

			void setDrive(float d) { drive = d; }

			float nextSample(float sample, float cutoff, float resonance) override {
				float cutoffHz = 20.0f * std::pow(800.0f, cutoff);
				cutoffHz = std::min(cutoffHz, sampleRate * 0.45f);

				float g = std::tan(Constants::pi * cutoffHz / sampleRate);
				float G = g / (1.0f + g);

				float K = resonance * 5.0f;
				float stageDrive = 1.5f + drive * 0.5f;

				float G2 = G * G;
				float G3 = G2 * G;
				float G4 = G3 * G;
				float S = G3 * state[0] + G2 * state[1] + G * state[2] + state[3];

				float u = (sample - K * S) / (1.0f + K * G4);
				u = std::tanh(drive * u);

				float y = u;
				for (int i = 0; i < 4; ++i) {
					float v = G * (y - state[i]);
					float sum = v + state[i];
					float sat = (i >= 2) ? stageDrive * 1.2f : stageDrive;
					y = std::tanh(sat * sum);
					state[i] = y + v;
				}

				float lp4 = y;
				float lp2 = state[1] + G * (state[0] - state[1]);
				float bp = u - lp4;

				float bassComp = 1.0f + resonance * 0.5f;

				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return lp4 * bassComp;
					case Mode::LOWPASS:
						return lp2 * bassComp;
					case Mode::BANDPASS:
						return bp;
					case Mode::HIGHPASS:
						return sample - lp4;
					default:
						return 0.0f;
				}
			}

			void reset() override {
				state[0] = state[1] = state[2] = state[3] = 0.0f;
			}

			private:
			float sampleRate;
			float drive = 1.0f;
			float state[4] = {0.0f, 0.0f, 0.0f, 0.0f};
		};
	} // namespace Screamer
} // namespace Filter
} // namespace wasm_audio
