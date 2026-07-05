import * as SQLite from "expo-sqlite";
import type { PlantTypeName } from "../components/plants";

/**
 * Local, on-device persistence backed by expo-sqlite.
 *
 * Three tables (see design.md Data Models):
 *  - local_leaderboard: personal best scores (survives restarts)
 *  - sync_queue:        score submissions awaiting upload when online
 *  - game_state:        single-row snapshot of the in-progress game
 *
 * This module is a plain service (container/presenter split): screens and
 * hooks call it; presenters stay dumb.
 */

/** A row in the on-device leaderboard. */
export interface LocalLeaderboardEntry {
  id: string;
  score: number;
  playerName: string;
  /** ISO 8601 timestamp. */
  date: string;
}

/** A score submission waiting to be synced to the backend. */
export interface SyncQueueEntry {
  id: string;
  score: number;
  playerName: string;
  /** ISO 8601 timestamp. */
  date: string;
  authToken: string;
  retryCount: number;
}

/** Serializable snapshot of an in-progress game (resume flow, Task 13). */
export interface PersistedGameState {
  board: (PlantTypeName | null)[][];
  score: number;
  turns: number;
  isGameOver: boolean;
}

export interface LocalStorageService {
  saveScore(entry: LocalLeaderboardEntry): Promise<void>;
  /** Returns entries sorted by score descending. */
  getLeaderboard(): Promise<LocalLeaderboardEntry[]>;
  saveGameState(state: PersistedGameState): Promise<void>;
  loadGameState(): Promise<PersistedGameState | null>;
  clearGameState(): Promise<void>;
  enqueueSyncEntry(entry: SyncQueueEntry): Promise<void>;
  getSyncQueue(): Promise<SyncQueueEntry[]>;
  removeSyncEntry(id: string): Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS local_leaderboard (
  id TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  date TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

interface LeaderboardRow {
  id: string;
  score: number;
  playerName: string;
  date: string;
}

interface SyncRow {
  id: string;
  score: number;
  playerName: string;
  date: string;
  authToken: string;
  retryCount: number;
}

interface GameStateRow {
  state_json: string;
}

/**
 * Build a LocalStorageService bound to an already-open database, ensuring the
 * schema exists. Exposed for tests (pass an in-memory database).
 */
export async function createLocalStorageService(
  db: SQLite.SQLiteDatabase,
): Promise<LocalStorageService> {
  await db.execAsync(SCHEMA);

  return {
    async saveScore(entry) {
      await db.runAsync(
        "INSERT OR REPLACE INTO local_leaderboard (id, score, player_name, date) VALUES (?, ?, ?, ?)",
        [entry.id, entry.score, entry.playerName, entry.date],
      );
    },

    async getLeaderboard() {
      const rows = await db.getAllAsync<LeaderboardRow>(
        "SELECT id, score, player_name AS playerName, date FROM local_leaderboard ORDER BY score DESC, created_at ASC, rowid ASC",
      );
      return rows.map((r) => ({
        id: r.id,
        score: r.score,
        playerName: r.playerName,
        date: r.date,
      }));
    },

    async saveGameState(state) {
      await db.runAsync(
        `INSERT INTO game_state (id, state_json, updated_at)
         VALUES (1, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`,
        [JSON.stringify(state)],
      );
    },

    async loadGameState() {
      const row = await db.getFirstAsync<GameStateRow>(
        "SELECT state_json FROM game_state WHERE id = 1",
      );
      if (!row) return null;
      try {
        return JSON.parse(row.state_json) as PersistedGameState;
      } catch {
        // Corrupted state — treat as no saved game (design.md error handling).
        return null;
      }
    },

    async clearGameState() {
      await db.runAsync("DELETE FROM game_state WHERE id = 1");
    },

    async enqueueSyncEntry(entry) {
      await db.runAsync(
        "INSERT OR REPLACE INTO sync_queue (id, score, player_name, date, auth_token, retry_count) VALUES (?, ?, ?, ?, ?, ?)",
        [
          entry.id,
          entry.score,
          entry.playerName,
          entry.date,
          entry.authToken,
          entry.retryCount,
        ],
      );
    },

    async getSyncQueue() {
      const rows = await db.getAllAsync<SyncRow>(
        "SELECT id, score, player_name AS playerName, date, auth_token AS authToken, retry_count AS retryCount FROM sync_queue ORDER BY created_at ASC",
      );
      return rows.map((r) => ({
        id: r.id,
        score: r.score,
        playerName: r.playerName,
        date: r.date,
        authToken: r.authToken,
        retryCount: r.retryCount,
      }));
    },

    async removeSyncEntry(id) {
      await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [id]);
    },
  };
}

const DB_NAME = "spriggle.db";

let servicePromise: Promise<LocalStorageService> | null = null;

/**
 * Lazily open the app's persistent database and return the shared service.
 * Used by screens/hooks in the running app.
 */
export function getLocalStorageService(): Promise<LocalStorageService> {
  if (!servicePromise) {
    servicePromise = SQLite.openDatabaseAsync(DB_NAME)
      .then(createLocalStorageService)
      .catch((err) => {
        // Don't cache a rejected promise — allow a later call to retry.
        servicePromise = null;
        throw err;
      });
  }
  return servicePromise;
}

/**
 * Open a fresh in-memory service. Primarily for tests, where each instance is
 * an isolated database.
 */
export function openInMemoryLocalStorage(): Promise<LocalStorageService> {
  return SQLite.openDatabaseAsync(":memory:").then(createLocalStorageService);
}
