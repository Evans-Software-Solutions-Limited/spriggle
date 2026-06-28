import Elysia from "elysia";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";

const app = new Elysia().get("/health", () => ({ status: "ok" }));

// Placeholder routes — will be populated in tasks 19.1-19.3
// .use(scoresSubmitHandler)
// .use(leaderboardHandler)
// .use(profileHandler)

export type SpriggleApi = typeof app;

const honoApp = new Hono();
honoApp.mount("/", app.fetch);

export const handler = handle(honoApp);
