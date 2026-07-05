import type { AuthenticatedUser } from "@spriggle/api-utils/auth";
import type { RateLimiter } from "@spriggle/api-utils/rate-limit";
import type { ScoreRepository } from "@spriggle/db";

/**
 * Framework-light request handlers for the score/leaderboard/profile endpoints
 * (Task 19). Each returns a normalized result the Elysia layer (api.ts) maps to
 * an HTTP response. Keeping the logic here (not in api.ts) makes every branch —
 * auth, rate limiting, validation — unit-testable and covered.
 */

export interface HandlerResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface ScoreServiceDeps {
  repo: ScoreRepository;
  getAuthUser: (
    authHeader: string | undefined,
  ) => Promise<AuthenticatedUser | null>;
  rateLimiter: RateLimiter;
}

const MAX_LEADERBOARD_LIMIT = 100;
const DEFAULT_LEADERBOARD_LIMIT = 50;

function displayNameFor(user: AuthenticatedUser): string {
  return user.displayName ?? user.email ?? "Gardener";
}

function unauthorized(): HandlerResult {
  return { status: 401, body: { message: "Unauthorized" } };
}

interface ScorePayload {
  score: number;
  date: string;
}

/** Validate the POST /api/scores body. Returns the parsed payload or null. */
function parseScorePayload(raw: unknown): ScorePayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { score, date } = raw as Record<string, unknown>;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0) {
    return null;
  }
  if (typeof date !== "string" || Number.isNaN(Date.parse(date))) {
    return null;
  }
  return { score, date };
}

/** POST /api/scores — authenticated, rate-limited, validated (Requirement 14.1). */
export async function submitScore(
  deps: ScoreServiceDeps,
  authHeader: string | undefined,
  rawBody: unknown,
): Promise<HandlerResult> {
  const user = await deps.getAuthUser(authHeader);
  if (!user) return unauthorized();

  const limit = deps.rateLimiter.check(`${user.provider}:${user.providerId}`);
  if (!limit.allowed) {
    return {
      status: 429,
      body: { message: "Too Many Requests" },
      headers: {
        "retry-after": String(Math.ceil(limit.retryAfterMs / 1000)),
      },
    };
  }

  const payload = parseScorePayload(rawBody);
  if (!payload) {
    return { status: 400, body: { message: "Invalid score payload" } };
  }

  const userId = await deps.repo.upsertUser({
    provider: user.provider,
    providerId: user.providerId,
    displayName: displayNameFor(user),
  });
  await deps.repo.insertScore({
    userId,
    score: payload.score,
    playedAt: new Date(payload.date),
  });

  return { status: 201, body: { success: true } };
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** GET /api/leaderboard — top scores sorted descending, paginated (Requirement 14.2). */
export async function getLeaderboard(
  deps: ScoreServiceDeps,
  query: Record<string, string | undefined>,
): Promise<HandlerResult> {
  const rawLimit = parsePositiveInt(query.limit, DEFAULT_LEADERBOARD_LIMIT);
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LEADERBOARD_LIMIT);
  const offset = parsePositiveInt(query.offset, 0);

  const rows = await deps.repo.getLeaderboard({ limit, offset });
  const entries = rows.map((row, index) => ({
    position: offset + index + 1,
    score: row.score,
    playerName: row.playerName,
    date: row.date,
  }));

  return { status: 200, body: { entries } };
}

/** GET /api/profile — best score + total games for the authed user (Requirement 14.5). */
export async function getProfile(
  deps: ScoreServiceDeps,
  authHeader: string | undefined,
): Promise<HandlerResult> {
  const user = await deps.getAuthUser(authHeader);
  if (!user) return unauthorized();

  const profile = await deps.repo.getProfile(user.provider, user.providerId);
  if (!profile) {
    // No scores submitted yet — return an empty profile from the token identity.
    return {
      status: 200,
      body: {
        id: "",
        displayName: displayNameFor(user),
        bestScore: 0,
        totalGames: 0,
      },
    };
  }

  return { status: 200, body: profile };
}
