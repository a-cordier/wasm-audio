DEPS = src/worklets/voice-kernel.cpp

SHELL:=/bin/bash
build: $(DEPS)
	emcc -std=c++14 --bind -O3 -g0 \
	    -s WASM=1 \
	    -s INITIAL_MEMORY=128MB \
		-s WASM_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		-s MODULARIZE=1 \
		-s EXPORT_ES6=1 \
		src/worklets/voice-kernel.cpp \
		-o src/worklets/voice-kernel.wasmmodule.js
