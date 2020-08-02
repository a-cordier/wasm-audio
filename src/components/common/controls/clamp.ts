export function clamp(range, value) {
  if (value >= range.max) return range.max;
  if (value <= range.min) return range.min;
  return value;
}
