DEPS = src/worklets/oscillator-kernel.cpp

build: $(DEPS)
	emcc --bind -O1 -g0 \
	    -s WASM=1 \
	    -std=c++14 \
	    -s TOTAL_MEMORY=64MB \
		-s BINARYEN_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		src/worklets/oscillator-kernel.cpp \
		-o src/worklets/oscillator-kernel.wasmmodule.js \
		--post-js src/worklets/em-es6-module.js
