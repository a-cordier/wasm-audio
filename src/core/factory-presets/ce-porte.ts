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

/** Factory preset session: bass (monolog ← sequels), chord stabs (poly-ticks
 * ← dischord) and a break (drumlin ← rudiment) at 111 BPM. Stored in the
 * RackSession shape and sanitized on load like any saved preset. */
export const CE_PORTE_SESSION: unknown = {
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
        "gain": 0.45,
        "pan": 0,
        "mute": false,
        "solo": false,
        "eq": {
          "low": -10,
          "mid": 6,
          "midFreq": 1500,
          "high": 6
        },
        "sends": {
          "slot-4": 0.45,
          "slot-5": 0.22
        }
      },
      "collapsed": false,
      "sync": false,
      "row": 0,
      "state": {
        "osc1": {
          "mode": {
            "value": 1
          },
          "semiShift": {
            "value": 63.5
          },
          "centShift": {
            "value": 60
          },
          "cycle": {
            "value": 63.5
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
            "value": 67
          },
          "cycle": {
            "value": 63.5
          }
        },
        "osc2Amplitude": {
          "value": 85
        },
        "noiseLevel": {
          "value": 0
        },
        "envelope": {
          "attack": {
            "value": 3
          },
          "decay": {
            "value": 2
          },
          "sustain": {
            "value": 18
          },
          "release": {
            "value": 30
          }
        },
        "filter": {
          "mode": {
            "value": 0
          },
          "cutoff": {
            "value": 106
          },
          "resonance": {
            "value": 25
          },
          "drive": {
            "value": 10
          }
        },
        "cutoffMod": {
          "attack": {
            "value": 0
          },
          "decay": {
            "value": 2
          },
          "amount": {
            "value": 30
          },
          "velocity": {
            "value": 0
          }
        },
        "lfo1": {
          "mode": {
            "value": 0
          },
          "frequency": {
            "value": 0
          },
          "modAmount": {
            "value": 0
          },
          "destination": {
            "value": 0
          },
          "sync": {
            "value": 0
          },
          "div": {
            "value": 4
          }
        },
        "lfo2": {
          "mode": {
            "value": 0
          },
          "frequency": {
            "value": 0
          },
          "modAmount": {
            "value": 0
          },
          "destination": {
            "value": 0
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
            "value": 35
          },
          "width": {
            "value": 45
          },
          "drift": {
            "value": 40
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
            "value": 58
          },
          "resonance": {
            "value": 40
          },
          "drive": {
            "value": 20
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
            "value": 20
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
            "value": 10
          },
          "velocity": {
            "value": 0
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
            "value": 24
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
          "bpm": 111,
          "subdivision": 4,
          "swing": 0,
          "gate": 92,
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
                "note": 29,
                "velocity": 100
              },
              {
                "index": 2,
                "note": 30,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 3,
                "note": 30,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 4,
                "note": 30,
                "velocity": 100
              },
              {
                "index": 5,
                "note": 30,
                "velocity": 100
              },
              {
                "index": 6,
                "note": 29,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 7,
                "note": 29,
                "velocity": 100
              },
              {
                "index": 8,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 9,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 10,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 11,
                "note": 27,
                "velocity": 100
              },
              {
                "index": 14,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 15,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 16,
                "note": 34,
                "velocity": 100
              },
              {
                "index": 18,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 19,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 20,
                "note": 32,
                "velocity": 100
              },
              {
                "index": 21,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 22,
                "note": 32,
                "velocity": 100
              },
              {
                "index": 23,
                "note": 33,
                "velocity": 100
              },
              {
                "index": 24,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 25,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 26,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 27,
                "note": 34,
                "velocity": 100
              },
              {
                "index": 30,
                "note": 29,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 31,
                "note": 29,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 32,
                "note": 29,
                "velocity": 100
              },
              {
                "index": 34,
                "note": 30,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 35,
                "note": 30,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 36,
                "note": 30,
                "velocity": 100
              },
              {
                "index": 37,
                "note": 30,
                "velocity": 100
              },
              {
                "index": 38,
                "note": 29,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 39,
                "note": 29,
                "velocity": 100
              },
              {
                "index": 40,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 41,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 42,
                "note": 27,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 43,
                "note": 27,
                "velocity": 100
              },
              {
                "index": 44,
                "note": 34,
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
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 47,
                "note": 34,
                "velocity": 100
              },
              {
                "index": 50,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 51,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 52,
                "note": 32,
                "velocity": 100
              },
              {
                "index": 53,
                "note": 32,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 54,
                "note": 32,
                "velocity": 100
              },
              {
                "index": 55,
                "note": 33,
                "velocity": 100
              },
              {
                "index": 56,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 57,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 58,
                "note": 34,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 59,
                "note": 34,
                "velocity": 100
              },
              {
                "index": 62,
                "note": 29,
                "velocity": 100,
                "slide": true
              },
              {
                "index": 63,
                "note": 29,
                "velocity": 100,
                "slide": true
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
          "bpm": 111,
          "subdivision": 4,
          "swing": 44,
          "gate": 100,
          "direction": 0,
          "loop": true,
          "outputChannel": 0,
          "switchMode": 1,
          "metronome": false,
          "key": 1,
          "scale": 0,
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
                "index": 0,
                "degree": 4,
                "velocity": 100
              },
              {
                "index": 3,
                "degree": 3,
                "velocity": 100
              },
              {
                "index": 6,
                "degree": 2,
                "velocity": 100
              },
              {
                "index": 10,
                "degree": 4,
                "velocity": 100,
                "quality": 4
              },
              {
                "index": 16,
                "degree": 4,
                "velocity": 100
              },
              {
                "index": 19,
                "degree": 5,
                "velocity": 100
              },
              {
                "index": 22,
                "degree": 6,
                "velocity": 100
              },
              {
                "index": 26,
                "degree": 3,
                "velocity": 100
              },
              {
                "index": 32,
                "degree": 4,
                "velocity": 100
              },
              {
                "index": 35,
                "degree": 2,
                "velocity": 100,
                "quality": 5
              },
              {
                "index": 38,
                "degree": 4,
                "velocity": 100,
                "quality": 16
              },
              {
                "index": 42,
                "degree": 2,
                "velocity": 100,
                "quality": 19
              },
              {
                "index": 48,
                "degree": 2,
                "velocity": 100
              },
              {
                "index": 51,
                "degree": 5,
                "velocity": 100
              },
              {
                "index": 54,
                "degree": 6,
                "velocity": 100
              },
              {
                "index": 58,
                "degree": 3,
                "velocity": 100
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
            "value": 35
          },
          "punch": {
            "value": 60
          },
          "decay": {
            "value": 55
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
            "value": 55
          },
          "snap": {
            "value": 85
          },
          "decay": {
            "value": 60
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
            "value": 60
          },
          "decay": {
            "value": 45
          },
          "level": {
            "value": 80
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
            "value": 72
          },
          "chDecay": {
            "value": 40
          },
          "chLevel": {
            "value": 100
          },
          "ohDecay": {
            "value": 50
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
            "value": 70
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
            "value": 50
          },
          "decay": {
            "value": 40
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
            "value": 90
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
          "bpm": 111,
          "subdivision": 4,
          "swing": 22,
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
                "velocity": 120
              },
              {
                "lane": 0,
                "index": 10,
                "velocity": 112
              },
              {
                "lane": 0,
                "index": 13,
                "velocity": 70
              },
              {
                "lane": 0,
                "index": 16,
                "velocity": 120
              },
              {
                "lane": 0,
                "index": 26,
                "velocity": 70
              },
              {
                "lane": 0,
                "index": 29,
                "velocity": 112
              },
              {
                "lane": 1,
                "index": 4,
                "velocity": 110
              },
              {
                "lane": 1,
                "index": 12,
                "velocity": 115
              },
              {
                "lane": 1,
                "index": 20,
                "velocity": 110
              },
              {
                "lane": 1,
                "index": 28,
                "velocity": 115
              },
              {
                "lane": 2,
                "index": 4,
                "velocity": 90
              },
              {
                "lane": 2,
                "index": 12,
                "velocity": 90
              },
              {
                "lane": 2,
                "index": 20,
                "velocity": 90
              },
              {
                "lane": 2,
                "index": 28,
                "velocity": 90
              },
              {
                "lane": 4,
                "index": 0,
                "velocity": 90
              },
              {
                "lane": 4,
                "index": 2,
                "velocity": 50
              },
              {
                "lane": 4,
                "index": 3,
                "velocity": 85
              },
              {
                "lane": 4,
                "index": 6,
                "velocity": 50
              },
              {
                "lane": 4,
                "index": 8,
                "velocity": 55
              },
              {
                "lane": 4,
                "index": 10,
                "velocity": 85
              },
              {
                "lane": 4,
                "index": 14,
                "velocity": 45
              },
              {
                "lane": 4,
                "index": 16,
                "velocity": 90
              },
              {
                "lane": 4,
                "index": 18,
                "velocity": 50
              },
              {
                "lane": 4,
                "index": 19,
                "velocity": 85
              },
              {
                "lane": 4,
                "index": 22,
                "velocity": 50
              },
              {
                "lane": 4,
                "index": 24,
                "velocity": 55
              },
              {
                "lane": 4,
                "index": 26,
                "velocity": 85
              },
              {
                "lane": 4,
                "index": 30,
                "velocity": 45
              },
              {
                "lane": 5,
                "index": 7,
                "velocity": 105
              },
              {
                "lane": 5,
                "index": 23,
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
    "bpm": 111
  },
  "mixer": {
    "master": 0.8,
    "click": 0.8
  }
};
