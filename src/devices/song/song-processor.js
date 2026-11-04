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

// SONG's processor is not a voice — it is a throttle-proof metronome, cloned
// from MOTION's (the tick-clock idiom; a third consumer earns an extraction).
// All scene/chain state lives in the controller (main thread); this clock
// only posts the audio-thread frame at control rate, so the song keeps
// advancing while the tab is hidden (main-thread timers clamp to ~1 Hz
// there; worklet port messages do not). Its silent output is pulled through
// a 0-gain tap, or process() never runs.

const TICK_FRAMES = 512; // ~10.7 ms @ 48 kHz — plenty inside the dispatch window

class SongClock extends AudioWorkletProcessor {
  constructor() {
    super();
    // All mutable state per instance — module scope is shared across mounts.
    this._alive = true;
    this._running = false;
    this._nextTick = 0;
    this.port.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === "__run") {
        this._running = !!e.data.on;
        this._nextTick = 0; // first tick lands on the next block
      } else if (e.data.type === "__dispose") {
        // Returning false from process() lets the node be garbage collected.
        this._alive = false;
      }
    };
  }

  process(_inputs, _outputs) {
    if (!this._alive) return false;
    if (!this._running) return true;
    if (currentFrame >= this._nextTick) {
      this.port.postMessage({ type: "__tick", frame: currentFrame });
      this._nextTick = currentFrame + TICK_FRAMES;
    }
    return true;
  }
}

registerProcessor("song", SongClock);
