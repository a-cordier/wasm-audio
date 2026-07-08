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

using namespace wasm_audio;

static Voice::Kernel *asKernel(uintptr_t ptr) {
	return reinterpret_cast<Voice::Kernel *>(ptr);
}

extern "C" {

uintptr_t voice_kernel_create(float sampleRate, float renderFrames) {
	return reinterpret_cast<uintptr_t>(new Voice::Kernel(sampleRate, renderFrames));
}

void voice_kernel_destroy(uintptr_t ptr) {
	delete asKernel(ptr);
}

void voice_kernel_process(uintptr_t ptr, uintptr_t outputPtr, unsigned channelCount) {
	asKernel(ptr)->process(outputPtr, channelCount);
}

void voice_kernel_set_parameters(uintptr_t ptr, uintptr_t blockPtr) {
	asKernel(ptr)->setParameters(blockPtr);
}

void voice_kernel_enter_release_stage(uintptr_t ptr) {
	asKernel(ptr)->enterReleaseStage();
}

int voice_kernel_is_stopped(uintptr_t ptr) {
	return asKernel(ptr)->isStopped() ? 1 : 0;
}

void voice_kernel_reset(uintptr_t ptr) {
	asKernel(ptr)->reset();
}

} // extern "C"
