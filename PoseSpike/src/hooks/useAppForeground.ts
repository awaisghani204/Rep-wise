import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Tracks whether the app is in the foreground and runs lifecycle callbacks on transitions.
 *
 * PoseScreen passes `PoseLandmarker.release` as `onBackground` and `PoseLandmarker.resume`
 * as `onForeground`. Both are Bridge_Methods into the native Pose_Module, so the native
 * PoseLandmarker is closed while backgrounded and re-created on the next frame after return.
 *
 * State handling:
 * - Returns `true` only while `AppState` is `'active'`. Any other state (`'background'`,
 *   `'inactive'`, ...) returns `false`, which deactivates the camera.
 * - `onBackground` is called once, on the transition into `'background'`. A sequence like
 *   active -> inactive -> background calls it once. Android rarely reports `'inactive'`, and
 *   a brief `'inactive'` (for example the notification shade on iOS-like flows) only pauses
 *   the camera without releasing the model.
 * - `onForeground` is called once per return to `'active'`, and only if `onBackground` ran
 *   since the last return.
 *
 * Ordering: on background, `isForeground` is set to false before `onBackground()` runs.
 * On foreground, `onForeground()` runs before `isForeground` is set to true.
 *
 * Callbacks are kept in refs, so changing their identity does not resubscribe.
 */
export function useAppForeground(onBackground: () => void, onForeground: () => void): boolean {
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  const onBackgroundRef = useRef(onBackground);
  const onForegroundRef = useRef(onForeground);
  const backgroundedRef = useRef(false);

  useEffect(() => {
    onBackgroundRef.current = onBackground;
    onForegroundRef.current = onForeground;
  }, [onBackground, onForeground]);

  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next === 'active') {
        if (backgroundedRef.current) {
          backgroundedRef.current = false;
          onForegroundRef.current();
        }
        setIsForeground(true);
        return;
      }
      setIsForeground(false);
      if (next === 'background' && !backgroundedRef.current) {
        backgroundedRef.current = true;
        onBackgroundRef.current();
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  return isForeground;
}
