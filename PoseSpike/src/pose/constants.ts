/** Number of landmarks MediaPipe PoseLandmarker returns per pose. */
export const LANDMARK_COUNT = 33;

/** Values per landmark in the flat bridge array: x, y, z, visibility. */
export const VALUES_PER_LANDMARK = 4;

/** Shoulders, elbows, hips, knees, ankles (wrists excluded). */
export const KEY_LANDMARKS = [11, 12, 13, 14, 23, 24, 25, 26, 27, 28] as const;

/** Landmarks drawn as dots: shoulders, elbows, wrists, hips, knees, ankles. */
export const SKELETON_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] as const;

/** Landmark index pairs drawn as lines by the skeleton overlay. */
export const SKELETON_SEGMENTS: ReadonlyArray<readonly [number, number]> = [
  [11, 12], [11, 13], [12, 14], [13, 15], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
];

/** A key landmark counts as visible only when its visibility is strictly above this. */
export const VISIBILITY_THRESHOLD = 0.6;

/** Upper bound on Landmark_Events delivered to the JS thread per second. */
export const MAX_EVENTS_PER_SECOND = 30;

/** Sliding window length for FPS and latency stats. */
export const STATS_WINDOW_MS = 2000;

export const STATUS_VISIBLE = 'Body fully visible';
export const STATUS_NOT_VISIBLE = 'Move back or improve lighting';
