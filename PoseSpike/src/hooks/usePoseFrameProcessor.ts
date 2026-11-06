import { useMemo } from 'react';
import { useFrameProcessor, type ReadonlyFrameProcessor } from 'react-native-vision-camera';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import { detectPose, type RawPoseResult } from 'pose-landmarker';
import { shouldDeliver } from '../pose/throttle';

/**
 * Sentinel for "no delivery yet". A large negative finite number is used instead of
 * -Infinity so the value survives the worklets-core shared-value wrapper unchanged; it is
 * far enough below any frame timestamp that the first frame always passes the throttle.
 */
const NO_DELIVERY_YET_MS = -1e12;

/** Nanoseconds per millisecond, for converting Android frame timestamps. */
const NS_PER_MS = 1e6;

/**
 * Returns a frame processor that throttles to at most 30 calls per second, runs the native
 * pose plugin on each accepted frame, drops results produced while the landmarker is
 * suspended, and hands every other result to `onResult` on the JS_Thread.
 *
 * `onResult` must be referentially stable (wrap it in `useCallback`); a new function
 * re-creates the JS hop and the frame processor.
 */
export function usePoseFrameProcessor(
  onResult: (r: RawPoseResult) => void,
): ReadonlyFrameProcessor {
  const lastDeliveryMs = useSharedValue(NO_DELIVERY_YET_MS);

  // Bridge_Method: hops a Landmark_Result from the frame processor thread to the JS_Thread.
  const onResultJS = useMemo(() => Worklets.createRunOnJS(onResult), [onResult]);

  return useFrameProcessor(
    (frame) => {
      'worklet';
      // Throttle on the camera capture time rather than Date.now(): on Android,
      // Frame.timestamp is CameraX ImageInfo.getTimestamp() in nanoseconds, which is
      // monotonic, available in every worklet runtime, and is the same clock the native
      // plugin uses for MediaPipe VIDEO-mode timestamps.
      const nowMs = frame.timestamp / NS_PER_MS;
      if (!shouldDeliver(nowMs, lastDeliveryMs.value)) return;
      lastDeliveryMs.value = nowMs;

      const result = detectPose(frame);
      if (result.suspended) return;
      onResultJS(result);
    },
    [onResultJS, lastDeliveryMs],
  );
}
