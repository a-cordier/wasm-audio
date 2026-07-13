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

	namespace Moog {
		inline float fastTanh(float x) {
			float x2 = x * x;
			return x * (27.f + x2) / (27.f + 9.f * x2);
		}

		class KrajeskiKernel : public Kernel {
			public:
			KrajeskiKernel(float sampleRate) :
				Kernel(Mode::LOWPASS),
				sampleRate{ sampleRate },
				drive(1.f),
				gComp(1.f) {
				state.fill(0.f);
				delay.fill(0.f);
			}

			float nextSample(float sample, float cutoff, float resonance) override {
				static auto cutoffLimit = 8000.f;
				static auto resonanceLimit = 0.7f;

				cutoff *= cutoffLimit;
				resonance = resonance * resonanceLimit / drive;

				float wc = Constants::twoPi * cutoff / sampleRate;

				float g = derivateCutoff(cutoff, wc);
				float gRes = derivateResonance(resonance, wc);

				state[0] = fastTanh(drive * (sample - 4 * gRes * (state[4] - gComp * sample)));

				for (int i = 0; i < 4; ++i) {
					state[i + 1] = g * (0.3 / 1.3 * state[i] + 1 / 1.3 * delay[i] - state[i + 1]) + state[i + 1];
					delay[i] = state[i];
				}

				switch (mode) {
					case Mode::LOWPASS_PLUS:
						return state[4];
					case Mode::LOWPASS:
						return state[2];
					case Mode::BANDPASS:
						return state[0] - state[3];
					case Mode::HIGHPASS:
						return sample - state[1];
				}
			}

			void reset() override {
				state.fill(0.f);
				delay.fill(0.f);
			}

			private:
			float derivateResonance(float resonance, float wc) {
				return resonance * (1.0029 + 0.0526 * wc - 0.926 * std::pow(wc, 2) + 0.0218 * std::pow(wc, 3));
			}

			float derivateCutoff(float cutoff, float wc) {
				return 0.9892 * wc - 0.4342 * std::pow(wc, 2) + 0.1381 * std::pow(wc, 3) - 0.0202 * std::pow(wc, 4);
			}

			float sampleRate;
			float g;
			float gRes;
			float gComp;
			float drive;

			std::array<float, 5> state;
			std::array<float, 5> delay;
		};
	} // namespace Moog
} // namespace Filter
} // namespace wasm_audio
