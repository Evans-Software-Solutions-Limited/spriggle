import type { AuthenticatedUser } from "@spriggle/api-utils/auth";
import type {
  LeaderboardEntry,
  NewScore,
  ProfileData,
  ScoreRepository,
  UserIdentity,
} from "@spriggle/db";

/**
 * In-memory ScoreRepository for endpoint tests — mirrors the Drizzle repo's
 * contract (upsert by provider+providerId, sort by score desc) without a DB.
 */
export function createInMemoryRepo(): ScoreRepository {
  const users = new Map<string, { id: string } & UserIdentity>();
  const scores: NewScore[] = [];
  let seq = 0;

  return {
    async upsertUser(user) {
      const key = `${user.provider}:${user.providerId}`;
      const existing = users.get(key);
      if (existing) {
        existing.displayName = user.displayName;
        return existing.id;
      }
      const id = `user-${++seq}`;
      users.set(key, { id, ...user });
      return id;
    },

    async insertScore(score) {
      scores.push({ ...score });
    },

    async getLeaderboard({ limit, offset }): Promise<LeaderboardEntry[]> {
      const byId = new Map([...users.values()].map((u) => [u.id, u]));
      return (
        scores
          .map((s) => ({
            score: s.score,
            playerName: byId.get(s.userId)?.displayName ?? "?",
            playedAt: s.playedAt,
          }))
          // Mirror the Drizzle repo: score desc, then playedAt desc as tiebreak.
          .sort((a, b) =>
            b.score !== a.score
              ? b.score - a.score
              : b.playedAt.getTime() - a.playedAt.getTime(),
          )
          .slice(offset, offset + limit)
          .map((r) => ({
            score: r.score,
            playerName: r.playerName,
            date: r.playedAt.toISOString(),
          }))
      );
    },

    async getProfile(provider, providerId): Promise<ProfileData | null> {
      const user = users.get(`${provider}:${providerId}`);
      if (!user) return null;
      const own = scores.filter((s) => s.userId === user.id);
      const bestScore = own.reduce((m, s) => Math.max(m, s.score), 0);
      return {
        id: user.id,
        displayName: user.displayName,
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
    upsertUser: fail,
    insertScore: fail,
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
