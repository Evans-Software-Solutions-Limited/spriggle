import fc from "fast-check";

import { createApp } from "../api";
import { createRateLimiter } from "@spriggle/api-utils/rate-limit";
import {
  authFor,
  createInMemoryRepo,
  jsonRequest,
  TEST_USER,
} from "./testDoubles";

/**
 * Feature: spriggle-ipad-game, Property 17: Leaderboard entries sorted descending
 * Feature: spriggle-ipad-game, Property 23: Invalid auth tokens rejected
 * Feature: spriggle-ipad-game, Property 24: Valid score submissions persisted
 *
 * Endpoints are driven through the real Elysia app via `app.handle(Request)`.
 * Validates: Requirements 14.1, 14.2, 14.3.
 */

// A generous limiter so submission-heavy property runs aren't throttled.
const looseLimiter = () =>
  createRateLimiter({ windowMs: 60_000, max: 100_000 });

const isoDateArb = fc
  .integer({ min: 0, max: Date.now() })
  .map((ms) => new Date(ms).toISOString());

describe("Feature: spriggle-ipad-game, Property 17: Leaderboard entries sorted descending", () => {
  it("returns entries in non-increasing score order with sequential positions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ score: fc.nat(), date: isoDateArb }), {
          maxLength: 15,
        }),
        async (submissions) => {
          const app = createApp({
            repo: createInMemoryRepo(),
            getAuthUser: authFor(TEST_USER),
            rateLimiter: looseLimiter(),
          });
          for (const s of submissions) {
            await app.handle(
              jsonRequest("/api/scores", "POST", s, {
                authorization: "Bearer good",
              }),
            );
          }

          const res = await app.handle(
            jsonRequest("/api/leaderboard?limit=100", "GET"),
          );
          const { entries } = (await res.json()) as {
            entries: { position: number; score: number }[];
          };

          for (let i = 1; i < entries.length; i++) {
            expect(entries[i].score).toBeLessThanOrEqual(entries[i - 1].score);
          }
          entries.forEach((e, i) => expect(e.position).toBe(i + 1));
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 23: Invalid auth tokens rejected", () => {
  it("rejects submissions with an invalid token and persists nothing", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.record({ score: fc.nat(), date: isoDateArb }),
        async (badToken, payload) => {
          // Exclude the one token that would authenticate.
          fc.pre(badToken !== "good");
          const repo = createInMemoryRepo();
          const app = createApp({
            repo,
            getAuthUser: authFor(TEST_USER),
            rateLimiter: looseLimiter(),
          });

          const res = await app.handle(
            jsonRequest("/api/scores", "POST", payload, {
              authorization: `Bearer ${badToken}`,
            }),
          );
          expect(res.status).toBe(401);

          // Nothing persisted → leaderboard stays empty.
          const board = await app.handle(
            jsonRequest("/api/leaderboard", "GET"),
          );
          const { entries } = (await board.json()) as { entries: unknown[] };
          expect(entries).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 24: Valid score submissions persisted", () => {
  it("persists a valid submission so it appears on the leaderboard", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ score: fc.nat(), date: isoDateArb }),
        async (payload) => {
          const app = createApp({
            repo: createInMemoryRepo(),
            getAuthUser: authFor(TEST_USER),
            rateLimiter: looseLimiter(),
          });

          const res = await app.handle(
            jsonRequest("/api/scores", "POST", payload, {
              authorization: "Bearer good",
            }),
          );
          expect(res.status).toBe(201);

          const board = await app.handle(
            jsonRequest("/api/leaderboard", "GET"),
          );
          const { entries } = (await board.json()) as {
            entries: { score: number; playerName: string }[];
          };
          expect(entries).toHaveLength(1);
          expect(entries[0].score).toBe(payload.score);
          expect(entries[0].playerName).toBe(TEST_USER.displayName);
        },
      ),
      { numRuns: 100 },
    );
  });
});
