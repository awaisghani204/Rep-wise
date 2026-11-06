import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import type { RawPoseResult } from './types';

// Looks up the native "detectPose" plugin registered by PoseLandmarkerPackage.kt; undefined if not registered.
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});

/** Bridge_Method: runs native PoseLandmarker on one frame (worklet, frame processor thread). */
export function detectPose(frame: Frame): RawPoseResult {
  'worklet';
  if (plugin == null) {
    return {
      landmarks: [],
      latencyMs: 0,
      frameWidth: 0,
      frameHeight: 0,
      mirrored: false,
      error: 'Pose plugin "detectPose" is not registered',
    };
  }
  return plugin.call(frame) as unknown as RawPoseResult;
}
