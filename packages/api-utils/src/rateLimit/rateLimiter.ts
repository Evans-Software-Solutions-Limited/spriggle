/**
 * Fixed-window rate limiter for the score-submission endpoint (Requirement
 * 14.4). Keyed by an arbitrary string (e.g. the authenticated user id).
 *
 * NOTE — in-memory / per-container: Lambda containers don't share memory, so
 * this bounds abuse per warm container rather than globally. It's a sound
 * first line of defence and is deterministically testable; a production-grade
 * global limit needs a shared store (DynamoDB/Redis). Documented here so the
 * limitation is explicit.
 */

export interface RateLimiterOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max allowed requests per key per window. */
  max: number;
  /** Clock injection for tests; defaults to Date.now. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
  /** Milliseconds until the window resets (for a Retry-After header). */
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(): void;
}

interface Bucket {
  count: number;
  windowStart: number;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max } = options;
  if (max < 1) {
    throw new Error("RateLimiter `max` must be >= 1");
  }
  if (windowMs <= 0) {
    throw new Error("RateLimiter `windowMs` must be > 0");
  }
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();
  let lastSweep = now();

  // Drop expired buckets so the map can't grow unbounded over a warm
  // container's lifetime. Amortized: runs at most once per window.
  function sweep(t: number): void {
    if (t - lastSweep < windowMs) return;
    lastSweep = t;
    for (const [key, bucket] of buckets) {
      if (t - bucket.windowStart >= windowMs) buckets.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const t = now();
      sweep(t);
      const bucket = buckets.get(key);

      if (!bucket || t - bucket.windowStart >= windowMs) {
        // Start a fresh window.
        buckets.set(key, { count: 1, windowStart: t });
        return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
      }

      if (bucket.count >= max) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: bucket.windowStart + windowMs - t,
        };
      }

      bucket.count += 1;
      return {
        allowed: true,
        remaining: max - bucket.count,
        retryAfterMs: 0,
      };
    },

    reset() {
      buckets.clear();
    },
  };
}
