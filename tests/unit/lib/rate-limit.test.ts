import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, ipFromHeaders } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T00:00:00Z"));
  });

  it("allows up to limit within window", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(false);
  });

  it("isolates keys", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("resets after window elapses", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rl.check("k").allowed).toBe(true);
  });

  it("returns retryAfter seconds when blocked", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    rl.check("x");
    const r = rl.check("x");
    expect(r.allowed).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
    expect(r.retryAfter).toBeLessThanOrEqual(60);
  });
});

describe("ipFromHeaders", () => {
  it("prefers Cloudflare's normalized client IP header", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-real-ip": "198.51.100.20",
      "x-forwarded-for": "192.0.2.30",
    });

    expect(ipFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("does not use spoofable x-forwarded-for as the rate-limit key", () => {
    const headers = new Headers({
      "x-forwarded-for": "192.0.2.30",
    });

    expect(ipFromHeaders(headers)).toBe("unknown");
  });
});
