import { LANDMARK_COUNT, SKELETON_JOINTS, SKELETON_SEGMENTS } from './constants';
import type { Landmark } from './landmarks';
import { mapPoint, type MappingParams } from './previewMapping';

/** Preview-space geometry for the Skeleton_Overlay. */
export interface SkeletonGeometry {
  lines: Array<{ from: number; to: number; x1: number; y1: number; x2: number; y2: number }>;
  dots: Array<{ index: number; x: number; y: number }>;
}

/**
 * Builds one line per SKELETON_SEGMENTS entry and one dot per SKELETON_JOINTS entry (in order),
 * positioned with mapPoint. Returns empty geometry when landmarks are incomplete or the frame
 * size is not positive (including NaN).
 */
export function buildSkeleton(lms: readonly Landmark[], p: MappingParams): SkeletonGeometry {
  if (lms.length < LANDMARK_COUNT || !(p.frameWidth > 0) || !(p.frameHeight > 0)) {
    return { lines: [], dots: [] };
  }
  const lines = SKELETON_SEGMENTS.map(([from, to]) => {
    const a = mapPoint(lms[from].x, lms[from].y, p);
    const b = mapPoint(lms[to].x, lms[to].y, p);
    return { from, to, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });
  const dots = SKELETON_JOINTS.map((index) => {
    const pt = mapPoint(lms[index].x, lms[index].y, p);
    return { index, x: pt.x, y: pt.y };
  });
  return { lines, dots };
}
