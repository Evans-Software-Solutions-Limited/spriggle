import { createApp } from "../api";
import { createRateLimiter } from "@spriggle/api-utils/rate-limit";
import {
  authFor,
  createInMemoryRepo,
  jsonRequest,
  TEST_USER,
} from "./testDoubles";

function makeApp(overrides?: {
  rateLimiter?: ReturnType<typeof createRateLimiter>;
}) {
  const repo = createInMemoryRepo();
  const app = createApp({
    repo,
    getAuthUser: authFor(TEST_USER),
    rateLimiter:
      overrides?.rateLimiter ??
      createRateLimiter({ windowMs: 60_000, max: 1000 }),
  });
  return { app, repo };
}

const auth = { authorization: "Bearer good" };

describe("health", () => {
  it("responds ok", async () => {
    const { app } = makeApp();
    const res = await app.handle(jsonRequest("/health", "GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /api/scores", () => {
  it("submits a score with valid auth then reflects it in the profile", async () => {
    const { app } = makeApp();

    const res = await app.handle(
      jsonRequest(
        "/api/scores",
        "POST",
        { score: 1200, date: "2026-02-01T10:00:00.000Z" },
        auth,
      ),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });

    const profileRes = await app.handle(
      jsonRequest("/api/profile", "GET", undefined, auth),
    );
    expect(profileRes.status).toBe(200);
    expect(await profileRes.json()).toMatchObject({
      displayName: "Ada",
      bestScore: 1200,
      totalGames: 1,
    });
  });

  it("rejects a missing/invalid token with 401", async () => {
    const { app } = makeApp();
    const noAuth = await app.handle(
      jsonRequest("/api/scores", "POST", { score: 1, date: "2026-01-01" }),
    );
    expect(noAuth.status).toBe(401);

    const badAuth = await app.handle(
      jsonRequest(
        "/api/scores",
        "POST",
        { score: 1, date: "2026-01-01" },
        { authorization: "Bearer nope" },
      ),
    );
    expect(badAuth.status).toBe(401);
  });

  it("rejects invalid payloads with 400", async () => {
    const { app } = makeApp();
    const cases: unknown[] = [
      { date: "2026-01-01T00:00:00Z" }, // missing score
      { score: -5, date: "2026-01-01T00:00:00Z" }, // negative
      { score: 1.5, date: "2026-01-01T00:00:00Z" }, // non-integer
      { score: 10, date: "not-a-date" }, // bad date
      { score: 10 }, // missing date
      [], // not an object with fields
    ];
    for (const body of cases) {
      const res = await app.handle(
        jsonRequest("/api/scores", "POST", body, auth),
      );
      expect(res.status).toBe(400);
    }
  });

  it("enforces rate limiting with a 429 + retry-after", async () => {
    const { app } = makeApp({
      rateLimiter: createRateLimiter({ windowMs: 60_000, max: 2 }),
    });
    const body = { score: 5, date: "2026-01-01T00:00:00.000Z" };

    expect(
      (await app.handle(jsonRequest("/api/scores", "POST", body, auth))).status,
    ).toBe(201);
    expect(
      (await app.handle(jsonRequest("/api/scores", "POST", body, auth))).status,
    ).toBe(201);

    const limited = await app.handle(
      jsonRequest("/api/scores", "POST", body, auth),
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});

describe("GET /api/leaderboard", () => {
  it("returns entries sorted desc with pagination", async () => {
    const { app } = makeApp();
    const scoresToPost = [100, 500, 300, 900, 200];
    for (const score of scoresToPost) {
      await app.handle(
        jsonRequest(
          "/api/scores",
          "POST",
          { score, date: "2026-01-01T00:00:00.000Z" },
          auth,
        ),
      );
    }

    const page1 = await app.handle(
      jsonRequest("/api/leaderboard?limit=2&offset=0", "GET"),
    );
    const { entries: e1 } = (await page1.json()) as {
      entries: { position: number; score: number }[];
    };
    expect(e1.map((e) => e.score)).toEqual([900, 500]);
    expect(e1.map((e) => e.position)).toEqual([1, 2]);

    const page2 = await app.handle(
      jsonRequest("/api/leaderboard?limit=2&offset=2", "GET"),
    );
    const { entries: e2 } = (await page2.json()) as {
      entries: { position: number; score: number }[];
    };
    expect(e2.map((e) => e.score)).toEqual([300, 200]);
    expect(e2.map((e) => e.position)).toEqual([3, 4]);
  });

  it("applies default and clamped limits for invalid query params", async () => {
    const { app } = makeApp();
    // Invalid limit falls back to the default; over-max is clamped to 100.
    const res = await app.handle(
      jsonRequest("/api/leaderboard?limit=abc&offset=-3", "GET"),
    );
    expect(res.status).toBe(200);
    const overMax = await app.handle(
      jsonRequest("/api/leaderboard?limit=9999", "GET"),
    );
    expect(overMax.status).toBe(200);
  });
});

describe("GET /api/profile", () => {
  it("returns an empty profile for an authed user with no scores", async () => {
    const { app } = makeApp();
    const res = await app.handle(
      jsonRequest("/api/profile", "GET", undefined, auth),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "",
      displayName: "Ada",
      bestScore: 0,
      totalGames: 0,
    });
  });

  it("rejects an unauthenticated profile request with 401", async () => {
    const { app } = makeApp();
    const res = await app.handle(jsonRequest("/api/profile", "GET"));
    expect(res.status).toBe(401);
  });

  it("falls back to email then a generic name when the token has no display name", async () => {
    // Email present, no displayName → uses email.
    const emailOnly = createApp({
      repo: createInMemoryRepo(),
      getAuthUser: authFor({
        provider: "email",
        providerId: "e1",
        email: "player@example.com",
      }),
      rateLimiter: createRateLimiter({ windowMs: 60_000, max: 10 }),
    });
    await emailOnly.handle(
      jsonRequest(
        "/api/scores",
        "POST",
        { score: 7, date: "2026-01-01T00:00:00.000Z" },
        auth,
      ),
    );
    const p1 = await emailOnly.handle(
      jsonRequest("/api/profile", "GET", undefined, auth),
    );
    expect(await p1.json()).toMatchObject({
      displayName: "player@example.com",
    });

    // Neither displayName nor email → "Gardener".
    const anon = createApp({
      repo: createInMemoryRepo(),
      getAuthUser: authFor({ provider: "apple", providerId: "g1" }),
      rateLimiter: createRateLimiter({ windowMs: 60_000, max: 10 }),
    });
    const p2 = await anon.handle(
      jsonRequest("/api/profile", "GET", undefined, auth),
    );
    expect(await p2.json()).toMatchObject({ displayName: "Gardener" });
  });
});
