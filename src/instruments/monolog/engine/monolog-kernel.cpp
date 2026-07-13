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
#include "monolog-engine.h"

using namespace wasm_audio;

static Monolog::Engine *asEngine(uintptr_t ptr) {
	return reinterpret_cast<Monolog::Engine *>(ptr);
}

extern "C" {

uintptr_t monolog_create(float sampleRate, float renderFrames) {
	return reinterpret_cast<uintptr_t>(new Monolog::Engine(sampleRate, renderFrames));
}

void monolog_destroy(uintptr_t ptr) {
	delete asEngine(ptr);
}

void monolog_note_on(uintptr_t ptr, int midi, float frequency, float velocity) {
	asEngine(ptr)->noteOn(midi, frequency, velocity);
}

void monolog_note_off(uintptr_t ptr, int midi) {
	asEngine(ptr)->noteOff(midi);
}

void monolog_set_param(uintptr_t ptr, int paramId, float value) {
	asEngine(ptr)->setParam(paramId, value);
}

void monolog_process(uintptr_t ptr, uintptr_t outputPtr, unsigned channelCount) {
	asEngine(ptr)->process(outputPtr, channelCount);
}

} // extern "C"
