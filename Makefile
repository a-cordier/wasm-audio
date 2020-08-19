DEPS = src/worklets/voice-kernel.cpp

SHELL:=/bin/bash
build: $(DEPS)
	emcc --bind -O1 -g0 \
	    -s WASM=1 \
	    -std=c++14 \
	    -s INITIAL_MEMORY=128MB \
		-s WASM_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		src/worklets/voice-kernel.cpp \
		-o src/worklets/voice-kernel.wasmmodule.js \
		--post-js src/worklets/em-es6-module.js
