/**
 * Desk fader law (dsp-audit, item 5): the old linear-amplitude taper spent
 * the whole top half of the throw on 6 dB. This maps fader POSITION (0..1)
 * to linear amplitude through anchors, piecewise linear in dB — +6 dB
 * headroom at the top, unity at 3/4 throw, a long musical ride down, and a
 * true -inf at zero (the last 5% fades linearly in amplitude, since dB has
 * no zero).
 *
 * Strip STATE stays linear amplitude end to end — the law only shapes the
 * UI position <-> gain mapping, so persisted gains keep their meaning.
 */

const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  // [position, dB]
  [0.05, -60],
  [0.25, -30],
  [0.5, -12],
  [0.75, 0],
  [1.0, 6],
];

/** Amplitude at the top of the fader (+6 dB). */
export const MAX_FADER_GAIN = Math.pow(10, 6 / 20);

const FLOOR_POS = ANCHORS[0][0];
const FLOOR_GAIN = Math.pow(10, ANCHORS[0][1] / 20);

export function faderToGain(position: number): number {
  const p = Math.max(0, Math.min(1, position));
  if (p <= FLOOR_POS) return (p / FLOOR_POS) * FLOOR_GAIN;
  for (let i = 1; i < ANCHORS.length; i++) {
    const [p1, db1] = ANCHORS[i];
    if (p <= p1) {
      const [p0, db0] = ANCHORS[i - 1];
      const db = db0 + ((p - p0) / (p1 - p0)) * (db1 - db0);
      return Math.pow(10, db / 20);
    }
  }
  return MAX_FADER_GAIN;
}

export function gainToFader(gain: number): number {
  const g = Math.max(0, Math.min(MAX_FADER_GAIN, gain));
  if (g <= FLOOR_GAIN) return (g / FLOOR_GAIN) * FLOOR_POS;
  const db = 20 * Math.log10(g);
  for (let i = 1; i < ANCHORS.length; i++) {
    const [p1, db1] = ANCHORS[i];
    if (db <= db1) {
      const [p0, db0] = ANCHORS[i - 1];
      return p0 + ((db - db0) / (db1 - db0)) * (p1 - p0);
    }
  }
  return 1;
}
