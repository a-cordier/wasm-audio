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
export interface ChannelStripState {
  /** Linear amplitude 0..1. */
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export function createDefaultStripState(): ChannelStripState {
  return { gain: 0.8, pan: 0, mute: false, solo: false };
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
  return {
    gain: clampNumber(e.gain, 0, 1, d.gain),
    pan: clampNumber(e.pan, -1, 1, d.pan),
    mute: e.mute === true,
    solo: e.solo === true,
  };
}

/** Clamp a persisted bus level (master/click) to the unit gain range. */
export function sanitizeBusGain(value: unknown, fallback: number): number {
  return clampNumber(value, 0, 1, fallback);
}
