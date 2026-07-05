import fc from "fast-check";
import {
  openInMemoryLocalStorage,
  type LocalLeaderboardEntry,
  type SyncQueueEntry,
} from "../localStorage";

// expo-sqlite is a native module; use the manual mock backed by node:sqlite
// (in-memory) so these tests exercise real SQL under the jest-expo preset.
jest.mock("expo-sqlite");

const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

/** ISO 8601 date string within a sane range (always a valid Date). */
const isoDateArb = fc
  .date({
    min: new Date("2000-01-01T00:00:00.000Z"),
    max: new Date("2100-01-01T00:00:00.000Z"),
  })
  .map((d) => d.toISOString());

/** A non-empty player name. */
const playerNameArb = fc
  .string({ minLength: 1, maxLength: 24 })
  .filter((s) => s.trim().length > 0);

const leaderboardEntryArb: fc.Arbitrary<LocalLeaderboardEntry> = fc.record({
  id: fc.uuid(),
  score: fc.nat({ max: 1_000_000 }),
  playerName: playerNameArb,
  date: isoDateArb,
});

const syncEntryArb: fc.Arbitrary<SyncQueueEntry> = fc.record({
  id: fc.uuid(),
  score: fc.nat({ max: 1_000_000 }),
  playerName: playerNameArb,
  date: isoDateArb,
  authToken: fc.string({ minLength: 1, maxLength: 40 }),
  retryCount: fc.nat({ max: 10 }),
});

describe("Feature: spriggle-ipad-game, Property 18: Score persisted to local leaderboard", () => {
  /**
   * For any completed game, after game end the local leaderboard SHALL contain
   * an entry with the corresponding score, player name, and date.
   * Validates: Requirements 11.1
   */
  it("persists a saved score so it is retrievable from the leaderboard", async () => {
    await fc.assert(
      fc.asyncProperty(leaderboardEntryArb, async (entry) => {
        const store = await openInMemoryLocalStorage();
        await store.saveScore(entry);

        const leaderboard = await store.getLeaderboard();
        const found = leaderboard.find((e) => e.id === entry.id);

        expect(found).toBeDefined();
        expect(found?.score).toBe(entry.score);
        expect(found?.playerName).toBe(entry.playerName);
        expect(found?.date).toBe(entry.date);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 19: Local leaderboard entries contain all required fields", () => {
  /**
   * For any entry in the local leaderboard, it SHALL contain a valid position
   * (positive integer), score (non-negative integer), player name (non-empty
   * string), and date (valid ISO 8601 string). Entries are ordered by score
   * descending, so position is derived from the returned order.
   * Validates: Requirements 11.2
   */
  it("returns well-formed, descending-sorted entries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(leaderboardEntryArb, {
          selector: (e) => e.id,
          minLength: 1,
          maxLength: 12,
        }),
        async (entries) => {
          const store = await openInMemoryLocalStorage();
          for (const entry of entries) {
            await store.saveScore(entry);
          }

          const leaderboard = await store.getLeaderboard();
          expect(leaderboard).toHaveLength(entries.length);

          let previousScore = Infinity;
          leaderboard.forEach((entry, index) => {
            const position = index + 1;
            // Valid position: positive integer
            expect(Number.isInteger(position)).toBe(true);
            expect(position).toBeGreaterThan(0);
            // Non-negative integer score
            expect(Number.isInteger(entry.score)).toBe(true);
            expect(entry.score).toBeGreaterThanOrEqual(0);
            // Non-empty player name
            expect(entry.playerName.length).toBeGreaterThan(0);
            // Valid ISO 8601 date
            expect(entry.date).toMatch(ISO_8601);
            expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
            // Sorted descending by score
            expect(entry.score).toBeLessThanOrEqual(previousScore);
            previousScore = entry.score;
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 20: Sync queue persistence round-trip", () => {
  /**
   * For any set of sync queue entries, persisting to device storage and reading
   * back SHALL produce an equivalent set of entries.
   * Validates: Requirements 13.5, 11.4
   */
  it("round-trips the sync queue through storage", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(syncEntryArb, {
          selector: (e) => e.id,
          maxLength: 12,
        }),
        async (entries) => {
          const store = await openInMemoryLocalStorage();
          for (const entry of entries) {
            await store.enqueueSyncEntry(entry);
          }

          const queue = await store.getSyncQueue();
          expect(queue).toHaveLength(entries.length);

          const byId = (arr: SyncQueueEntry[]) =>
            [...arr].sort((a, b) => a.id.localeCompare(b.id));
          expect(byId(queue)).toEqual(byId(entries));
        },
      ),
      { numRuns: 100 },
    );
  });
});
