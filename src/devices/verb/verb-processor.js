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

// VERB's tank — the first worklet-based effect. An 8-line feedback delay
// network: input is mono-summed, diffused through two series allpasses, and
// injected into eight mutually-prime delay lines mixed each sample by a
// Hadamard butterfly (unitary — the matrix is lossless, so DECAY alone sets
// the energy loss). Per-line one-pole damping darkens each pass (DAMP); the
// per-line feedback gain realizes DECAY as a T60 (g = 10^(-3·len/(T60·fs))).
// Even lines sum to L, odd to R — the lengths decorrelate the two sides.
//
// Params arrive as port messages (raw 0..127) — not SharedParamBuffer, which
// is the instrument contract. DECAY/DAMP targets are smoothed by ~10 ms
// one-poles per block; SIZE glides the read offsets through a slow per-sample
// one-pole with fractional reads — the glide IS the tape pitch-bend, same
// aesthetic as ECHO's TIME ramp.

/** Mutually-prime line lengths in samples at 48 kHz (~23..81 ms), scaled to
 * the real sample rate at construction and by SIZE at run time. */
const BASE_LENGTHS = [1123, 1361, 1693, 2029, 2437, 2861, 3299, 3907];
const LINES = BASE_LENGTHS.length;
/** Input diffusers (series Schroeder allpasses), fixed length. */
const AP_LENGTHS = [142, 379];
const AP_G = 0.55;

// Raw 0..127 → real units (mirrors the controller's node-boundary idiom;
// the raw values travel the port so saved state stays unit-free).
const SIZE_MIN = 0.25; // ×BASE at raw 0 (~6..20 ms — a closet)
const SIZE_SPAN = 10; // ×10 across the throw (raw 127 ≈ 2.5× — a hall)
const sizeScale = (raw) => SIZE_MIN * Math.pow(SIZE_SPAN, raw / 127);
const t60Seconds = (raw) => 0.3 * Math.pow(40, raw / 127); // 0.3..12 s, log
const dampHz = (raw) => 14000 * Math.pow(800 / 14000, raw / 127); // 14 kHz..800 Hz

/** No FTZ in the worklet scope either — flush at every feedback-state write. */
const flush = (v) => (v > -1e-15 && v < 1e-15 ? 0 : v);

class VerbProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // All mutable state per instance — module scope is shared across mounts.
    this._alive = true;
    const fsRatio = sampleRate / 48000;

    this._base = BASE_LENGTHS.map((n) => n * fsRatio);
    this._lines = this._base.map((len) => {
      const max = Math.ceil(len * SIZE_MIN * SIZE_SPAN) + 8;
      return { buf: new Float32Array(max), max, w: 0, lp: 0, g: 0 };
    });
    this._ap = AP_LENGTHS.map((n) => {
      const len = Math.max(4, Math.round(n * fsRatio));
      return { buf: new Float32Array(len), i: 0 };
    });
    this._out = new Float32Array(LINES);
    this._mix = new Float32Array(LINES);

    // Targets land raw over the port; smoothing happens here, in real units.
    const init = options?.processorOptions ?? {};
    this._sizeRaw = init.size ?? 60;
    this._decayRaw = init.decay ?? 55;
    this._dampRaw = init.damp ?? 45;
    // Snap the smoothed values to the initial targets — a fresh mount must
    // not sweep in from an arbitrary default.
    this._t60 = t60Seconds(this._decayRaw);
    this._dampA = 1 - Math.exp((-2 * Math.PI * dampHz(this._dampRaw)) / sampleRate);
    this._len = this._base.map((len, i) =>
      Math.min(len * sizeScale(this._sizeRaw), this._lines[i].max - 4)
    );

    // ~10 ms one-pole on DECAY/DAMP per 128-frame block; SIZE glides slower
    // per sample (~80 ms) — big room jumps bend pitch instead of clicking.
    this._blockAlpha = 1 - Math.exp(-(128 / sampleRate) / 0.01);
    this._glideK = 1 - Math.exp(-1 / (0.08 * sampleRate));

    this.port.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === "params") {
        this._sizeRaw = e.data.size;
        this._decayRaw = e.data.decay;
        this._dampRaw = e.data.damp;
      } else if (e.data.type === "__dispose") {
        // Returning false from process() lets the node be garbage collected.
        this._alive = false;
        this._lines = null;
        this._ap = null;
      }
    };
  }

  process(inputs, outputs) {
    if (!this._alive) return false;
    const outL = outputs[0][0];
    const outR = outputs[0][1] ?? outL;
    const n = outL.length;
    const inBus = inputs[0] ?? [];
    const inL = inBus[0];
    const inR = inBus[1] ?? inL;

    // Per-block param smoothing (recomputing 8 exps per block is nothing).
    const a = this._blockAlpha;
    this._t60 += a * (t60Seconds(this._decayRaw) - this._t60);
    const dampTarget = 1 - Math.exp((-2 * Math.PI * dampHz(this._dampRaw)) / sampleRate);
    this._dampA += a * (dampTarget - this._dampA);
    const scale = sizeScale(this._sizeRaw);
    // g = 10^(-3·len/(T60·fs)) as exp(c·len) — one log, eight exps.
    const c = (-3 * Math.LN10) / (this._t60 * sampleRate);

    const lines = this._lines;
    const len = this._len;
    const out = this._out;
    const mix = this._mix;
    const dampA = this._dampA;
    const glideK = this._glideK;

    for (let i = 0; i < LINES; i++) {
      lines[i].g = Math.exp(c * len[i]);
    }

    for (let s = 0; s < n; s++) {
      // Mono sum in, through the diffusers.
      let x = inL ? (inL[s] + inR[s]) * 0.5 : 0;
      for (let k = 0; k < this._ap.length; k++) {
        const ap = this._ap[k];
        const v = ap.buf[ap.i];
        const y = v - AP_G * x;
        ap.buf[ap.i] = flush(x + AP_G * y);
        ap.i = ap.i + 1 === ap.buf.length ? 0 : ap.i + 1;
        x = y;
      }

      // Fractional reads at the glided lengths.
      for (let i = 0; i < LINES; i++) {
        const L = lines[i];
        const target = Math.min(this._base[i] * scale, L.max - 4);
        len[i] += glideK * (target - len[i]);
        let rp = L.w - len[i];
        if (rp < 0) rp += L.max;
        const i0 = rp | 0;
        const i1 = i0 + 1 === L.max ? 0 : i0 + 1;
        const frac = rp - i0;
        out[i] = L.buf[i0] + (L.buf[i1] - L.buf[i0]) * frac;
      }

      // Hadamard butterfly (3 stages), normalized — unitary mix.
      for (let i = 0; i < 8; i += 2) {
        mix[i] = out[i] + out[i + 1];
        mix[i + 1] = out[i] - out[i + 1];
      }
      for (let i = 0; i < 8; i += 4) {
        for (let j = 0; j < 2; j++) {
          const p = mix[i + j];
          const q = mix[i + j + 2];
          mix[i + j] = p + q;
          mix[i + j + 2] = p - q;
        }
      }
      for (let j = 0; j < 4; j++) {
        const p = mix[j];
        const q = mix[j + 4];
        mix[j] = (p + q) * 0.35355339059327373; // 1/√8
        mix[j + 4] = (p - q) * 0.35355339059327373;
      }

      // Damp, decay, re-inject, write.
      let l = 0;
      let r = 0;
      for (let i = 0; i < LINES; i++) {
        const L = lines[i];
        L.lp = flush(L.lp + dampA * (mix[i] - L.lp));
        L.buf[L.w] = flush(x + L.g * L.lp);
        L.w = L.w + 1 === L.max ? 0 : L.w + 1;
        if (i & 1) r += out[i];
        else l += out[i];
      }
      outL[s] = l * 0.35;
      outR[s] = r * 0.35;
    }
    return true;
  }
}

registerProcessor("verb", VerbProcessor);
