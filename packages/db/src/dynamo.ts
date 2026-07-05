import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * DynamoDB document client for the Spriggle backend.
 *
 * DynamoDB is a natural fit for a serverless (Lambda) backend: no connection
 * pool to manage, pay-per-request, and the scores/leaderboard/profile access
 * patterns map cleanly onto a single table + one GSI (see scoreRepository.ts).
 */

let _client: DynamoDBDocumentClient | null = null;

/** Shared document client (one per warm Lambda container). */
export function getDocClient(): DynamoDBDocumentClient {
  if (!_client) {
    _client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _client;
}

/** Table name injected by SST (infra) via the SCORES_TABLE environment var. */
export function getTableName(): string {
  const name = process.env.SCORES_TABLE;
  if (!name) {
    throw new Error(
      "SCORES_TABLE is not set. It is injected by SST from the DynamoDB table.",
    );
  }
  return name;
}
