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
#include "voice-kernel.h"

#include "emscripten/bind.h"

using namespace wasm_audio;

EMSCRIPTEN_BINDINGS(CLASS_VoiceKernel) {
	emscripten::class_<Voice::Kernel>("VoiceKernel")
					.constructor<float, float>()
					.function("process", &Voice::Kernel::process, emscripten::allow_raw_pointers())
					.function("setParameters", &Voice::Kernel::setParameters, emscripten::allow_raw_pointers())
					.function("setVelocity", &Voice::Kernel::setVelocity)
					.function("setOsc1Mode", &Voice::Kernel::setOsc1Mode)
					.function("setOsc1SemiShift", &Voice::Kernel::setOsc1SemiShift)
					.function("setOsc1CentShift", &Voice::Kernel::setOsc1CentShift)
					.function("setOsc1Cycle", &Voice::Kernel::setOsc1Cycle)
					.function("setOsc2Mode", &Voice::Kernel::setOsc2Mode)
					.function("setOsc2SemiShift", &Voice::Kernel::setOsc2SemiShift)
					.function("setOsc2CentShift", &Voice::Kernel::setOsc2CentShift)
					.function("setOsc2Cycle", &Voice::Kernel::setOsc2Cycle)
					.function("setOsc2Amplitude", &Voice::Kernel::setOsc2Amplitude, emscripten::allow_raw_pointers())
					.function("setNoiseLevel", &Voice::Kernel::setNoiseLevel, emscripten::allow_raw_pointers())
					.function("setAmplitudeAttack", &Voice::Kernel::setAmplitudeAttack)
					.function("setAmplitudeDecay", &Voice::Kernel::setAmplitudeDecay)
					.function("setAmplitudeSustain", &Voice::Kernel::setAmplitudeSustain)
					.function("setAmplitudeRelease", &Voice::Kernel::setAmplitudeRelease)
					.function("setFilterMode", &Voice::Kernel::setFilterMode)
					.function("setCutoff", &Voice::Kernel::setCutoff, emscripten::allow_raw_pointers())
					.function("setResonance", &Voice::Kernel::setResonance, emscripten::allow_raw_pointers())
					.function("setDrive", &Voice::Kernel::setDrive, emscripten::allow_raw_pointers())
					.function("setCutoffEnvelopeAmount", &Voice::Kernel::setCutoffEnvelopeAmount)
					.function("setCutoffEnvelopeVelocity", &Voice::Kernel::setCutoffEnvelopeVelocity)
					.function("setCutoffEnvelopeAttack", &Voice::Kernel::setCutoffEnvelopeAttack)
					.function("setCutoffEnvelopeDecay", &Voice::Kernel::setCutoffEnvelopeDecay)
					.function("setLfo1Frequency", &Voice::Kernel::setLfo1Frequency, emscripten::allow_raw_pointers())
					.function("setLfo1ModAmount", &Voice::Kernel::setLfo1ModAmount, emscripten::allow_raw_pointers())
					.function("setLfo1Mode", &Voice::Kernel::setLfo1Mode)
					.function("setLfo1Destination", &Voice::Kernel::setLfo1Destination)
					.function("setLfo2Frequency", &Voice::Kernel::setLfo2Frequency, emscripten::allow_raw_pointers())
					.function("setLfo2ModAmount", &Voice::Kernel::setLfo2ModAmount, emscripten::allow_raw_pointers())
					.function("setLfo2Mode", &Voice::Kernel::setLfo2Mode)
					.function("setLfo2Destination", &Voice::Kernel::setLfo2Destination)
					.function("isStopped", &Voice::Kernel::isStopped)
					.function("enterReleaseStage", &Voice::Kernel::enterReleaseStage)
					.function("reset", &Voice::Kernel::reset);
}

EMSCRIPTEN_BINDINGS(ENUM_OscillatorMode) {
	emscripten::enum_<Oscillator::Mode>("WaveForm")
					.value("SINE", Oscillator::Mode::SINE)
					.value("SAW", Oscillator::Mode::SAW)
					.value("SQUARE", Oscillator::Mode::SQUARE)
					.value("TRIANGLE", Oscillator::Mode::TRIANGLE);
}

EMSCRIPTEN_BINDINGS(ENUM_FilterMode) {
	emscripten::enum_<Filter::Mode>("FilterMode")
					.value("LOWPASS", Filter::Mode::LOWPASS)
					.value("LOWPASS_PLUS", Filter::Mode::LOWPASS_PLUS)
					.value("BANDPASS", Filter::Mode::BANDPASS)
					.value("HIGHPASS", Filter::Mode::HIGHPASS);
}

EMSCRIPTEN_BINDINGS(ENUM_VoiceState) {
	emscripten::enum_<Voice::State>("VoiceState")
					.value("DISPOSED", Voice::State::DISPOSED)
					.value("STARTED", Voice::State::STARTED)
					.value("STOPPING", Voice::State::STOPPING)
					.value("STOPPED", Voice::State::STOPPED);
}

EMSCRIPTEN_BINDINGS(ENUM_LfoDestination) {
	emscripten::enum_<Voice::LfoDestination>("LfoDestination")
					.value("FREQUENCY", Voice::LfoDestination::FREQUENCY)
					.value("OSCILLATOR_MIX", Voice::LfoDestination::OSCILLATOR_MIX)
					.value("CUTOFF", Voice::LfoDestination::CUTOFF)
					.value("RESONANCE", Voice::LfoDestination::RESONANCE)
					.value("OSC1_CYCLE", Voice::LfoDestination::OSC1_CYCLE)
					.value("OSC2_CYCLE", Voice::LfoDestination::OSC2_CYCLE);
}
