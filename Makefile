OUT = src/worklets/voice-kernel.wasmmodule.js
DEPS = $(wildcard src/worklets/*.cpp) $(wildcard src/worklets/*.h) Makefile

SHELL := /bin/bash
EMCC := docker run --rm -v $(CURDIR):/src -u $(shell id -u):$(shell id -g) emscripten/emsdk emcc

.PHONY: clean

build: $(OUT)

$(OUT): $(DEPS)
	$(EMCC) -std=c++17 -lembind -O3 -g0 \
		-sINITIAL_MEMORY=4MB \
		-sWASM_ASYNC_COMPILATION=0 \
		-sSINGLE_FILE=1 \
		-sEXPORT_ES6=1 \
		-sMODULARIZE=1 \
		-sEXPORTED_FUNCTIONS="['_malloc','_free']" \
		-sEXPORTED_RUNTIME_METHODS="['HEAPF32','HEAPU32']" \
		-sENVIRONMENT=worklet \
		src/worklets/voice-kernel.cpp \
		-o $(OUT)

clean:
	rm -f $(OUT)
