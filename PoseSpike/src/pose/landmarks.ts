import {
  KEY_LANDMARKS,
  LANDMARK_COUNT,
  STATUS_NOT_VISIBLE,
  STATUS_VISIBLE,
  VALUES_PER_LANDMARK,
  VISIBILITY_THRESHOLD,
} from './constants';

/** One pose landmark: x and y normalized to the upright frame, z relative depth, visibility in [0,1]. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

const FLAT_LENGTH = LANDMARK_COUNT * VALUES_PER_LANDMARK;
const MODEL_ERROR_PREFIX = 'Model failed to load';

/** Decodes the plugin's flat 132-number array into 33 landmarks; any other length yields []. */
export function decodeLandmarks(flat: readonly number[]): Landmark[] {
  if (flat.length !== FLAT_LENGTH) return [];
  const out: Landmark[] = new Array(LANDMARK_COUNT);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const o = i * VALUES_PER_LANDMARK;
    out[i] = { x: flat[o], y: flat[o + 1], z: flat[o + 2], visibility: flat[o + 3] };
  }
  return out;
}

/** Encodes landmarks into the flat [x, y, z, visibility, ...] layout (test helper, mirrors the Kotlin flattening). */
export function encodeLandmarks(lms: readonly Landmark[]): number[] {
  const out: number[] = [];
  for (const lm of lms) out.push(lm.x, lm.y, lm.z, lm.visibility);
  return out;
}

/** Mean visibility of KEY_LANDMARKS, or null when landmarks are empty or incomplete. */
export function keyLandmarkVisibility(lms: readonly Landmark[]): number | null {
  if (lms.length < LANDMARK_COUNT) return null;
  let sum = 0;
  for (const i of KEY_LANDMARKS) sum += lms[i].visibility;
  return sum / KEY_LANDMARKS.length;
}

/** True iff landmarks are non-empty and every KEY_LANDMARK visibility is strictly > VISIBILITY_THRESHOLD. */
export function isFullBodyVisible(lms: readonly Landmark[]): boolean {
  if (lms.length < LANDMARK_COUNT) return false;
  return KEY_LANDMARKS.every((i) => lms[i].visibility > VISIBILITY_THRESHOLD);
}

/** Status_Message text for the given landmarks. */
export function statusMessage(lms: readonly Landmark[]): string {
  return isFullBodyVisible(lms) ? STATUS_VISIBLE : STATUS_NOT_VISIBLE;
}

/** Formats visibility clamped to [0,1] with two decimals, or "--" for null. */
export function formatVisibility(v: number | null): string {
  if (v === null || Number.isNaN(v)) return '--';
  return Math.min(1, Math.max(0, v)).toFixed(2);
}

/** User-facing model-load error text; always starts with "Model failed to load". */
export function modelErrorMessage(raw: string): string {
  if (raw.startsWith(MODEL_ERROR_PREFIX)) return raw;
  const detail = raw.trim();
  return detail.length > 0 ? `${MODEL_ERROR_PREFIX}: ${detail}` : MODEL_ERROR_PREFIX;
}
