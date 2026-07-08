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
#pragma once

#include "constants.h"
#include <cmath>

namespace wasm_audio {
namespace Envelope {

	enum class Stage {
		OFF,
		ATTACK,
		DECAY,
		SUSTAIN,
		RELEASE,
		DONE
	};

	enum class RampType {
		EXPONENTIAL,
		LINEAR
	};

	inline float epsilonIfZero(float x) {
		return x == 0 ? Constants::epsilon : x;
	}

	inline float computeExponentialCoefficient(float ya, float yb, unsigned long sampleCount) {
		return (std::log(epsilonIfZero(yb)) - std::log(epsilonIfZero(ya))) / epsilonIfZero(sampleCount);
	}

	inline float computeLinearMultiplier(float ya, float yb, unsigned long sampleCount, unsigned long sample) {
		return ya + sample * (yb - ya) / epsilonIfZero(sampleCount);
	}

	class TimeLine {
		public:
		TimeLine(RampType type, int sampleCount, float ya, float yb, Stage stage, Stage nextStage) :
			type(type),
			stage(stage),
			nextStage(nextStage),
			sample(0),
			sampleCount(sampleCount),
			ya(ya),
			yb(yb),
			exponentialCoefficient(computeExponentialCoefficient(ya, yb, sampleCount)) {
		}

		void setSampleCount(int count) {
			sampleCount = count;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		void setStartLevel(float value) {
			ya = value;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		void setEndLevel(float value) {
			yb = value;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		float computeLevel() {
			switch (type) {
				case RampType::EXPONENTIAL:
					level = sample == 0 ? ya : level + level * exponentialCoefficient;
					break;
				case RampType::LINEAR:
					level = computeLinearMultiplier(ya, yb, sampleCount, sample);
					break;
			}
			return level;
		}

		Stage next() {
			if (++sample >= sampleCount) {
				return nextStage;
			}
			return stage;
		}

		void setType(RampType newType) {
			type = newType;
		}

		void reset() {
			sample = 0;
		}

		private:
		float ya;
		float yb;
		int sampleCount;
		int sample;
		float level = 0.f;
		float exponentialCoefficient;
		RampType type;
		Stage stage;
		Stage nextStage;
	};

	class Kernel {
		public:
		Kernel(float sampleRate, float peakLevel, float sustainLevel, float attackTime, float decayTime, float releaseTime) :
			stage(Stage::OFF),
			sampleRate(sampleRate),
			attackTimeLine(TimeLine(RampType::LINEAR, attackTime * sampleRate, 0.f, peakLevel, Stage::ATTACK, Stage::DECAY)),
			decayTimeLine(TimeLine(RampType::EXPONENTIAL, decayTime * sampleRate, peakLevel, sustainLevel, Stage::DECAY, Stage::SUSTAIN)),
			releaseTimeLine(TimeLine(RampType::LINEAR, releaseTime * sampleRate, sustainLevel, 0.f, Stage::RELEASE, Stage::DONE)) {}

		float nextLevel() {
			switch (stage) {
				case Stage::ATTACK:
					level = attackTimeLine.computeLevel();
					stage = attackTimeLine.next();
					return level;
				case Stage::DECAY:
					level = decayTimeLine.computeLevel();
					stage = decayTimeLine.next();
					return level;
				case Stage::RELEASE:
					level = releaseTimeLine.computeLevel();
					stage = releaseTimeLine.next();
					return level;
				case Stage::SUSTAIN:
					return level;
				case Stage::OFF:
				case Stage::DONE:
					return 0.f;
			}
		}

		void enterAttackStage() {
			if (stage == Stage::OFF) {
				stage = Stage::ATTACK;
			}
		}

		void enterReleaseStage() {
			if (stage != Stage::SUSTAIN) {
				releaseTimeLine.setStartLevel(level);
			}
			stage = Stage::RELEASE;
		}

		bool isDone() {
			return stage == Stage::DONE;
		}

		void setAttackTime(float seconds) {
			attackTimeLine.setSampleCount(seconds * sampleRate);
		}

		void setDecayTime(float seconds) {
			decayTimeLine.setSampleCount(seconds * sampleRate);
		}

		void setReleaseTime(float seconds) {
			releaseTimeLine.setSampleCount(seconds * sampleRate);
		}

		void setSustainLevel(float level) {
			decayTimeLine.setEndLevel(level);
			releaseTimeLine.setStartLevel(level);
		}

		void setPeakLevel(float level) {
			attackTimeLine.setEndLevel(level);
			decayTimeLine.setStartLevel(level);
		}

		void setAttackRampType(RampType newType) {
			attackTimeLine.setType(newType);
		}

		void setDecayRampType(RampType newType) {
			decayTimeLine.setType(newType);
		}

		void setReleaseRampType(RampType newType) {
			releaseTimeLine.setType(newType);
		}

		void reset() {
			attackTimeLine.reset();
			decayTimeLine.reset();
			releaseTimeLine.reset();
			stage = Stage::OFF;
		}

		private:
		float sampleRate = Constants::sampleRate;
		float level = 0.f;

		Stage stage;
		TimeLine attackTimeLine;
		TimeLine decayTimeLine;

		TimeLine releaseTimeLine;
	};
} // namespace Envelope
} // namespace wasm_audio
