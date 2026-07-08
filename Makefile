OUT = src/synth/engine/voice-kernel.wasmmodule.js
DEPS = $(wildcard src/dsp/*.h) $(wildcard src/synth/engine/*.h) $(wildcard src/synth/engine/*.cpp) Makefile

SHELL := /bin/bash
EMCC := docker run --rm -v $(CURDIR):/src -u $(shell id -u):$(shell id -g) emscripten/emsdk emcc

.PHONY: clean

build: $(OUT)

$(OUT): $(DEPS)
	$(EMCC) -std=c++17 -O3 -g0 \
		-sINITIAL_MEMORY=4MB \
		-sWASM_ASYNC_COMPILATION=0 \
		-sSINGLE_FILE=1 \
		-sEXPORT_ES6=1 \
		-sMODULARIZE=1 \
		-sEXPORTED_FUNCTIONS="['_malloc','_free','_voice_kernel_create','_voice_kernel_destroy','_voice_kernel_process','_voice_kernel_set_parameters','_voice_kernel_enter_release_stage','_voice_kernel_is_stopped','_voice_kernel_reset','_synth_engine_create','_synth_engine_destroy','_synth_engine_note_on','_synth_engine_note_off','_synth_engine_set_param','_synth_engine_process']" \
		-sEXPORTED_RUNTIME_METHODS="['HEAPF32','HEAPU32']" \
		-sENVIRONMENT=worklet \
		-I src/dsp -I src/synth/engine \
		src/synth/engine/voice-kernel.cpp \
		-o $(OUT)

clean:
	rm -f $(OUT)
