import { randomUUID } from "node:crypto";

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

import { getDocClient, getTableName } from "./dynamo";

/**
 * Data access for the leaderboard/profile endpoints (Task 19), backed by a
 * single DynamoDB table with one GSI. Kept behind an interface so the Elysia
 * handlers can be tested against an in-memory fake.
 *
 * Table design (PK, SK):
 *   - Profile item: PK=`USER#<provider>#<providerId>`, SK=`PROFILE`
 *       { id, displayName, createdAt, updatedAt }
 *   - Score item:   PK=`USER#<provider>#<providerId>`, SK=`SCORE#<ts>#<uuid>`
 *       { score, playerName, playedAt, submittedAt, GSI1PK, GSI1SK }
 *
 * GSI1 (leaderboard): GSI1PK=`LEADERBOARD`, GSI1SK=`<invScore>#<invTime>`.
 * The sort key inverts score and time so an ascending query returns highest
 * score first, then most-recent first (deterministic tiebreak). Pagination is
 * cursor-based (encoded LastEvaluatedKey).
 */

export interface RecordScoreInput {
  provider: string;
  providerId: string;
  displayName: string;
  score: number;
  playedAt: Date;
}

export interface LeaderboardEntry {
  score: number;
  playerName: string;
  /** ISO 8601. */
  date: string;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  /** Opaque cursor for the next page; absent when there are no more results. */
  nextCursor?: string;
}

export interface ProfileData {
  id: string;
  displayName: string;
  bestScore: number;
  totalGames: number;
}

export interface ScoreRepository {
  /** Upsert the user's profile and record one score (leaderboard + aggregates). */
  recordScore(input: RecordScoreInput): Promise<void>;
  /** Top scores, sorted by score descending, with cursor pagination. */
  getLeaderboard(opts: {
    limit: number;
    cursor?: string;
  }): Promise<LeaderboardPage>;
  /** Profile for a user, or null if they have no profile yet. */
  getProfile(provider: string, providerId: string): Promise<ProfileData | null>;
}

const LEADERBOARD_PARTITION = "LEADERBOARD";
const SCORE_DIGITS = 10; // 2147483647 (int max) is 10 digits
const TIME_DIGITS = 14; // ms since epoch, comfortably < 14 digits
const MAX_SCORE = 9_999_999_999;
const MAX_TIME = 99_999_999_999_999;

function userPk(provider: string, providerId: string): string {
  return `USER#${provider}#${providerId}`;
}

/** Inverted sort key so an ascending GSI query yields score desc, then time desc. */
function leaderboardSortKey(score: number, playedAtMs: number): string {
  const invScore = String(MAX_SCORE - score).padStart(SCORE_DIGITS, "0");
  const invTime = String(MAX_TIME - playedAtMs).padStart(TIME_DIGITS, "0");
  return `${invScore}#${invTime}`;
}

function encodeCursor(
  key: Record<string, unknown> | undefined,
): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64");
}

function decodeCursor(
  cursor: string | undefined,
): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return undefined; // malformed cursor → start from the beginning
  }
}

export interface DynamoScoreRepositoryDeps {
  client?: DynamoDBDocumentClient;
  tableName?: string;
}

export function createDynamoScoreRepository(
  deps: DynamoScoreRepositoryDeps = {},
): ScoreRepository {
  const client = deps.client ?? getDocClient();
  const table = deps.tableName ?? getTableName();

  return {
    async recordScore(input) {
      const pk = userPk(input.provider, input.providerId);
      const nowIso = new Date().toISOString();
      const playedAtMs = input.playedAt.getTime();

      // Upsert the profile (preserve id + createdAt on repeat sign-ins).
      await client.send(
        new UpdateCommand({
          TableName: table,
          Key: { PK: pk, SK: "PROFILE" },
          UpdateExpression:
            "SET displayName = :dn, updatedAt = :now, id = if_not_exists(id, :id), createdAt = if_not_exists(createdAt, :now)",
          ExpressionAttributeValues: {
            ":dn": input.displayName,
            ":now": nowIso,
            ":id": randomUUID(),
          },
        }),
      );

      // Record the score (also indexed for the global leaderboard).
      await client.send(
        new PutCommand({
          TableName: table,
          Item: {
            PK: pk,
            SK: `SCORE#${nowIso}#${randomUUID()}`,
            score: input.score,
            playerName: input.displayName,
            playedAt: input.playedAt.toISOString(),
            submittedAt: nowIso,
            GSI1PK: LEADERBOARD_PARTITION,
            GSI1SK: leaderboardSortKey(input.score, playedAtMs),
          },
        }),
      );
    },

    async getLeaderboard({ limit, cursor }) {
      const res = await client.send(
        new QueryCommand({
          TableName: table,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :pk",
          ExpressionAttributeValues: { ":pk": LEADERBOARD_PARTITION },
          ScanIndexForward: true, // ascending over the inverted key = best first
          Limit: limit,
          ExclusiveStartKey: decodeCursor(cursor),
        }),
      );

      const entries = (res.Items ?? []).map((item) => ({
        score: Number(item.score),
        playerName: String(item.playerName),
        date: String(item.playedAt),
      }));

      return { entries, nextCursor: encodeCursor(res.LastEvaluatedKey) };
    },

    async getProfile(provider, providerId) {
      const pk = userPk(provider, providerId);

      const profileRes = await client.send(
        new GetCommand({
          TableName: table,
          Key: { PK: pk, SK: "PROFILE" },
        }),
      );
      if (!profileRes.Item) return null;

      // Aggregate best score + total games from the user's score items.
      let bestScore = 0;
      let totalGames = 0;
      let startKey: Record<string, unknown> | undefined;
      do {
        const scoresRes = await client.send(
          new QueryCommand({
            TableName: table,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues: { ":pk": pk, ":prefix": "SCORE#" },
            ExclusiveStartKey: startKey,
          }),
        );
        for (const item of scoresRes.Items ?? []) {
          const s = Number(item.score);
          if (s > bestScore) bestScore = s;
          totalGames += 1;
        }
        startKey = scoresRes.LastEvaluatedKey as
          | Record<string, unknown>
          | undefined;
      } while (startKey);

      return {
        id: String(profileRes.Item.id),
        displayName: String(profileRes.Item.displayName),
        bestScore,
        totalGames,
      };
    },
  };
}
