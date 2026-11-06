import { STATS_WINDOW_MS } from './constants';

/** One received Landmark_Result: arrival time (ms) and its native latency (ms). */
export interface StatsSample {
  t: number;
  latencyMs: number;
}

/** Sliding-window stats state; startedAt is the time of the first sample after a reset. */
export interface StatsState {
  samples: StatsSample[];
  startedAt: number | null;
}

/** Values shown in the Stats_Panel. avgLatencyMs is null when the window is empty. */
export interface StatsView {
  fps: number;
  avgLatencyMs: number | null;
}

/** Fresh state with no samples (used by Reset_Stats_Button and camera switch). */
export function resetStats(): StatsState {
  return { samples: [], startedAt: null };
}

/** Returns a new state with a sample at time t appended and samples older than the 2 s window dropped. */
export function addSample(s: StatsState, t: number, latencyMs: number): StatsState {
  const cutoff = t - STATS_WINDOW_MS;
  const kept = s.samples.filter((sample) => sample.t > cutoff);
  kept.push({ t, latencyMs });
  return { samples: kept, startedAt: s.startedAt ?? t };
}

/**
 * Pose_FPS and mean Native_Latency over the window (now - 2000, now].
 * Steady state (elapsed >= 2000 ms): fps = n / 2.
 * Warm-up (0 < elapsed < 2000 ms): fps = (n - 1) / (elapsed / 1000), which is 0 when n <= 1.
 * fps is 0 when n === 0 or elapsed <= 0.
 */
export function computeStats(s: StatsState, now: number): StatsView {
  const lower = now - STATS_WINDOW_MS;
  let n = 0;
  let latencySum = 0;
  for (const sample of s.samples) {
    if (sample.t > lower && sample.t <= now) {
      n += 1;
      latencySum += sample.latencyMs;
    }
  }
  const avgLatencyMs = n === 0 ? null : latencySum / n;

  const elapsed = s.startedAt === null ? 0 : now - s.startedAt;
  let fps: number;
  if (n === 0 || elapsed <= 0) {
    fps = 0;
  } else if (elapsed >= STATS_WINDOW_MS) {
    fps = n / (STATS_WINDOW_MS / 1000);
  } else {
    fps = Math.max(0, n - 1) / (elapsed / 1000);
  }
  return { fps, avgLatencyMs };
}
