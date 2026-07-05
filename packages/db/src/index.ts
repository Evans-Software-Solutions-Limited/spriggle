export * from "./schema";
export { createDb, getDb } from "./client";
export type { Db } from "./client";
export {
  createDrizzleScoreRepository,
  type ScoreRepository,
  type UserIdentity,
  type NewScore,
  type LeaderboardEntry,
  type ProfileData,
} from "./scoreRepository";
