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

#include "constants.cpp"
#include <algorithm>
#include <cmath>
#include <iostream>
#include <vector>

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

	float epsilonIfZero(float x) {
		return x == 0 ? Constants::epsilon : x;
	}

	float computeExponentialCoefficient(float ya, float yb, unsigned long sampleCount) {
		return (std::log(epsilonIfZero(yb)) - std::log(epsilonIfZero(ya))) / epsilonIfZero(sampleCount);
	}

	float computeLinearMultiplier(float ya, float yb, unsigned long sampleCount, unsigned long sample) {
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

		public:
		void setSampleCount(int count) {
			sampleCount = count;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		public:
		void setStartLevel(float value) {
			ya = value;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		public:
		void setEndLevel(float value) {
			yb = value;
			exponentialCoefficient = computeExponentialCoefficient(ya, yb, sampleCount);
		}

		public:
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

		public:
		Stage next() {
			if (++sample >= sampleCount) {
				return nextStage;
			}
			return stage;
		}

		public:
		void setType(RampType newType) {
			type = newType;
		}

		public:
		void reset() {
			sample = 0;
		}

		private:
		float ya;
		float yb;
		int sampleCount;
		int sample;
		float level;
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

		public:
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

		public:
		void enterAttackStage() {
			if (stage == Stage::OFF) {
				stage = Stage::ATTACK;
			}
		}

		public:
		void enterReleaseStage() {
			if (stage != Stage::SUSTAIN) {
				releaseTimeLine.setStartLevel(level);
			}
			stage = Stage::RELEASE;
		}

		public:
		bool isDone() {
			return stage == Stage::DONE;
		}

		public:
		void setAttackTime(float seconds) {
			attackTimeLine.setSampleCount(seconds * sampleRate);
		}

		public:
		void setDecayTime(float seconds) {
			decayTimeLine.setSampleCount(seconds * sampleRate);
		}

		public:
		void setReleaseTime(float seconds) {
			releaseTimeLine.setSampleCount(seconds * sampleRate);
		}

		public:
		void setSustainLevel(float level) {
			decayTimeLine.setEndLevel(level);
			releaseTimeLine.setStartLevel(level);
		}

		public:
		void setPeakLevel(float level) {
			attackTimeLine.setEndLevel(level);
			decayTimeLine.setStartLevel(level);
		}

		public:
		void setAttackRampType(RampType newType) {
			attackTimeLine.setType(newType);
		}

		public:
		void setDecayRampType(RampType newType) {
			decayTimeLine.setType(newType);
		}

		public:
		void setReleaseRampType(RampType newType) {
			releaseTimeLine.setType(newType);
		}

		public:
		void reset() {
			attackTimeLine.reset();
			decayTimeLine.reset();
			releaseTimeLine.reset();
			stage = Stage::OFF;
		}

		private:
		float sampleRate = Constants::sampleRate;
		float level;

		Stage stage;
		TimeLine attackTimeLine;
		TimeLine decayTimeLine;

		TimeLine releaseTimeLine;
	};
} // namespace Envelope