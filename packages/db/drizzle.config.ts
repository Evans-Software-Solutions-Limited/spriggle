import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for the Spriggle Postgres schema (Supabase).
 *
 *   bun run db:generate  → generate SQL migrations from src/schema.ts into ./drizzle
 *   bun run db:migrate   → apply pending migrations to DATABASE_URL
 *
 * `generate` works offline (no DB needed); `migrate`/`push`/`studio` require
 * DATABASE_URL — use the Supabase transaction-pooler URL (see client.ts).
 */
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
