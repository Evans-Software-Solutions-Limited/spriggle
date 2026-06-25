import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(), // apple | gamecenter | facebook | email
  providerId: text("provider_id").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  score: integer("score").notNull(),
  playedAt: timestamp("played_at").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
