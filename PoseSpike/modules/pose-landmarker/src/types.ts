/** Raw Landmark_Result as returned by the native plugin. */
export interface RawPoseResult {
  landmarks: number[]; // length 0 or 132: [x0, y0, z0, v0, x1, ...]
  latencyMs: number; // Native_Latency of the Pose_Call in ms
  frameWidth: number; // upright frame width in px
  frameHeight: number; // upright frame height in px
  mirrored: boolean; // frame.isMirrored, diagnostics only
  error?: string; // set only when the model failed to load
  suspended?: boolean; // true only while the landmarker is released for background
}
