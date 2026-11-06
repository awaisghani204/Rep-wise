import fc from 'fast-check';
import { LANDMARK_COUNT, SKELETON_JOINTS, SKELETON_SEGMENTS } from '../constants';
import { mapPoint } from '../previewMapping';
import { buildSkeleton } from '../skeleton';
import { mappingArb, poseArb } from './arbitraries';

/**
 * The user's expected segments, hard-coded so a change to SKELETON_SEGMENTS is caught:
 * shoulder–shoulder, shoulder–elbow ×2, elbow–wrist ×2, shoulder–hip ×2, hip–hip,
 * hip–knee ×2, knee–ankle ×2.
 */
const EXPECTED_SEGMENTS: Array<[number, number]> = [
  [11, 12], [11, 13], [12, 14], [13, 15], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
];

/** Shoulders, elbows, wrists, hips, knees, ankles. */
const EXPECTED_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

/** A frame size that buildSkeleton must treat as invalid: zero, negative, or NaN. */
const badSizeArb = fc.oneof(
  fc.constant(0),
  fc.constant(-0),
  fc.double({ min: -4000, max: -1e-6, noNaN: true }),
  fc.constant(Number.NaN),
);

describe('skeleton', () => {
  it('constants match the expected segment and joint lists', () => {
    expect(SKELETON_SEGMENTS.map(([a, b]) => [a, b])).toEqual(EXPECTED_SEGMENTS);
    expect([...SKELETON_JOINTS]).toEqual(EXPECTED_JOINTS);
  });

  // Feature: pose-spike, Property 3: Skeleton structure
  // **Validates: Requirements 5.1, 5.2, 5.6**
  it('Property 3: Skeleton structure', () => {
    fc.assert(
      fc.property(poseArb, mappingArb, (pose, params) => {
        const { lines, dots } = buildSkeleton(pose, params);

        // Exactly the 12 segments, in order.
        expect(lines).toHaveLength(12);
        expect(lines.map((l) => [l.from, l.to])).toEqual(EXPECTED_SEGMENTS);

        // Exactly the 12 joints as dots, in order; wrists included, nothing else.
        expect(dots).toHaveLength(12);
        const indices = dots.map((d) => d.index);
        expect(indices).toEqual(EXPECTED_JOINTS);
        expect(indices).toContain(15);
        expect(indices).toContain(16);
        for (let i = 0; i < LANDMARK_COUNT; i++) {
          if (!EXPECTED_JOINTS.includes(i)) expect(indices).not.toContain(i);
        }
      }),
      { numRuns: 100 },
    );

    // Empty landmark list: no lines, no dots, for any MappingParams.
    fc.assert(
      fc.property(mappingArb, (params) => {
        expect(buildSkeleton([], params)).toEqual({ lines: [], dots: [] });
      }),
      { numRuns: 100 },
    );

    // Invalid frame size (no frame yet / error result): no lines, no dots.
    fc.assert(
      fc.property(
        poseArb,
        mappingArb,
        badSizeArb,
        fc.constantFrom('width', 'height', 'both'),
        (pose, params, bad, which) => {
          const p = {
            ...params,
            frameWidth: which === 'height' ? params.frameWidth : bad,
            frameHeight: which === 'width' ? params.frameHeight : bad,
          };
          expect(buildSkeleton(pose, p)).toEqual({ lines: [], dots: [] });
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: pose-spike, Property 4: Skeleton positions come from Preview_Mapping
  // **Validates: Requirements 5.3**
  it('Property 4: Skeleton positions come from Preview_Mapping', () => {
    fc.assert(
      fc.property(poseArb, mappingArb, (pose, params) => {
        const { lines, dots } = buildSkeleton(pose, params);

        for (const line of lines) {
          const a = mapPoint(pose[line.from].x, pose[line.from].y, params);
          const b = mapPoint(pose[line.to].x, pose[line.to].y, params);
          expect(line.x1).toBeCloseTo(a.x, 9);
          expect(line.y1).toBeCloseTo(a.y, 9);
          expect(line.x2).toBeCloseTo(b.x, 9);
          expect(line.y2).toBeCloseTo(b.y, 9);
        }

        for (const dot of dots) {
          const pt = mapPoint(pose[dot.index].x, pose[dot.index].y, params);
          expect(dot.x).toBeCloseTo(pt.x, 9);
          expect(dot.y).toBeCloseTo(pt.y, 9);
        }
      }),
      { numRuns: 100 },
    );
  });
});
