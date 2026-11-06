// Shared fast-check generators for src/pose property tests (not a test suite).
import fc from 'fast-check';
import { LANDMARK_COUNT, VISIBILITY_THRESHOLD } from '../constants';

/** Structural copy of the design's Landmark interface (landmarks.ts). */
export interface ArbLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/** Structural copy of the design's MappingParams interface (previewMapping.ts). */
export interface ArbMappingParams {
  viewWidth: number;
  viewHeight: number;
  frameWidth: number;
  frameHeight: number;
  mirrored: boolean;
}

/** Small offset used to probe both sides of the visibility threshold. */
export const VISIBILITY_EPSILON = 1e-6;

const finite = (min: number, max: number) => fc.double({ min, max, noNaN: true });

/** Visibility in [0,1], weighted toward 0.6, 0.6 ± ε, 0, and 1. */
export const visibilityArb: fc.Arbitrary<number> = fc.oneof(
  { arbitrary: finite(0, 1), weight: 4 },
  { arbitrary: fc.constant(VISIBILITY_THRESHOLD), weight: 2 },
  { arbitrary: fc.constant(VISIBILITY_THRESHOLD + VISIBILITY_EPSILON), weight: 1 },
  { arbitrary: fc.constant(VISIBILITY_THRESHOLD - VISIBILITY_EPSILON), weight: 1 },
  { arbitrary: fc.constant(0), weight: 1 },
  { arbitrary: fc.constant(1), weight: 1 },
);

/** One landmark: x, y slightly beyond [0,1] (off-frame joints), z in [-1,1]. */
export const landmarkArb: fc.Arbitrary<ArbLandmark> = fc.record({
  x: finite(-0.2, 1.2),
  y: finite(-0.2, 1.2),
  z: finite(-1, 1),
  visibility: visibilityArb,
});

/** Exactly 33 landmarks. */
export const poseArb: fc.Arbitrary<ArbLandmark[]> = fc.array(landmarkArb, {
  minLength: LANDMARK_COUNT,
  maxLength: LANDMARK_COUNT,
});

/** A full pose or an empty list (no person detected). */
export const maybePoseArb: fc.Arbitrary<ArbLandmark[]> = fc.oneof(
  { arbitrary: poseArb, weight: 4 },
  { arbitrary: fc.constant<ArbLandmark[]>([]), weight: 1 },
);

/** View 100–3000 and frame 100–4000 per side; covers portrait, landscape, square. */
export const mappingArb: fc.Arbitrary<ArbMappingParams> = fc
  .record({
    viewWidth: finite(100, 3000),
    viewHeight: finite(100, 3000),
    frameWidth: finite(100, 4000),
    frameHeight: finite(100, 4000),
    mirrored: fc.boolean(),
    square: fc.boolean(),
  })
  .map(({ square, ...p }) =>
    // Some cases force square aspects, which random sizes almost never hit.
    square ? { ...p, viewHeight: p.viewWidth, frameHeight: p.frameWidth } : p,
  );

/** Integer or fractional gap in [min, 200] ms. */
const gapArb = (min: number) =>
  fc.oneof(fc.integer({ min: Math.ceil(min), max: 200 }), finite(min, 200));

/** Builds sorted timestamps from a start and a list of gaps. */
const fromGaps = (start: number, gaps: number[]): number[] => {
  const out = [start];
  for (const g of gaps) out.push(out[out.length - 1] + g);
  return out;
};

/** Sorted non-decreasing ms timestamps with gaps of 0–200 ms (1–200 values). */
export const timestampsArb: fc.Arbitrary<number[]> = fc
  .tuple(fc.integer({ min: 0, max: 1_000_000 }), fc.array(gapArb(0), { maxLength: 199 }))
  .map(([start, gaps]) => fromGaps(start, gaps));

/** Strictly increasing ms timestamps with gaps in (0, 200] ms, for the throttle property. */
export const strictTimestampsArb: fc.Arbitrary<number[]> = fc
  .tuple(
    fc.integer({ min: 0, max: 1_000_000 }),
    fc.array(gapArb(0.001), { maxLength: 199 }),
  )
  .map(([start, gaps]) => fromGaps(start, gaps));
