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
  void process(uintptr_t output, unsigned channelCount, float frequency, float time) {
    float* outputBuffer = reinterpret_cast<float*>(output);

    for (unsigned channel = 0; channel < channelCount; ++channel) {
      float* channelBuffer = outputBuffer + channel * kRenderQuantumFrames;

      switch (mode) {
        case OscillatorMode::SINE:
          return computeSine(channelBuffer, frequency);
        case OscillatorMode::SAW:
          return computeSaw(channelBuffer, frequency);
        case OscillatorMode::TRIANGLE:
          return computeTriangle(channelBuffer, frequency);
        case OscillatorMode::SQUARE:
          return computeSquare(channelBuffer, frequency);
        default:
          break;
      }
    }
  }

 private:
  void computeSine(float* buffer, float frequency) {
    for (auto i = 0; i < kRenderQuantumFrames; ++i) {
      buffer[i] = std::sin(phase);
      updatePhase(frequency);
    }
  }

  void computeSaw(float* buffer, float frequency) {
    for (auto i = 0; i < kRenderQuantumFrames; ++i) {
      auto value = 1.0 - (2.0 * phase / TWO_PI);
      value -= computePolyBLEP(phase / TWO_PI, computePhaseIncrement(frequency) / TWO_PI);
      buffer[i] = value;
      updatePhase(frequency);
    }
  }

  void computeTriangle(float* buffer, float frequency) {
    float phaseIncrement = computePhaseIncrement(frequency);
    for (int i = 0; i < kRenderQuantumFrames; ++i) {
      float value = phase <= PI ? 1.f : -1.f;
      value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
      value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
      value = value * phaseIncrement + (1 - phaseIncrement) * lastValue;
      buffer[i] = value;
      lastValue = value;
      updatePhase(frequency);
    }
  }

  void computeSquare(float* buffer, float frequency) {
    auto phaseIncrement = computePhaseIncrement(frequency);

    for (auto i = 0; i < kRenderQuantumFrames; ++i) {
      auto value = phase <= PI ? 1 : -1;
      value += computePolyBLEP(phase / TWO_PI, phaseIncrement / TWO_PI);
      value -= computePolyBLEP(fmod(phase / TWO_PI + 0.5, 1.0), phaseIncrement / TWO_PI);
      buffer[i] = value;
      updatePhase(frequency);
    }
  }

  void updatePhase(float frequency) {
    phase += computePhaseIncrement(frequency);
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
  float lastValue = 0.f;
  OscillatorMode mode = OscillatorMode::SINE;
};

EMSCRIPTEN_BINDINGS(CLASS_OscillatorKernel) {
  class_<OscillatorKernel>("OscillatorKernel")
      .smart_ptr_constructor("OscillatorKernel", &std::make_shared<OscillatorKernel>)
      .function("process", &OscillatorKernel::process, allow_raw_pointers());
}