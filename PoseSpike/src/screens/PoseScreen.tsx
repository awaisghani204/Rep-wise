import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { PoseLandmarker, type RawPoseResult } from 'pose-landmarker';
import { PermissionDenied } from '../components/PermissionDenied';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { StatsPanel } from '../components/StatsPanel';
import { useAppForeground } from '../hooks/useAppForeground';
import { useCameraPermissionGate } from '../hooks/useCameraPermissionGate';
import { usePoseFrameProcessor } from '../hooks/usePoseFrameProcessor';
import {
  decodeLandmarks,
  keyLandmarkVisibility,
  modelErrorMessage,
  statusMessage,
  type Landmark,
} from '../pose/landmarks';
import { addSample, computeStats, resetStats, type StatsState } from '../pose/stats';

type CameraPosition = 'front' | 'back';

/** Decoded result kept in state: landmarks ([] or 33) plus the upright frame size in px. */
interface PoseFrame {
  landmarks: Landmark[];
  frameWidth: number;
  frameHeight: number;
}

const TARGET_FPS = 30;
const NOW_TICK_MS = 500;
const TOP_INSET = (StatusBar.currentHeight ?? 0) + 8;
const EMPTY_FRAME: PoseFrame = { landmarks: [], frameWidth: 0, frameHeight: 0 };

/** Bridge_Method wrapper: closes the native PoseLandmarker when the app goes to the background. */
function releaseLandmarker(): void {
  try {
    PoseLandmarker.release();
  } catch (e) {
    console.warn('PoseLandmarker.release failed', e);
  }
}

/** Bridge_Method wrapper: lets the native PoseLandmarker be re-created when the app returns to the foreground. */
function resumeLandmarker(): void {
  try {
    PoseLandmarker.resume();
  } catch (e) {
    console.warn('PoseLandmarker.resume failed', e);
  }
}

/** Pose_Screen: camera preview with skeleton overlay, stats, status message, and camera/reset controls. */
export function PoseScreen() {
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('front');
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [latest, setLatest] = useState<PoseFrame>(EMPTY_FRAME);
  const [stats, setStats] = useState<StatsState>(resetStats);
  const [modelError, setModelError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isForeground = useAppForeground(releaseLandmarker, resumeLandmarker);
  const { state: permission, openSettings } = useCameraPermissionGate(isForeground);

  /** Receives each Landmark_Result from the Pose_Plugin on the JS_Thread (target of the Bridge_Method hop). */
  const onResult = useCallback((r: RawPoseResult) => {
    if (r.error) {
      setModelError(r.error);
      setLatest(EMPTY_FRAME);
      return;
    }
    setModelError(null);
    setLatest({
      landmarks: decodeLandmarks(r.landmarks),
      frameWidth: r.frameWidth,
      frameHeight: r.frameHeight,
    });
    setStats((s) => addSample(s, Date.now(), r.latencyMs));
  }, []);

  const frameProcessor = usePoseFrameProcessor(onResult);

  const device = useCameraDevice(cameraPosition);
  const format = useCameraFormat(device, [
    { fps: TARGET_FPS },
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const fps = format ? Math.min(TARGET_FPS, format.maxFps) : TARGET_FPS;

  // Tick so the displayed stats age out when Landmark_Events stop arriving.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), NOW_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Requirement 8.2: clear stats and the stale skeleton whenever the active camera changes.
  useEffect(() => {
    setStats(resetStats());
    setLatest(EMPTY_FRAME);
  }, [cameraPosition]);

  const onToggleCamera = useCallback(() => {
    setCameraPosition((p) => (p === 'front' ? 'back' : 'front'));
  }, []);

  const onResetStats = useCallback(() => {
    setStats(resetStats());
    setNow(Date.now());
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  }, []);

  const view = useMemo(() => computeStats(stats, now), [stats, now]);
  const keyVisibility = keyLandmarkVisibility(latest.landmarks);
  const status = statusMessage(latest.landmarks);

  if (permission === 'checking') {
    return (
      <View style={styles.centered}>
        <Text style={styles.smallText}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (permission === 'denied') {
    return <PermissionDenied onOpenSettings={openSettings} />;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {device == null ? (
        <View style={styles.centered}>
          <Text style={styles.smallText}>{`No ${cameraPosition} camera found`}</Text>
        </View>
      ) : (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            fps={fps}
            isActive={isForeground && permission === 'granted'}
            pixelFormat="rgb"
            resizeMode="cover"
            frameProcessor={frameProcessor}
          />
          <SkeletonOverlay
            landmarks={latest.landmarks}
            viewWidth={viewSize.width}
            viewHeight={viewSize.height}
            frameWidth={latest.frameWidth}
            frameHeight={latest.frameHeight}
            mirrored={cameraPosition === 'front'}
          />
        </>
      )}

      <View style={styles.topLeft} pointerEvents="none">
        <StatsPanel fps={view.fps} avgLatencyMs={view.avgLatencyMs} keyVisibility={keyVisibility} />
        <Text style={styles.status}>{status}</Text>
      </View>

      {modelError !== null && (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>{modelErrorMessage(modelError)}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          onPress={onToggleCamera}
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Switch camera</Text>
        </Pressable>
        <Pressable
          onPress={onResetStats}
          accessibilityRole="button"
          accessibilityLabel="Reset stats"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Reset stats</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallText: {
    color: '#fff',
    fontSize: 14,
  },
  topLeft: {
    position: 'absolute',
    top: TOP_INSET,
    left: 12,
    alignItems: 'flex-start',
  },
  status: {
    marginTop: 6,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: TOP_INSET + 120,
    backgroundColor: 'rgba(180,0,0,0.85)',
    padding: 10,
    borderRadius: 4,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
