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

/** Factory preset session: an E dorian funk vamp at 110 BPM — a syncopated
 * sub bass with octave pops and slides (monolog ← sequels), resonant chord
 * stabs under a clock-synced filter LFO (poly-ticks ← dischord) and a
 * swung 16th-hat break (drumlin ← rudiment). Stored in the RackSession
 * shape and sanitized on load like any saved preset. */
export const SIDE_DOOR_SESSION: unknown = {
  "version": 1,
  "slotCounter": 5,
  "slots": [
    {
      "id": "slot-synth",
      "pluginId": "poly-ticks",
      "name": "POLY TICKS",
      "midiChannel": 0,
      "outputChannel": 0,
      "inputDevice": "internal",
      "mixer": {
        "gain": 0.5,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": -10,
          "mid": 2,
          "midFreq": 1500,
          "high": 3
        },
        "sends": {
          "slot-4": 0.22,
          "slot-5": 0.08
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "osc1": {
          "mode": {
            "value": 2
          },
          "semiShift": {
            "value": 63.5
          },
          "centShift": {
            "value": 61
          },
          "cycle": {
            "value": 34
          }
        },
        "osc2": {
          "mode": {
            "value": 1
          },
          "semiShift": {
            "value": 95.25
          },
          "centShift": {
            "value": 66
          },
          "cycle": {
            "value": 63.5
          }
        },
        "osc2Amplitude": {
          "value": 50
        },
        "noiseLevel": {
          "value": 0
        },
        "envelope": {
          "attack": {
            "value": 1
          },
          "decay": {
            "value": 0
          },
          "sustain": {
            "value": 30
          },
          "release": {
            "value": 6
          }
        },
        "filter": {
          "mode": {
            "value": 0
          },
          "cutoff": {
            "value": 72
          },
          "resonance": {
            "value": 72
          },
          "drive": {
            "value": 25
          }
        },
        "cutoffMod": {
          "attack": {
            "value": 0
          },
          "decay": {
            "value": 1
          },
          "amount": {
            "value": 50
          },
          "velocity": {
            "value": 85
          }
        },
        "lfo1": {
          "mode": {
            "value": 0
          },
          "frequency": {
            "value": 20
          },
          "modAmount": {
            "value": 55
          },
          "destination": {
            "value": 2
          },
          "sync": {
            "value": 127
          },
          "div": {
            "value": 9
          }
        },
        "lfo2": {
          "mode": {
            "value": 3
          },
          "frequency": {
            "value": 3
          },
          "modAmount": {
            "value": 35
          },
          "destination": {
            "value": 4
          },
          "sync": {
            "value": 0
          },
          "div": {
            "value": 4
          }
        },
        "voiceConfig": {
          "voiceMode": {
            "value": 0
          },
          "glideTime": {
            "value": 0
          },
          "retrigger": {
            "value": 1
          }
        },
        "routing": {
          "routing": {
            "value": 0
          },
          "fmIndex": {
            "value": 0
          },
          "subLevel": {
            "value": 0
          }
        },
        "space": {
          "spread": {
            "value": 30
          },
          "width": {
            "value": 40
          },
          "drift": {
            "value": 30
          }
        }
      }
    },
    {
      "id": "slot-monolog",
      "pluginId": "monolog",
      "name": "MONOLOG",
      "midiChannel": 1,
      "outputChannel": 0,
      "inputDevice": "internal",
      "mixer": {
        "gain": 0.7,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": 0,
          "mid": 0,
          "midFreq": 1000,
          "high": 0
        },
        "sends": {
          "slot-4": 0,
          "slot-5": 0
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "osc": {
          "mode": {
            "value": 1
          },
          "pulseWidth": {
            "value": 63.5
          },
          "subLevel": {
            "value": 0
          },
          "noiseLevel": {
            "value": 0
          },
          "subWave": {
            "value": 0
          },
          "subOctave": {
            "value": 0
          },
          "detune": {
            "value": 0
          }
        },
        "filter": {
          "model": {
            "value": 0
          },
          "cutoff": {
            "value": 50
          },
          "resonance": {
            "value": 45
          },
          "drive": {
            "value": 30
          }
        },
        "ampEnv": {
          "attack": {
            "value": 2
          },
          "decay": {
            "value": 2
          },
          "sustain": {
            "value": 30
          },
          "release": {
            "value": 0
          }
        },
        "filterEnv": {
          "attack": {
            "value": 0
          },
          "decay": {
            "value": 0
          },
          "amount": {
            "value": 28
          },
          "velocity": {
            "value": 30
          }
        },
        "lfo": {
          "mode": {
            "value": 0
          },
          "rate": {
            "value": 15
          },
          "amount": {
            "value": 0
          },
          "destination": {
            "value": 1
          },
          "delay": {
            "value": 0
          },
          "keySync": {
            "value": 127
          },
          "sync": {
            "value": 0
          },
          "div": {
            "value": 4
          }
        },
        "performance": {
          "glide": {
            "value": 28
          },
          "legato": {
            "value": 127
          },
          "accent": {
            "value": 0
          },
          "dirt": {
            "value": 0
          }
        }
      }
    },
    {
      "id": "slot-seq",
      "pluginId": "sequels",
      "name": "SEQUELS",
      "midiChannel": "omni",
      "outputChannel": 1,
      "inputDevice": "internal",
      "collapsed": false,
      "sync": true,
      "row": 0,
      "state": {
        "version": 1,
        "config": {
          "bpm": 110,
          "subdivision": 4,
          "swing": 32,
          "gate": 70,
          "direction": 0,
          "loop": true,
          "outputChannel": 1,
          "switchMode": 1,
          "transpose": 0,
          "metronome": false
        },
        "patterns": [
          {
            "index": 0,
            "length": 64,
            "steps": [
              {
                "index": 0,
                "note": 28,
                "velocity": 115,
                "slide": true
              },
              {
                "index": 1,
                "note": 28,
                "velocity": 115
              },
              {
                "index": 3,
                "note": 28,
                "velocity": 85
              },
              {
                "index": 4,
                "note": 40,
                "velocity": 120
              },
              {
                "index": 6,
                "note": 38,
                "velocity": 95,
                "slide": true
              },
              {
                "index": 7,
                "note": 40,
                "velocity": 105
              },
              {
                "index": 10,
                "note": 28,
                "velocity": 100
              },
              {
                "index": 11,
                "note": 31,
                "velocity": 85
              },
              {
                "index": 12,
                "note": 33,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 13,
                "note": 35,
                "velocity": 100
              },
              {
                "index": 14,
                "note": 38,
                "velocity": 110
              },
              {
                "index": 16,
                "note": 33,
                "velocity": 115,
                "slide": true
              },
              {
                "index": 17,
                "note": 33,
                "velocity": 115
              },
              {
                "index": 19,
                "note": 33,
                "velocity": 85
              },
              {
                "index": 20,
                "note": 40,
                "velocity": 120
              },
              {
                "index": 22,
                "note": 31,
                "velocity": 90
              },
              {
                "index": 23,
                "note": 33,
                "velocity": 100
              },
              {
                "index": 26,
                "note": 37,
                "velocity": 100
              },
              {
                "index": 27,
                "note": 38,
                "velocity": 95
              },
              {
                "index": 28,
                "note": 40,
                "velocity": 115,
                "slide": true
              },
              {
                "index": 29,
                "note": 40,
                "velocity": 115
              },
              {
                "index": 30,
                "note": 38,
                "velocity": 90
              },
              {
                "index": 31,
                "note": 35,
                "velocity": 85
              },
              {
                "index": 32,
                "note": 28,
                "velocity": 115,
                "slide": true
              },
              {
                "index": 33,
                "note": 28,
                "velocity": 115
              },
              {
                "index": 35,
                "note": 28,
                "velocity": 85
              },
              {
                "index": 36,
                "note": 40,
                "velocity": 120
              },
              {
                "index": 38,
                "note": 38,
                "velocity": 95,
                "slide": true
              },
              {
                "index": 39,
                "note": 40,
                "velocity": 105
              },
              {
                "index": 42,
                "note": 28,
                "velocity": 100
              },
              {
                "index": 43,
                "note": 31,
                "velocity": 85
              },
              {
                "index": 44,
                "note": 33,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 45,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 46,
                "note": 35,
                "velocity": 100
              },
              {
                "index": 47,
                "note": 38,
                "velocity": 110
              },
              {
                "index": 48,
                "note": 33,
                "velocity": 115,
                "slide": true
              },
              {
                "index": 49,
                "note": 33,
                "velocity": 115
              },
              {
                "index": 51,
                "note": 33,
                "velocity": 85
              },
              {
                "index": 52,
                "note": 40,
                "velocity": 120
              },
              {
                "index": 54,
                "note": 31,
                "velocity": 90
              },
              {
                "index": 55,
                "note": 33,
                "velocity": 100
              },
              {
                "index": 58,
                "note": 31,
                "velocity": 95
              },
              {
                "index": 59,
                "note": 30,
                "velocity": 90
              },
              {
                "index": 60,
                "note": 28,
                "velocity": 110,
                "slide": true
              },
              {
                "index": 61,
                "note": 28,
                "velocity": 110
              },
              {
                "index": 62,
                "note": 38,
                "velocity": 95
              },
              {
                "index": 63,
                "note": 39,
                "velocity": 100
              }
            ]
          }
        ],
        "activePattern": 0,
        "bank": 0,
        "scale": 0,
        "contour": 1
      }
    },
    {
      "id": "slot-1",
      "pluginId": "dischord",
      "name": "DISCHORD",
      "midiChannel": "omni",
      "outputChannel": 0,
      "inputDevice": "internal",
      "collapsed": false,
      "sync": true,
      "row": 0,
      "state": {
        "version": 1,
        "config": {
          "bpm": 110,
          "subdivision": 4,
          "swing": 32,
          "gate": 55,
          "direction": 0,
          "loop": true,
          "outputChannel": 0,
          "switchMode": 1,
          "metronome": false,
          "key": 4,
          "scale": 4,
          "voices": 3,
          "voicing": 1,
          "order": 0,
          "strum": 0
        },
        "patterns": [
          {
            "index": 0,
            "length": 64,
            "steps": [
              {
                "index": 2,
                "degree": 1,
                "velocity": 112,
                "quality": 19
              },
              {
                "index": 5,
                "degree": 1,
                "velocity": 80,
                "quality": 19
              },
              {
                "index": 8,
                "degree": 1,
                "velocity": 65,
                "quality": 5
              },
              {
                "index": 11,
                "degree": 1,
                "velocity": 115,
                "quality": 19
              },
              {
                "index": 14,
                "degree": 1,
                "velocity": 85,
                "quality": 5
              },
              {
                "index": 18,
                "degree": 4,
                "velocity": 112,
                "quality": 17
              },
              {
                "index": 21,
                "degree": 4,
                "velocity": 80,
                "quality": 17
              },
              {
                "index": 24,
                "degree": 4,
                "velocity": 70,
                "quality": 22
              },
              {
                "index": 27,
                "degree": 4,
                "velocity": 115,
                "quality": 17
              },
              {
                "index": 30,
                "degree": 7,
                "velocity": 90,
                "octave": -1,
                "quality": 16
              },
              {
                "index": 34,
                "degree": 1,
                "velocity": 112,
                "quality": 19
              },
              {
                "index": 37,
                "degree": 1,
                "velocity": 80,
                "quality": 19
              },
              {
                "index": 40,
                "degree": 1,
                "velocity": 65,
                "quality": 5
              },
              {
                "index": 43,
                "degree": 1,
                "velocity": 115,
                "quality": 19
              },
              {
                "index": 46,
                "degree": 1,
                "velocity": 85,
                "quality": 5
              },
              {
                "index": 50,
                "degree": 4,
                "velocity": 112,
                "quality": 17
              },
              {
                "index": 53,
                "degree": 4,
                "velocity": 80,
                "quality": 17
              },
              {
                "index": 56,
                "degree": 4,
                "velocity": 70,
                "quality": 22
              },
              {
                "index": 59,
                "degree": 4,
                "velocity": 118,
                "quality": 21
              },
              {
                "index": 62,
                "degree": 4,
                "velocity": 85,
                "quality": 17
              }
            ]
          }
        ],
        "activePattern": 0,
        "bank": 0
      }
    },
    {
      "id": "slot-2",
      "pluginId": "drumlin",
      "name": "DRUMLIN",
      "midiChannel": 2,
      "outputChannel": 0,
      "inputDevice": "internal",
      "mixer": {
        "gain": 1.9952623149688795,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": 0,
          "mid": 0,
          "midFreq": 1000,
          "high": 0
        },
        "sends": {
          "slot-4": 0,
          "slot-5": 0.08
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "kick": {
          "tune": {
            "value": 48
          },
          "punch": {
            "value": 85
          },
          "decay": {
            "value": 38
          },
          "level": {
            "value": 127
          },
          "note": {
            "value": 36
          },
          "route": {
            "value": 0
          }
        },
        "snare": {
          "tune": {
            "value": 65
          },
          "snap": {
            "value": 95
          },
          "decay": {
            "value": 42
          },
          "level": {
            "value": 127
          },
          "note": {
            "value": 38
          },
          "route": {
            "value": 0
          }
        },
        "clap": {
          "tone": {
            "value": 75
          },
          "decay": {
            "value": 35
          },
          "level": {
            "value": 70
          },
          "note": {
            "value": 39
          },
          "route": {
            "value": 0
          }
        },
        "hats": {
          "tone": {
            "value": 85
          },
          "chDecay": {
            "value": 28
          },
          "chLevel": {
            "value": 95
          },
          "ohDecay": {
            "value": 45
          },
          "ohLevel": {
            "value": 95
          },
          "chNote": {
            "value": 42
          },
          "ohNote": {
            "value": 46
          },
          "ohTone": {
            "value": 85
          },
          "chRoute": {
            "value": 0
          },
          "ohRoute": {
            "value": 0
          }
        },
        "tom": {
          "tune": {
            "value": 60
          },
          "decay": {
            "value": 60
          },
          "level": {
            "value": 95
          },
          "note": {
            "value": 45
          },
          "route": {
            "value": 0
          }
        },
        "rim": {
          "tune": {
            "value": 60
          },
          "decay": {
            "value": 35
          },
          "level": {
            "value": 95
          },
          "note": {
            "value": 37
          },
          "route": {
            "value": 0
          }
        },
        "ride": {
          "tone": {
            "value": 64
          },
          "decay": {
            "value": 55
          },
          "level": {
            "value": 85
          },
          "note": {
            "value": 51
          },
          "route": {
            "value": 0
          }
        },
        "crash": {
          "tone": {
            "value": 64
          },
          "decay": {
            "value": 60
          },
          "level": {
            "value": 90
          },
          "note": {
            "value": 49
          },
          "route": {
            "value": 0
          }
        },
        "out": {
          "accent": {
            "value": 105
          }
        }
      }
    },
    {
      "id": "slot-3",
      "pluginId": "rudiment",
      "name": "RUDIMENT",
      "midiChannel": "omni",
      "outputChannel": 2,
      "inputDevice": "internal",
      "collapsed": false,
      "sync": true,
      "row": 0,
      "state": {
        "version": 1,
        "config": {
          "bpm": 110,
          "subdivision": 4,
          "swing": 32,
          "gate": 50,
          "outputChannel": 2,
          "switchMode": 1,
          "metronome": false,
          "laneNotes": [
            36,
            38,
            39,
            37,
            42,
            46,
            43,
            45,
            47,
            51,
            49
          ],
          "laneMutes": [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
          ],
          "laneLabels": [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ]
        },
        "patterns": [
          {
            "index": 0,
            "length": 32,
            "hits": [
              {
                "lane": 0,
                "index": 0,
                "velocity": 122
              },
              {
                "lane": 0,
                "index": 3,
                "velocity": 75
              },
              {
                "lane": 0,
                "index": 7,
                "velocity": 105
              },
              {
                "lane": 0,
                "index": 10,
                "velocity": 115
              },
              {
                "lane": 0,
                "index": 16,
                "velocity": 122
              },
              {
                "lane": 0,
                "index": 22,
                "velocity": 105
              },
              {
                "lane": 0,
                "index": 26,
                "velocity": 115
              },
              {
                "lane": 0,
                "index": 27,
                "velocity": 70
              },
              {
                "lane": 1,
                "index": 4,
                "velocity": 115
              },
              {
                "lane": 1,
                "index": 9,
                "velocity": 42
              },
              {
                "lane": 1,
                "index": 12,
                "velocity": 120
              },
              {
                "lane": 1,
                "index": 15,
                "velocity": 48
              },
              {
                "lane": 1,
                "index": 20,
                "velocity": 115
              },
              {
                "lane": 1,
                "index": 23,
                "velocity": 42
              },
              {
                "lane": 1,
                "index": 28,
                "velocity": 120
              },
              {
                "lane": 1,
                "index": 29,
                "velocity": 48
              },
              {
                "lane": 2,
                "index": 12,
                "velocity": 95
              },
              {
                "lane": 2,
                "index": 28,
                "velocity": 95
              },
              {
                "lane": 3,
                "index": 6,
                "velocity": 80
              },
              {
                "lane": 3,
                "index": 25,
                "velocity": 80
              },
              {
                "lane": 4,
                "index": 0,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 1,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 2,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 3,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 4,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 5,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 6,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 7,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 8,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 9,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 10,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 11,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 12,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 13,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 15,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 16,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 17,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 18,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 19,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 20,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 21,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 22,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 23,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 24,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 25,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 26,
                "velocity": 75
              },
              {
                "lane": 4,
                "index": 27,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 28,
                "velocity": 105
              },
              {
                "lane": 4,
                "index": 29,
                "velocity": 40
              },
              {
                "lane": 4,
                "index": 31,
                "velocity": 45
              },
              {
                "lane": 5,
                "index": 14,
                "velocity": 105
              },
              {
                "lane": 5,
                "index": 30,
                "velocity": 105
              }
            ]
          }
        ],
        "activePattern": 0,
        "bank": 0
      }
    },
    {
      "id": "slot-4",
      "pluginId": "chorus",
      "name": "CHORUS",
      "midiChannel": 3,
      "outputChannel": 0,
      "inputDevice": "internal",
      "mixer": {
        "gain": 1,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": 0,
          "mid": 0,
          "midFreq": 1000,
          "high": 0
        },
        "sends": {
          "slot-5": 0
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "mod": {
          "rate": {
            "value": 50
          },
          "depth": {
            "value": 60
          },
          "spread": {
            "value": 100
          }
        }
      }
    },
    {
      "id": "slot-5",
      "pluginId": "verb",
      "name": "VERB",
      "midiChannel": 4,
      "outputChannel": 0,
      "inputDevice": "internal",
      "mixer": {
        "gain": 1,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": 0,
          "mid": 0,
          "midFreq": 1000,
          "high": 0
        },
        "sends": {
          "slot-4": 0
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "tank": {
          "size": {
            "value": 60
          },
          "decay": {
            "value": 55
          },
          "damp": {
            "value": 45
          }
        }
      }
    }
  ],
  "transport": {
    "bpm": 110
  },
  "mixer": {
    "master": 0.8,
    "click": 0.8
  }
};
