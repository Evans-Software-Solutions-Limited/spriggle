import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // apple | gamecenter | facebook | email
    providerId: text("provider_id").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // A player is uniquely identified by (provider, providerId); this backs the
    // upsert on sign-in and prevents duplicate user rows.
    unique("users_provider_provider_id_unique").on(t.provider, t.providerId),
  ],
);

export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  score: integer("score").notNull(),
  playedAt: timestamp("played_at").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
