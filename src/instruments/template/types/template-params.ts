/*
 * Copyright (C) 2020 Antoine CORDIER
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The param id / count. For a C++ synth this must match the engine.h ParamId
// AND the processor.js PARAM_COUNT; here (a pure-JS worklet) it must match the
// PARAM_COUNT in template-processor.js. The check:conventions script asserts it.
// Append only — never renumber, presets store the raw indices.
export const TemplateParamId = Object.freeze({
  WAVE: 0,    // discrete: 0 sine, 1 saw, 2 square  → mode-selector buttons
  OCTAVE: 1,  // discrete: 0..4 == -2..+2 octaves   → stepper
  ATTACK: 2,  // continuous 0..127                  → knob
  RELEASE: 3, // continuous 0..127                  → knob
  LEVEL: 4,   // continuous 0..127                  → knob
  PARAM_COUNT: 5,
});

// Discrete option sets, mirrored by the worklet.
export const TemplateWave = Object.freeze({ SINE: 0, SAW: 1, SQUARE: 2 });
