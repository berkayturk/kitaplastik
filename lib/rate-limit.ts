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
    while (bucket.timestamps.length > 0 && (bucket.timestamps[0] as number) < cutoff) {
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
        const oldest = bucket.timestamps[0] as number;
        const retryAfterMs = oldest + opts.windowMs - now;
        return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
      }

      bucket.timestamps.push(now);
      return { allowed: true, retryAfter: 0 };
    },
  };
}

export const contactLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 5 });
// Catalog is a low-value, high-abuse target (email enumeration, bulk PDF
// download). 3 requests per hour per IP covers legitimate re-requests
// (wrong language, lost email) while cheaply deterring scraping.
export const catalogLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 3 });
// PDF endpoint is heavier (Puppeteer render ~10 s cold, cache hits are cheap).
// Allow 10/hour/IP — legitimate use is "email me → click link once", but
// cache hits from the same IP should still feel free. Bots bulk-scraping
// are deflected at 10.
export const catalogPdfLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 });

export function ipFromHeaders(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim() ?? "unknown";
}
