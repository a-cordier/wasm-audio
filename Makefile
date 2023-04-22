DEPS = src/worklets/voice-kernel.cpp

SHELL:=/bin/bash
build: $(DEPS)
	emcc -std=c++14 --bind -O1 -g0 \
	    -s WASM=1 \
	    -s INITIAL_MEMORY=128MB \
		-s WASM_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		-s EXPORTED_FUNCTIONS="['_malloc']" \
		src/worklets/voice-kernel.cpp \
		-o src/worklets/voice-kernel.wasmmodule.js \
		--post-js src/worklets/em-es6-module.js
