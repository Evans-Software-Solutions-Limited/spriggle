import { databaseUrl } from "./secrets";

export const spriggleAPI = new sst.aws.ApiGatewayV2("api-spriggle");

spriggleAPI.route("$default", {
  handler: "microservices/core/src/api.handler",
  environment: {
    DATABASE_URL: databaseUrl.value,
  },
});
