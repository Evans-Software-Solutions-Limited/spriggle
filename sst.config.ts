/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    const stage = input?.stage ?? "dev";
    return {
      name: "spriggle-api",
      removal: stage === "production" ? "retain" : "remove",
      protect: stage === "production",
      home: "aws",
      providers: {
        aws: {
          defaultTags: {
            tags: {
              App: "spriggle-api",
              Stage: stage,
            },
          },
        },
      },
    };
  },
  async run() {
    const api = await import("./infra/api");
    return {
      api: api.spriggleAPI.url,
    };
  },
});
