// DynamoDB single table for users/scores + a leaderboard GSI (see
// packages/db/src/scoreRepository.ts for the access-pattern design).
export const scoresTable = new sst.aws.Dynamo("SpriggleScores", {
  fields: {
    PK: "string",
    SK: "string",
    GSI1PK: "string",
    GSI1SK: "string",
  },
  primaryIndex: { hashKey: "PK", rangeKey: "SK" },
  globalIndexes: {
    GSI1: { hashKey: "GSI1PK", rangeKey: "GSI1SK" },
  },
});

export const spriggleAPI = new sst.aws.ApiGatewayV2("api-spriggle");

spriggleAPI.route("$default", {
  handler: "microservices/core/src/api.handler",
  // `link` grants the Lambda IAM access to the table; SCORES_TABLE is what the
  // repository reads at runtime. APPLE_CLIENT_ID is the bundle id used to verify
  // Apple Sign-In tokens (the only server-verified provider for MVP).
  link: [scoresTable],
  environment: {
    SCORES_TABLE: scoresTable.name,
    APPLE_CLIENT_ID: "com.bradleyevans96.spriggle",
  },
});
