export { getDocClient, getTableName } from "./dynamo";
export {
  createDynamoScoreRepository,
  type ScoreRepository,
  type RecordScoreInput,
  type LeaderboardEntry,
  type LeaderboardPage,
  type ProfileData,
  type DynamoScoreRepositoryDeps,
} from "./scoreRepository";
