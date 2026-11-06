import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { Camera, useCameraPermission } from 'react-native-vision-camera';

export type PermissionUiState = 'checking' | 'granted' | 'denied';

/**
 * Requests camera permission once on mount and re-checks it on every return to foreground.
 * `state` is 'checking' until the first request resolves, then 'granted' or 'denied'.
 */
export function useCameraPermissionGate(isForeground: boolean): {
  state: PermissionUiState;
  openSettings: () => void;
} {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [state, setState] = useState<PermissionUiState>(hasPermission ? 'granted' : 'checking');
  // Ensures the system prompt is shown at most once per session (also under StrictMode double effects).
  const requestedRef = useRef(false);
  const mountedRef = useRef(true);
  const wasForegroundRef = useRef(isForeground);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Request permission once on mount if not already granted (Requirement 3.1).
  useEffect(() => {
    if (hasPermission) {
      setState('granted');
      return;
    }
    if (requestedRef.current) return;
    requestedRef.current = true;
    requestPermission()
      .then((granted) => {
        if (mountedRef.current) setState(granted ? 'granted' : 'denied');
      })
      .catch(() => {
        if (mountedRef.current) setState('denied');
      });
    // Only the initial mount should trigger the request; later changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep state in sync when the VisionCamera hook reports permission was granted.
  useEffect(() => {
    if (hasPermission) setState('granted');
  }, [hasPermission]);

  // Re-check on each background -> foreground transition, e.g. after granting in Settings (Requirement 3.5).
  useEffect(() => {
    const wasForeground = wasForegroundRef.current;
    wasForegroundRef.current = isForeground;
    if (!isForeground || wasForeground) return;
    // Synchronous in VisionCamera 4.x: 'granted' | 'not-determined' | 'denied' | 'restricted'.
    const status = Camera.getCameraPermissionStatus();
    if (status === 'granted') {
      setState('granted');
    } else {
      // Do not pre-empt the first request: 'checking' stays until requestPermission() resolves.
      setState((prev) => (prev === 'checking' ? 'checking' : 'denied'));
    }
  }, [isForeground]);

  /** Opens the Android app settings page so the user can grant camera access (Requirement 3.4). */
  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      // Ignored: nothing useful to do if the settings page cannot be opened.
    });
  }, []);

  return { state, openSettings };
}
