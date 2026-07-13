ENGINE = src/instruments/poly-ticks/engine
DSP = src/dsp
OUT = $(ENGINE)/voice-kernel.wasmmodule.js

MONOLOG_ENGINE = src/instruments/monolog/engine
MONOLOG_OUT = $(MONOLOG_ENGINE)/monolog-kernel.wasmmodule.js

DEPS = $(wildcard $(ENGINE)/*.h) $(wildcard $(ENGINE)/*.cpp) $(wildcard $(DSP)/*.h) Makefile
MONOLOG_DEPS = $(wildcard $(MONOLOG_ENGINE)/*.h) $(wildcard $(MONOLOG_ENGINE)/*.cpp) $(wildcard $(DSP)/*.h) Makefile

SHELL := /bin/bash
EMCC := docker run --rm -v $(CURDIR):/src -u $(shell id -u):$(shell id -g) emscripten/emsdk emcc

EMCC_FLAGS = -std=c++17 -O3 -g0 \
	-sINITIAL_MEMORY=4MB \
	-sWASM_ASYNC_COMPILATION=0 \
	-sSINGLE_FILE=1 \
	-sEXPORT_ES6=1 \
	-sMODULARIZE=1 \
	-sENVIRONMENT=worklet \
	-I $(DSP)

.PHONY: clean

build: $(OUT) $(MONOLOG_OUT)

$(OUT): $(DEPS)
	$(EMCC) $(EMCC_FLAGS) \
		-sEXPORTED_FUNCTIONS="['_malloc','_free','_voice_kernel_create','_voice_kernel_destroy','_voice_kernel_process','_voice_kernel_set_parameters','_voice_kernel_enter_release_stage','_voice_kernel_is_stopped','_voice_kernel_reset','_synth_engine_create','_synth_engine_destroy','_synth_engine_note_on','_synth_engine_note_off','_synth_engine_set_param','_synth_engine_process']" \
		-sEXPORTED_RUNTIME_METHODS="['HEAPF32','HEAPU32']" \
		-I $(ENGINE) \
		$(ENGINE)/voice-kernel.cpp \
		-o $(OUT)

$(MONOLOG_OUT): $(MONOLOG_DEPS)
	$(EMCC) $(EMCC_FLAGS) \
		-sEXPORTED_FUNCTIONS="['_malloc','_free','_monolog_create','_monolog_destroy','_monolog_note_on','_monolog_note_off','_monolog_set_param','_monolog_process']" \
		-sEXPORTED_RUNTIME_METHODS="['HEAPF32','HEAPU32']" \
		-I $(MONOLOG_ENGINE) \
		$(MONOLOG_ENGINE)/monolog-kernel.cpp \
		-o $(MONOLOG_OUT)

clean:
	rm -f $(OUT) $(MONOLOG_OUT)
