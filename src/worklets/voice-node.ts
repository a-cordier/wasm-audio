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
import { VoiceState } from "./voice-processor-parameters";
export class WasmVoiceNode extends AudioWorkletNode {
  private params: Map<string, AudioParam>;

  constructor(audioContext: AudioContext) {
    super(audioContext, "voice");
    this.params = this.parameters as Map<string, AudioParam>;
  }

  start() {
    this.params.get("state").value = VoiceState.STARTED;
  }

  stop() {
    this.params.get("state").value = VoiceState.STOPPED;
  }

  get frequency() {
    return this.params.get("frequency");
  }

  get velocity() {
    return this.params.get("velocity");
  }

  get amplitude() {
    return this.params.get("amplitude");
  }

  get amplitudeAttack() {
    return this.params.get("amplitudeAttack");
  }

  get amplitudeDecay() {
    return this.params.get("amplitudeDecay");
  }

  get amplitudeSustain() {
    return this.params.get("amplitudeSustain");
  }

  get amplitudeRelease() {
    return this.params.get("amplitudeRelease");
  }

  get cutoff() {
    return this.params.get("cutoff");
  }

  get resonance() {
    return this.params.get("resonance");
  }

  get drive() {
    return this.params.get("drive");
  }

  get cutoffEnvelopeAmount() {
    return this.params.get("cutoffEnvelopeAmount");
  }

  get cutoffEnvelopeVelocity() {
    return this.params.get("cutoffEnvelopeVelocity");
  }

  get cutoffAttack() {
    return this.params.get("cutoffAttack");
  }

  get cutoffDecay() {
    return this.params.get("cutoffDecay");
  }

  get osc1SemiShift() {
    return this.params.get("osc1SemiShift");
  }

  get osc1CentShift() {
    return this.params.get("osc1CentShift");
  }

  get osc1Cycle() {
    return this.params.get("osc1Cycle");
  }

  get osc2SemiShift() {
    return this.params.get("osc2SemiShift");
  }

  get osc2CentShift() {
    return this.params.get("osc2CentShift");
  }

  get osc2Cycle() {
    return this.params.get("osc2Cycle");
  }

  get osc2Amplitude() {
    return this.params.get("osc2Amplitude");
  }

  get noiseLevel() {
    return this.params.get("noiseLevel");
  }

  get osc1() {
    return this.params.get("osc1");
  }

  get osc2() {
    return this.params.get("osc2");
  }

  get filterMode() {
    return this.params.get("filterMode");
  }

  get lfo1Frequency() {
    return this.params.get("lfo1Frequency");
  }

  get lfo1ModAmount() {
    return this.params.get("lfo1ModAmount");
  }

  get lfo1Mode() {
    return this.params.get("lfo1Mode");
  }

  get lfo1Destination() {
    return this.params.get("lfo1Destination");
  }

  get lfo2Frequency() {
    return this.params.get("lfo2Frequency");
  }

  get lfo2ModAmount() {
    return this.params.get("lfo2ModAmount");
  }

  get lfo2Mode() {
    return this.params.get("lfo2Mode");
  }

  get lfo2Destination() {
    return this.params.get("lfo2Destination");
  }
}
