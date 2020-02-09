#include <cmath>
#include <memory>

#include "emscripten/bind.h"

using namespace emscripten;

constexpr unsigned kRenderQuantumFrames = 128.f;
constexpr float sampleRate = 44100.f;
constexpr float PI = 3.14159265358979f;
constexpr float TWO_PI = 2.f * PI;

enum class OscillatorMode { SINE, SAW, SQUARE, TRIANGLE };

class OscillatorKernel {

 public:
  void process(uintptr_t outputPtr, unsigned channelCount, uintptr_t frequencyValuesPtr, uintptr_t amplitudeValuesPtr) {
    float* outputBuffer = reinterpret_cast<float*>(outputPtr);
    float* frequencyValues = reinterpret_cast<float*>(frequencyValuesPtr);
    float* amplitudeValues = reinterpret_cast<float*>(amplitudeValuesPtr);

    bool hasConstantFrequency = sizeof(frequencyValues) == sizeof(frequencyValues[0]);
    bool hasConstantAmplitude = sizeof(amplitudeValues) == sizeof(amplitudeValues[0]);

    for (unsigned channel = 0; channel < channelCount; ++channel) {
      float* channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

      for (auto i = 0; i < kRenderQuantumFrames; ++i) {
        float frequency = hasConstantFrequency ? frequencyValues[0]: frequencyValues[i];
        float amplitude = hasConstantAmplitude ? amplitudeValues[0]: amplitudeValues[i];
        phaseIncrement = computePhaseIncrement(frequency);
        channelBuffer[i] = computeSample(frequency) * amplitude;
        updatePhase();
      }
    }
  }

  void setMode(OscillatorMode _mode) {
    mode = _mode;
  }

 private:
  float computeSample(float frequency) {
    switch (mode) {
      case OscillatorMode::SINE:
        return computeSine(frequency);
      case OscillatorMode::SAW:
        return computeSaw(frequency);
      case OscillatorMode::TRIANGLE:
        return computeTriangle(frequency);
      case OscillatorMode::SQUARE:
        return computeSquare(frequency);
    }
  }

  float computeSine(float frequency) {
    return std::sin(phase);
  }

  float computeSaw(float frequency) {
    float value = 1.0 - (2.0 * phase / TWO_PI);
    return value - computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
  }

  float computeTriangle(float frequency) {
    float value = phase <= PI ? 1.f : -1.f;
    value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
    value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
    value = value * phaseIncrement + (1.f - phaseIncrement) * lastValue;
    lastValue = value;
    return value;
  }

  float computeSquare(float frequency) {
    auto value = phase <= PI ? 1 : -1;
    value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
    value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
    return value;
  }

  void updatePhase() {
    phase += phaseIncrement;
    if (phase > TWO_PI) {
      phase -= TWO_PI;
    }
  }

  float computePhaseIncrement(float frequency) {
    return frequency * TWO_PI / sampleRate;
  }

  float computePolyBLEP(float t, float dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1.f;
    } else if (t > 1.f - dt) {
      t = (t - 1.f) / dt;
      return t * t + t + t + 1.f;
    } else {
      return 0.f;
    }
  }

 private:
  float phase = 0.f;
  float phaseIncrement = 0.f;
  float lastValue = 0.f;
  OscillatorMode mode = OscillatorMode::SINE;
};

EMSCRIPTEN_BINDINGS(CLASS_OscillatorKernel) {
  class_<OscillatorKernel>("OscillatorKernel")
      .smart_ptr_constructor("OscillatorKernel", &std::make_shared<OscillatorKernel>)
      .function("process", &OscillatorKernel::process, allow_raw_pointers())
      .function("setMode", &OscillatorKernel::setMode);
}

EMSCRIPTEN_BINDINGS(ENUM_OscillatorMode) {
    enum_<OscillatorMode>("mode")
      .value("SINE", OscillatorMode::SINE)
      .value("SAW", OscillatorMode::SAW)
      .value("SQUARE", OscillatorMode::SQUARE)
      .value("TRIANGLE", OscillatorMode::TRIANGLE);
}