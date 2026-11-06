import fc from 'fast-check';
import { MAX_EVENTS_PER_SECOND } from '../constants';
import { shouldDeliver } from '../throttle';
import { strictTimestampsArb } from './arbitraries';

/** Replays the worklet's throttle loop: last starts at -Infinity and updates on each acceptance. */
function simulate(timestamps: readonly number[]) {
  const accepted: number[] = [];
  const rejected: Array<{ t: number; last: number }> = [];
  let last = -Infinity;
  for (const t of timestamps) {
    if (shouldDeliver(t, last)) {
      accepted.push(t);
      last = t;
    } else {
      rejected.push({ t, last });
    }
  }
  return { accepted, rejected };
}

describe('throttle', () => {
  // Feature: pose-spike, Property 2: Throttle caps delivery rate
  // **Validates: Requirements 4.4**
  it('Property 2: Throttle caps delivery rate', () => {
    fc.assert(
      fc.property(strictTimestampsArb, (timestamps) => {
        const { accepted, rejected } = simulate(timestamps);

        // The first frame is always delivered (last starts at -Infinity).
        expect(accepted[0]).toBe(timestamps[0]);

        // At most 30 accepted timestamps in every half-open window [t, t + 1000).
        // The densest window starts at an accepted timestamp, so checking those suffices.
        let j = 0;
        for (let i = 0; i < accepted.length; i++) {
          if (j < i) j = i;
          while (j < accepted.length && accepted[j] < accepted[i] + 1000) j++;
          expect(j - i).toBeLessThanOrEqual(MAX_EVENTS_PER_SECOND);
        }

        // Every rejected timestamp is less than 1000/30 ms after the most recent accepted one.
        for (const { t, last } of rejected) {
          expect((t - last) * MAX_EVENTS_PER_SECOND).toBeLessThan(1000);
        }
      }),
      { numRuns: 100 },
    );
  });
});
