import fc from 'fast-check';
import {
  KEY_LANDMARKS,
  LANDMARK_COUNT,
  VALUES_PER_LANDMARK,
  VISIBILITY_THRESHOLD,
} from '../constants';
import {
  decodeLandmarks,
  encodeLandmarks,
  formatVisibility,
  isFullBodyVisible,
  keyLandmarkVisibility,
  modelErrorMessage,
  statusMessage,
  type Landmark,
} from '../landmarks';
import { VISIBILITY_EPSILON, maybePoseArb, poseArb, visibilityArb } from './arbitraries';

const FLAT_LENGTH = LANDMARK_COUNT * VALUES_PER_LANDMARK;

describe('landmarks', () => {
  // Feature: pose-spike, Property 1: Landmark encoding round trip
  // **Validates: Requirements 4.3, 4.7**
  describe('Property 1: Landmark encoding round trip', () => {
    it('decodeLandmarks(encodeLandmarks(lms)) equals lms for any 33 landmarks', () => {
      fc.assert(
        fc.property(poseArb, (lms) => {
          const flat = encodeLandmarks(lms);
          expect(flat).toHaveLength(FLAT_LENGTH);
          expect(decodeLandmarks(flat)).toEqual(lms);
        }),
        { numRuns: 200 },
      );
    });

    it('round trip also holds for an empty pose (no person detected)', () => {
      fc.assert(
        fc.property(maybePoseArb, (lms) => {
          expect(decodeLandmarks(encodeLandmarks(lms))).toEqual(lms);
        }),
        { numRuns: 100 },
      );
    });

    it('any flat array whose length is not 132 decodes to []', () => {
      const wrongLengthArb = fc.oneof(
        // Lengths near 132, where off-by-one bugs would show up.
        fc.integer({ min: FLAT_LENGTH - 8, max: FLAT_LENGTH + 8 }),
        fc.integer({ min: 0, max: 400 }),
      )
        .filter((n) => n !== FLAT_LENGTH)
        .chain((n) =>
          fc.array(fc.double({ noNaN: true, noDefaultInfinity: true }), {
            minLength: n,
            maxLength: n,
          }),
        );
      fc.assert(
        fc.property(wrongLengthArb, (flat) => {
          expect(decodeLandmarks(flat)).toEqual([]);
        }),
        { numRuns: 200 },
      );
      expect(decodeLandmarks([])).toEqual([]);
    });
  });

  // Feature: pose-spike, Property 10: Key landmark visibility average and format
  // **Validates: Requirements 6.3**
  describe('Property 10: Key landmark visibility average and format', () => {
    it('keyLandmarkVisibility is the mean of the 10 key landmark visibilities, or null when empty', () => {
      fc.assert(
        fc.property(maybePoseArb, (lms) => {
          const v = keyLandmarkVisibility(lms);
          if (lms.length === 0) {
            expect(v).toBeNull();
            return;
          }
          const expected =
            KEY_LANDMARKS.reduce((sum, i) => sum + lms[i].visibility, 0) / KEY_LANDMARKS.length;
          expect(v).not.toBeNull();
          expect(Math.abs((v as number) - expected)).toBeLessThanOrEqual(1e-9);
        }),
        { numRuns: 200 },
      );
    });

    it('formatVisibility(v) for v in [0,1] has two decimals and is within 0.005 of v', () => {
      fc.assert(
        fc.property(visibilityArb, (v) => {
          const s = formatVisibility(v);
          expect(s).toMatch(/^[01]\.\d{2}$/);
          // Small extra slack for binary floating-point at exact .xx5 midpoints.
          expect(Math.abs(Number(s) - v)).toBeLessThanOrEqual(0.005 + 1e-9);
        }),
        { numRuns: 200 },
      );
    });

    it('formatted key visibility of any pose matches the format', () => {
      fc.assert(
        fc.property(poseArb, (lms) => {
          expect(formatVisibility(keyLandmarkVisibility(lms))).toMatch(/^[01]\.\d{2}$/);
        }),
        { numRuns: 100 },
      );
    });
  });

  // Feature: pose-spike, Property 11: Full-body status
  // **Validates: Requirements 7.1, 7.2**
  describe('Property 11: Full-body status', () => {
    // Exact strings hard-coded so a wording change in constants.ts is caught.
    const VISIBLE_TEXT = 'Body fully visible';
    const NOT_VISIBLE_TEXT = 'Move back or improve lighting';
    const KEYS = [11, 12, 13, 14, 23, 24, 25, 26, 27, 28];

    /** 33 landmarks with every visibility set to `v`. */
    const uniformPose = (v: number): Landmark[] =>
      Array.from({ length: LANDMARK_COUNT }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: v }));

    it('key landmark indices match the requirement', () => {
      expect([...KEY_LANDMARKS]).toEqual(KEYS);
    });

    it('statusMessage is "Body fully visible" iff non-empty and every key visibility > 0.6', () => {
      fc.assert(
        fc.property(maybePoseArb, (lms) => {
          const expectedVisible =
            lms.length > 0 && KEYS.every((i) => lms[i].visibility > 0.6);
          expect(isFullBodyVisible(lms)).toBe(expectedVisible);
          expect(statusMessage(lms)).toBe(expectedVisible ? VISIBLE_TEXT : NOT_VISIBLE_TEXT);
        }),
        { numRuns: 200 },
      );
    });

    it('poses whose key visibilities are all above the threshold are visible', () => {
      // Boundary-heavy draws rarely make all 10 keys pass, so force the true branch here.
      const aboveArb = fc.oneof(
        fc.constant(VISIBILITY_THRESHOLD + VISIBILITY_EPSILON),
        fc.double({ min: VISIBILITY_THRESHOLD + VISIBILITY_EPSILON, max: 1, noNaN: true }),
      );
      fc.assert(
        fc.property(poseArb, fc.array(aboveArb, { minLength: 10, maxLength: 10 }), (lms, vs) => {
          const pose = lms.map((lm) => ({ ...lm }));
          KEYS.forEach((k, j) => (pose[k].visibility = vs[j]));
          expect(statusMessage(pose)).toBe(VISIBLE_TEXT);
        }),
        { numRuns: 100 },
      );
    });

    it('empty landmark list is not visible', () => {
      expect(isFullBodyVisible([])).toBe(false);
      expect(statusMessage([])).toBe(NOT_VISIBLE_TEXT);
    });

    it('all key landmarks exactly 0.6 is not visible', () => {
      expect(statusMessage(uniformPose(0.6))).toBe(NOT_VISIBLE_TEXT);
    });

    it('all key landmarks at 0.6 + epsilon is visible', () => {
      expect(statusMessage(uniformPose(0.6 + VISIBILITY_EPSILON))).toBe(VISIBLE_TEXT);
    });

    it('wrists (15, 16) at 0 do not affect status when all keys are > 0.6', () => {
      const pose = uniformPose(0.9);
      pose[15].visibility = 0;
      pose[16].visibility = 0;
      expect(statusMessage(pose)).toBe(VISIBLE_TEXT);
    });

    it('one key landmark at exactly 0.6 makes the status not visible', () => {
      for (const k of KEYS) {
        const pose = uniformPose(0.9);
        pose[k].visibility = 0.6;
        expect(statusMessage(pose)).toBe(NOT_VISIBLE_TEXT);
      }
    });
  });

  // Unit tests for landmark helpers.
  // Requirements 4.6, 6.3
  describe('helpers', () => {
    it('modelErrorMessage prefixes raw errors with "Model failed to load"', () => {
      const msg = modelErrorMessage('boom');
      expect(msg.startsWith('Model failed to load')).toBe(true);
      expect(msg).toContain('boom');
    });

    it('modelErrorMessage returns already-prefixed messages unchanged', () => {
      expect(modelErrorMessage('Model failed to load: x')).toBe('Model failed to load: x');
    });

    it('modelErrorMessage of an empty string is the bare prefix', () => {
      expect(modelErrorMessage('')).toBe('Model failed to load');
    });

    it('formatVisibility shows "--" for null and NaN', () => {
      expect(formatVisibility(null)).toBe('--');
      expect(formatVisibility(NaN)).toBe('--');
    });

    it('formatVisibility clamps to [0,1] and rounds to two decimals', () => {
      expect(formatVisibility(1.5)).toBe('1.00');
      expect(formatVisibility(-0.2)).toBe('0.00');
      expect(formatVisibility(0.456)).toBe('0.46');
    });
  });
});
