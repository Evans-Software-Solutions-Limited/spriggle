import Elysia from "elysia";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";
import { getAuthUser } from "@spriggle/api-utils/auth";
import {
  createRateLimiter,
  type RateLimiter,
} from "@spriggle/api-utils/rate-limit";
import {
  createDynamoScoreRepository,
  type ScoreRepository,
} from "@spriggle/db";

import {
  getLeaderboard,
  getProfile,
  submitScore,
  type HandlerResult,
  type ScoreServiceDeps,
} from "./application/scoreService";

/** Overridable dependencies — tests inject fakes; production uses the defaults. */
export interface AppDeps {
  repo?: ScoreRepository;
  getAuthUser?: ScoreServiceDeps["getAuthUser"];
  rateLimiter?: RateLimiter;
}

// One submission burst window per user. In-memory / per-container (see
// rateLimiter docs); a shared store is needed for a global limit.
const SCORE_RATE_LIMIT = { windowMs: 60_000, max: 30 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function respond(ctx: any, result: HandlerResult): unknown {
  ctx.set.status = result.status;
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      ctx.set.headers[key] = value;
    }
  }
  return result.body;
}

/**
 * A repository that defers the DynamoDB client + table lookup until the first
 * query, so constructing the app (Lambda module load, or importing this module
 * in tests that inject their own repo) never requires SCORES_TABLE to be set.
 */
function lazyDynamoRepo(): ScoreRepository {
  let real: ScoreRepository | null = null;
  const get = () => (real ??= createDynamoScoreRepository());
  return {
    recordScore: (input) => get().recordScore(input),
    getLeaderboard: (opts) => get().getLeaderboard(opts),
    getProfile: (p, i) => get().getProfile(p, i),
  };
}

export function createApp(deps: AppDeps = {}) {
  const service: ScoreServiceDeps = {
    repo: deps.repo ?? lazyDynamoRepo(),
    getAuthUser: deps.getAuthUser ?? ((header) => getAuthUser(header)),
    rateLimiter: deps.rateLimiter ?? createRateLimiter(SCORE_RATE_LIMIT),
  };

  return new Elysia()
    .get("/health", () => ({ status: "ok" }))
    .post("/api/scores", async (ctx) =>
      respond(
        ctx,
        await submitScore(service, ctx.headers.authorization, ctx.body),
      ),
    )
    .get("/api/leaderboard", async (ctx) =>
      respond(ctx, await getLeaderboard(service, ctx.query)),
    )
    .get("/api/profile", async (ctx) =>
      respond(ctx, await getProfile(service, ctx.headers.authorization)),
    );
}

export type SpriggleApi = ReturnType<typeof createApp>;

const app = createApp();
const honoApp = new Hono();
honoApp.mount("/", app.fetch);

export const handler = handle(honoApp);
