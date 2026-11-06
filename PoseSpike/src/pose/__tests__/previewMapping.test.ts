import fc from 'fast-check';
import { mapPoint } from '../previewMapping';
import { mappingArb } from './arbitraries';

/** Normalized coordinate, slightly beyond [0,1] to cover off-frame joints. */
const normArb = fc.double({ min: -0.2, max: 1.2, noNaN: true });

/** Floating-point closeness with a tolerance relative to the magnitude. */
const close = (a: number, b: number, eps = 1e-6) =>
  Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

describe('mapPoint', () => {
  // Feature: pose-spike, Property 5: Front-camera mirroring is a horizontal reflection
  // **Validates: Requirements 5.4, 5.5**
  it('mirrored x is viewWidth minus unmirrored x, and y is unchanged', () => {
    fc.assert(
      fc.property(mappingArb, normArb, normArb, (p, nx, ny) => {
        const plain = mapPoint(nx, ny, { ...p, mirrored: false });
        const mirrored = mapPoint(nx, ny, { ...p, mirrored: true });
        expect(close(mirrored.x, p.viewWidth - plain.x)).toBe(true);
        expect(close(mirrored.y, plain.y)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: pose-spike, Property 6: Aspect-fill mapping
  // **Validates: Requirements 5.3, 5.5**
  describe('Property 6: Aspect-fill mapping', () => {
    const unmirrored = mappingArb.map((p) => ({ ...p, mirrored: false }));

    it('agrees with the reference aspect-fill formula', () => {
      fc.assert(
        fc.property(unmirrored, normArb, normArb, (p, nx, ny) => {
          const scale = Math.max(p.viewWidth / p.frameWidth, p.viewHeight / p.frameHeight);
          const sw = p.frameWidth * scale;
          const sh = p.frameHeight * scale;
          const ex = (p.viewWidth - sw) / 2 + nx * sw;
          const ey = (p.viewHeight - sh) / 2 + ny * sh;
          const got = mapPoint(nx, ny, p);
          expect(close(got.x, ex)).toBe(true);
          expect(close(got.y, ey)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });

    it('maps the frame centre to the view centre', () => {
      fc.assert(
        fc.property(unmirrored, (p) => {
          const c = mapPoint(0.5, 0.5, p);
          expect(close(c.x, p.viewWidth / 2)).toBe(true);
          expect(close(c.y, p.viewHeight / 2)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });

    it('scaled frame covers the view, touching the edges on the non-cropped axis', () => {
      fc.assert(
        fc.property(unmirrored, (p) => {
          const tl = mapPoint(0, 0, p);
          const br = mapPoint(1, 1, p);
          const tol = (v: number) => 1e-6 * Math.max(1, Math.abs(v));
          // Corners lie at or outside the view rectangle on both axes.
          expect(tl.x).toBeLessThanOrEqual(tol(p.viewWidth));
          expect(tl.y).toBeLessThanOrEqual(tol(p.viewHeight));
          expect(br.x).toBeGreaterThanOrEqual(p.viewWidth - tol(p.viewWidth));
          expect(br.y).toBeGreaterThanOrEqual(p.viewHeight - tol(p.viewHeight));
          // On at least one axis the corners land exactly on the view edges.
          const xExact = close(tl.x + p.viewWidth, p.viewWidth) && close(br.x, p.viewWidth);
          const yExact = close(tl.y + p.viewHeight, p.viewHeight) && close(br.y, p.viewHeight);
          expect(xExact || yExact).toBe(true);
          // Uniform scale: same px-per-unit on both axes.
          expect(close((br.x - tl.x) / p.frameWidth, (br.y - tl.y) / p.frameHeight)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });

    it('is strictly increasing in nx', () => {
      const pairArb = fc
        .tuple(normArb, normArb)
        .filter(([a, b]) => Math.abs(a - b) >= 1e-6)
        .map(([a, b]): [number, number] => (a < b ? [a, b] : [b, a]));
      fc.assert(
        fc.property(unmirrored, pairArb, normArb, (p, [nx1, nx2], ny) => {
          expect(mapPoint(nx1, ny, p).x).toBeLessThan(mapPoint(nx2, ny, p).x);
        }),
        { numRuns: 200 },
      );
    });
  });
});
