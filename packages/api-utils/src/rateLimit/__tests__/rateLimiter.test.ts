import { describe, expect, it } from "vitest";

import { createRateLimiter } from "../rateLimiter";

describe("createRateLimiter", () => {
  it("allows up to max requests then blocks within a window", () => {
    const t = 1000;
    const limiter = createRateLimiter({ windowMs: 1000, max: 3, now: () => t });

    expect(limiter.check("u1")).toMatchObject({ allowed: true, remaining: 2 });
    expect(limiter.check("u1")).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("u1")).toMatchObject({ allowed: true, remaining: 0 });

    const blocked = limiter.check("u1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(1000);
  });

  it("tracks keys independently", () => {
    let t = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    // Different key gets its own budget.
    expect(limiter.check("b").allowed).toBe(true);
    t += 1;
  });

  it("resets after the window elapses", () => {
    let t = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });

    expect(limiter.check("u1").allowed).toBe(true);
    expect(limiter.check("u1").allowed).toBe(false);

    t += 1000; // window boundary reached
    expect(limiter.check("u1").allowed).toBe(true);
  });

  it("reports a shrinking retryAfter as the window elapses", () => {
    let t = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });
    limiter.check("u1");

    t = 400;
    expect(limiter.check("u1").retryAfterMs).toBe(600);
  });

  it("reset() clears all buckets", () => {
    const t = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });
    limiter.check("u1");
    expect(limiter.check("u1").allowed).toBe(false);

    limiter.reset();
    expect(limiter.check("u1").allowed).toBe(true);
  });

  it("rejects invalid configuration", () => {
    expect(() => createRateLimiter({ windowMs: 1000, max: 0 })).toThrow("max");
    expect(() => createRateLimiter({ windowMs: 0, max: 1 })).toThrow(
      "windowMs",
    );
  });

  it("evicts stale buckets once a window has elapsed", () => {
    let t = 0;
    const limiter = createRateLimiter({ windowMs: 100, max: 5, now: () => t });
    limiter.check("old"); // bucket created at t=0
    // Advance well past the window and touch a different key to trigger a sweep.
    t = 500;
    limiter.check("new");
    // "old" was evicted, so it starts a fresh window (full budget) when seen again.
    expect(limiter.check("old")).toMatchObject({ allowed: true, remaining: 4 });
  });
});
