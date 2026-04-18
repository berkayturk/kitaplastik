// lib/rate-limit.ts
// In-memory sliding-window rate limiter. NOT shared across serverless instances —
// acceptable MVP tradeoff; Plan 4 upgrades to Upstash Redis.

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface CheckResult {
  allowed: boolean;
  retryAfter: number; // seconds
}

interface Bucket {
  timestamps: number[];
}

export function createRateLimiter(opts: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function prune(bucket: Bucket, now: number) {
    const cutoff = now - opts.windowMs;
    while (bucket.timestamps.length > 0 && bucket.timestamps[0] < cutoff) {
      bucket.timestamps.shift();
    }
  }

  return {
    check(key: string): CheckResult {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { timestamps: [] };
        buckets.set(key, bucket);
      }
      prune(bucket, now);

      if (bucket.timestamps.length >= opts.max) {
        const oldest = bucket.timestamps[0];
        const retryAfterMs = oldest + opts.windowMs - now;
        return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
      }

      bucket.timestamps.push(now);
      return { allowed: true, retryAfter: 0 };
    },
  };
}

export const rfqLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 3 });
export const contactLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 5 });

export function ipFromHeaders(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim() ?? "unknown";
}
