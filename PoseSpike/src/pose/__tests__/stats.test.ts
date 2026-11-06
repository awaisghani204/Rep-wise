import fc from 'fast-check';
import { STATS_WINDOW_MS } from '../constants';
import { addSample, computeStats, resetStats, type StatsState } from '../stats';
import { timestampsArb } from './arbitraries';

/** Non-decreasing timestamps, each paired with a latency in [0, 500] ms. */
const samplesArb = timestampsArb.chain((ts) =>
  fc
    .array(fc.double({ min: 0, max: 500, noNaN: true }), {
      minLength: ts.length,
      maxLength: ts.length,
    })
    .map((lat) => ts.map((t, i) => ({ t, latencyMs: lat[i] }))),
);

/** Folds addSample over the samples, starting from resetStats(). */
function build(samples: ReadonlyArray<{ t: number; latencyMs: number }>): StatsState {
  return samples.reduce((s, x) => addSample(s, x.t, x.latencyMs), resetStats());
}

describe('stats', () => {
  // Feature: pose-spike, Property 7: Latency average matches the 2-second window
  // **Validates: Requirements 6.2**
  it('Property 7: Latency average matches the 2-second window', () => {
    fc.assert(
      fc.property(
        samplesArb,
        // Offset of now past the last sample; up to 3000 ms so the window can empty out.
        fc.oneof(fc.constant(0), fc.integer({ min: 0, max: 3000 }), fc.double({ min: 0, max: 3000, noNaN: true })),
        (samples, offset) => {
          const now = samples[samples.length - 1].t + offset;
          const state = build(samples);

          const inWindow = samples.filter((x) => x.t > now - STATS_WINDOW_MS && x.t <= now);
          const expected =
            inWindow.length === 0
              ? null
              : inWindow.reduce((sum, x) => sum + x.latencyMs, 0) / inWindow.length;

          const actual = computeStats(state, now).avgLatencyMs;
          if (expected === null) {
            expect(actual).toBeNull();
          } else {
            expect(actual).not.toBeNull();
            expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(1e-9);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: pose-spike, Property 8: FPS measures the delivery rate
  // **Validates: Requirements 6.1**
  it('Property 8: FPS measures the delivery rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        // Constant period p in [10, 200] ms, integer or fractional.
        fc.oneof(fc.integer({ min: 10, max: 200 }), fc.double({ min: 10, max: 200, noNaN: true })),
        // k >= 2 samples; up to 400 so both warm-up and steady state are reached.
        fc.integer({ min: 2, max: 400 }),
        (t0, p, k) => {
          const samples = Array.from({ length: k }, (_, i) => ({ t: t0 + i * p, latencyMs: 10 }));
          const lastT = samples[k - 1].t;
          const { fps } = computeStats(build(samples), lastT);

          if (lastT - t0 < STATS_WINDOW_MS) {
            // Warm-up: (n - 1) / elapsed measures the period exactly.
            expect(Math.abs(fps - 1000 / p)).toBeLessThanOrEqual(1e-6);
          } else {
            // Steady state: n / 2 over the window (lastT - 2000, lastT].
            const n = samples.filter((x) => x.t > lastT - STATS_WINDOW_MS && x.t <= lastT).length;
            expect(fps).toBe(n / 2);
            // 1e-9 slack covers a sample landing on the window edge through float rounding.
            expect(Math.abs(fps - 1000 / p)).toBeLessThanOrEqual(0.5 + 1e-9);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: pose-spike, Property 9: Reset restarts statistics from zero
  // **Validates: Requirements 6.4, 8.2**
  it('Property 9: Reset restarts statistics from zero', () => {
    fc.assert(
      fc.property(
        samplesArb,
        samplesArb,
        // Gap between the last pre-reset sample and the first post-reset sample.
        fc.integer({ min: 0, max: 3000 }),
        // Offset of now past the last post-reset sample.
        fc.oneof(fc.integer({ min: 0, max: 3000 }), fc.double({ min: 0, max: 3000, noNaN: true })),
        // Any now for the "immediately after reset" check.
        fc.double({ min: -1_000_000, max: 2_000_000, noNaN: true }),
        (history, laterRaw, gap, offset, anyNow) => {
          // Shift the later samples so they start at or after the end of the history.
          const shift = history[history.length - 1].t + gap - laterRaw[0].t;
          const later = laterRaw.map((x) => ({ t: x.t + shift, latencyMs: x.latencyMs }));
          const now = later[later.length - 1].t + offset;

          // History, then reset, then later samples.
          const beforeReset = build(history);
          expect(beforeReset.samples.length).toBeGreaterThan(0);
          const afterReset = later.reduce(
            (s, x) => addSample(s, x.t, x.latencyMs),
            resetStats(),
          );
          const freshOnly = build(later);

          expect(computeStats(afterReset, now)).toEqual(computeStats(freshOnly, now));

          // Immediately after reset: no FPS and no latency, at any now.
          expect(computeStats(resetStats(), anyNow)).toEqual({ fps: 0, avgLatencyMs: null });
        },
      ),
      { numRuns: 100 },
    );
  });
});
