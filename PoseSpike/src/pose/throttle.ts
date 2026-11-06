import { MAX_EVENTS_PER_SECOND } from './constants';

/**
 * Worklet: returns true iff at least 1000 / MAX_EVENTS_PER_SECOND ms have passed since
 * the last delivery. Uses `(now - last) * rate >= 1000` to avoid fractional intervals.
 * A `lastMs` of -Infinity (no delivery yet) always delivers; a NaN input never does.
 */
export function shouldDeliver(nowMs: number, lastMs: number): boolean {
  'worklet';
  if (Number.isNaN(nowMs)) return false;
  return (nowMs - lastMs) * MAX_EVENTS_PER_SECOND >= 1000;
}
