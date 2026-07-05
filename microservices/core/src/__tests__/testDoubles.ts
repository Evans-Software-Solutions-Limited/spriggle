import type { AuthenticatedUser } from "@spriggle/api-utils/auth";
import type {
  LeaderboardPage,
  ProfileData,
  ScoreRepository,
} from "@spriggle/db";

interface StoredScore {
  key: string;
  playerName: string;
  score: number;
  playedAt: Date;
}

/**
 * In-memory ScoreRepository for endpoint tests — mirrors the DynamoDB repo's
 * contract: upsert profile by provider+providerId, record scores, leaderboard
 * sorted by score desc then playedAt desc, with cursor pagination (the cursor
 * is a base64 offset here — opaque, like the real LastEvaluatedKey).
 */
export function createInMemoryRepo(): ScoreRepository {
  const profiles = new Map<string, { id: string; displayName: string }>();
  const scores: StoredScore[] = [];

  return {
    async recordScore(input) {
      const key = `${input.provider}:${input.providerId}`;
      const existing = profiles.get(key);
      if (existing) existing.displayName = input.displayName;
      else
        profiles.set(key, {
          id: `user-${profiles.size + 1}`,
          displayName: input.displayName,
        });
      scores.push({
        key,
        playerName: input.displayName,
        score: input.score,
        playedAt: input.playedAt,
      });
    },

    async getLeaderboard({ limit, cursor }): Promise<LeaderboardPage> {
      const sorted = [...scores].sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : b.playedAt.getTime() - a.playedAt.getTime(),
      );
      const start = cursor
        ? Number.parseInt(Buffer.from(cursor, "base64").toString("utf8"), 10)
        : 0;
      const slice = sorted.slice(start, start + limit);
      const next = start + limit;
      return {
        entries: slice.map((s) => ({
          score: s.score,
          playerName: s.playerName,
          date: s.playedAt.toISOString(),
        })),
        nextCursor:
          next < sorted.length
            ? Buffer.from(String(next), "utf8").toString("base64")
            : undefined,
      };
    },

    async getProfile(provider, providerId): Promise<ProfileData | null> {
      const key = `${provider}:${providerId}`;
      const profile = profiles.get(key);
      if (!profile) return null;
      const own = scores.filter((s) => s.key === key);
      const bestScore = own.reduce((m, s) => Math.max(m, s.score), 0);
      return {
        id: profile.id,
        displayName: profile.displayName,
        bestScore,
        totalGames: own.length,
      };
    },
  };
}

/** A repository whose every method rejects — for exercising the 503 path. */
export function createThrowingRepo(): ScoreRepository {
  const fail = async (): Promise<never> => {
    throw new Error("db down");
  };
  return {
    recordScore: fail,
    getLeaderboard: fail,
    getProfile: fail,
  };
}

/** A user resolved only for the exact bearer token `Bearer <validToken>`. */
export function authFor(
  user: AuthenticatedUser,
  validToken = "good",
): (header: string | undefined) => Promise<AuthenticatedUser | null> {
  return async (header) => (header === `Bearer ${validToken}` ? user : null);
}

export const TEST_USER: AuthenticatedUser = {
  provider: "apple",
  providerId: "apple-sub-1",
  displayName: "Ada",
  email: "ada@example.com",
};

export function jsonRequest(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
