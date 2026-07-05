import { and, desc, eq, sql } from "drizzle-orm";

import type { Db } from "./client";
import { scores, users } from "./schema";

/**
 * Data access for the leaderboard/profile endpoints (Task 19). Kept behind an
 * interface so the Elysia handlers can be tested against an in-memory fake,
 * while the Drizzle implementation runs against Supabase Postgres in Lambda.
 */

export interface UserIdentity {
  provider: string;
  providerId: string;
  displayName: string;
}

export interface NewScore {
  userId: string;
  score: number;
  playedAt: Date;
}

export interface LeaderboardEntry {
  score: number;
  playerName: string;
  /** ISO 8601. */
  date: string;
}

export interface ProfileData {
  id: string;
  displayName: string;
  bestScore: number;
  totalGames: number;
}

export interface ScoreRepository {
  /** Insert or update the user keyed by (provider, providerId); returns its id. */
  upsertUser(user: UserIdentity): Promise<string>;
  insertScore(score: NewScore): Promise<void>;
  /** Top scores, sorted by score descending. */
  getLeaderboard(opts: {
    limit: number;
    offset: number;
  }): Promise<LeaderboardEntry[]>;
  /** Profile for a user, or null if they have no user row yet. */
  getProfile(provider: string, providerId: string): Promise<ProfileData | null>;
}

export function createDrizzleScoreRepository(db: Db): ScoreRepository {
  return {
    async upsertUser(user) {
      const rows = await db
        .insert(users)
        .values({
          provider: user.provider,
          providerId: user.providerId,
          displayName: user.displayName,
        })
        .onConflictDoUpdate({
          target: [users.provider, users.providerId],
          set: { displayName: user.displayName, updatedAt: new Date() },
        })
        .returning({ id: users.id });
      return rows[0].id;
    },

    async insertScore(score) {
      await db.insert(scores).values({
        userId: score.userId,
        score: score.score,
        playedAt: score.playedAt,
      });
    },

    async getLeaderboard({ limit, offset }) {
      const rows = await db
        .select({
          score: scores.score,
          playerName: users.displayName,
          date: scores.playedAt,
        })
        .from(scores)
        .innerJoin(users, eq(scores.userId, users.id))
        .orderBy(desc(scores.score), desc(scores.playedAt))
        .limit(limit)
        .offset(offset);
      return rows.map((r) => ({
        score: r.score,
        playerName: r.playerName,
        date: r.date.toISOString(),
      }));
    },

    async getProfile(provider, providerId) {
      const userRows = await db
        .select({ id: users.id, displayName: users.displayName })
        .from(users)
        .where(
          and(eq(users.provider, provider), eq(users.providerId, providerId)),
        )
        .limit(1);
      if (userRows.length === 0) return null;
      const user = userRows[0];

      const agg = await db
        .select({
          best: sql<number>`coalesce(max(${scores.score}), 0)`,
          total: sql<number>`count(*)`,
        })
        .from(scores)
        .where(eq(scores.userId, user.id));

      return {
        id: user.id,
        displayName: user.displayName,
        bestScore: Number(agg[0]?.best ?? 0),
        totalGames: Number(agg[0]?.total ?? 0),
      };
    },
  };
}
