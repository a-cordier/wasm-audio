OUT = src/worklets/voice-kernel.wasmmodule.js
DEPS = src/worklets/voice-kernel.cpp Makefile

SHELL := /bin/bash
EMCC := docker run --rm -v $(CURDIR):/src -u $(shell id -u):$(shell id -g) emscripten/emsdk emcc

.PHONY: clean

build: $(OUT)

$(OUT): $(DEPS)
	$(EMCC) -std=c++17 --bind -O1 -g0 \
		-s WASM=1 \
		-s INITIAL_MEMORY=128MB \
		-s WASM_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		-s EXPORT_ES6=1 \
		-s MODULARIZE=1 \
		-s EXPORTED_FUNCTIONS="['_malloc','_free']" \
		-s EXPORTED_RUNTIME_METHODS="['HEAPF32']" \
		-s ENVIRONMENT=worker \
		src/worklets/voice-kernel.cpp \
		-o $(OUT)

clean:
	rm -f $(OUT)
