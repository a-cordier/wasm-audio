import { MAX_FADER_GAIN } from "./fader-law";

/** Soft cap on mixer channels — strips must stay usable at desk width. */
export const MAX_CHANNELS = 16;

/** Reserved strip ids for the fixed buses (regular channels use slot ids). */
export const MASTER_ID = "master";
export const CLICK_ID = "click";

/**
 * Per-channel strip settings. Owned by the engine while the device is
 * mounted, persisted with the SLOT (rack-storage) so a device's mix travels
 * with it across reloads.
 */
/** 3-band EQ settings — the insert chain's first resident. Gains in dB. */
export interface ChannelEqState {
  low: number;
  mid: number;
  /** Mid peak center, Hz (the shelf corners are fixed). */
  midFreq: number;
  high: number;
}

/** EQ voicing: fixed shelf corners, a sweepable mid, musical Q. */
export const EQ_GAIN_DB = 15;
export const EQ_LOW_SHELF_HZ = 120;
export const EQ_HIGH_SHELF_HZ = 8000;
export const EQ_MID_FREQ_MIN = 150;
export const EQ_MID_FREQ_MAX = 8000;
export const EQ_MID_FREQ_DEFAULT = 1000;
export const EQ_MID_Q = 0.9;

export function createDefaultEqState(): ChannelEqState {
  return { low: 0, mid: 0, midFreq: EQ_MID_FREQ_DEFAULT, high: 0 };
}

export interface ChannelStripState {
  /** Linear amplitude, 0..MAX_FADER_GAIN (+6 dB) — the fader law maps throw
   * position to this; persisted values stay plain amplitude. */
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  eq: ChannelEqState;
}

export function createDefaultStripState(): ChannelStripState {
  // Fresh channels sit at unity (0 dB, 3/4 throw) — the +6 dB headroom and
  // the master limiter make that the honest default. A flat EQ is identity.
  return { gain: 1, pan: 0, mute: false, solo: false, eq: createDefaultEqState() };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

/** Sanitize a persisted strip snapshot — unknown/legacy fields fall to defaults. */
export function sanitizeStripState(raw: unknown): ChannelStripState {
  const d = createDefaultStripState();
  const e = (raw ?? null) as Partial<ChannelStripState> | null;
  if (!e || typeof e !== "object") return d;
  // Pre-EQ sessions carry no eq section — they come back flat (identity).
  const eq = (e.eq ?? null) as Partial<ChannelEqState> | null;
  const deq = d.eq;
  return {
    gain: clampNumber(e.gain, 0, MAX_FADER_GAIN, d.gain),
    pan: clampNumber(e.pan, -1, 1, d.pan),
    mute: e.mute === true,
    solo: e.solo === true,
    eq: {
      low: clampNumber(eq?.low, -EQ_GAIN_DB, EQ_GAIN_DB, deq.low),
      mid: clampNumber(eq?.mid, -EQ_GAIN_DB, EQ_GAIN_DB, deq.mid),
      midFreq: clampNumber(eq?.midFreq, EQ_MID_FREQ_MIN, EQ_MID_FREQ_MAX, deq.midFreq),
      high: clampNumber(eq?.high, -EQ_GAIN_DB, EQ_GAIN_DB, deq.high),
    },
  };
}

/** Clamp a persisted bus level (master/click) to the fader's gain range. */
export function sanitizeBusGain(value: unknown, fallback: number): number {
  return clampNumber(value, 0, MAX_FADER_GAIN, fallback);
}
