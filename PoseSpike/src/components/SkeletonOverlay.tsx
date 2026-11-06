import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { Landmark } from '../pose/landmarks';
import { buildSkeleton } from '../pose/skeleton';

const COLOR = '#00FF88';

/** Props: decoded landmarks plus the Preview_Mapping inputs (view size, upright frame size, mirroring). */
export interface SkeletonOverlayProps {
  landmarks: readonly Landmark[];
  viewWidth: number;
  viewHeight: number;
  frameWidth: number;
  frameHeight: number;
  mirrored: boolean;
}

/**
 * Draws the pose skeleton (lines between SKELETON_SEGMENTS, dots on SKELETON_JOINTS) over the
 * camera preview. Renders an empty, touch-transparent Svg when there are no landmarks.
 */
function SkeletonOverlayImpl({
  landmarks,
  viewWidth,
  viewHeight,
  frameWidth,
  frameHeight,
  mirrored,
}: SkeletonOverlayProps) {
  const geometry = useMemo(
    () => buildSkeleton(landmarks, { viewWidth, viewHeight, frameWidth, frameHeight, mirrored }),
    [landmarks, viewWidth, viewHeight, frameWidth, frameHeight, mirrored],
  );

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={viewWidth} height={viewHeight}>
      {geometry.lines.map((l) => (
        <Line
          key={`${l.from}-${l.to}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={COLOR}
          strokeWidth={3}
        />
      ))}
      {geometry.dots.map((d) => (
        <Circle key={`${d.index}`} cx={d.x} cy={d.y} r={5} fill={COLOR} />
      ))}
    </Svg>
  );
}

export const SkeletonOverlay = React.memo(SkeletonOverlayImpl);
