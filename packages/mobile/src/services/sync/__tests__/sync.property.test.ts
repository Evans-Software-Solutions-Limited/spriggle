import fc from "fast-check";

import {
  openInMemoryLocalStorage,
  type SyncQueueEntry,
} from "../../localStorage";
import { SyncServiceImpl } from "../SyncService";

/**
 * Feature: spriggle-ipad-game, Property 21: Successful sync removes entry from queue
 * Feature: spriggle-ipad-game, Property 22: Failed sync retains entry in queue
 *
 * Property 21 — for any sync-queue entry that submits successfully (2xx), the
 * queue SHALL no longer contain it after processing. (Validates 13.3)
 * Property 22 — for any entry whose submission fails with a server error (5xx),
 * the entry SHALL remain queued with its retry count incremented. (Validates 13.4)
 */

// Timestamps within a sane range so toISOString never throws.
const isoDateArb = fc
  .integer({ min: 0, max: 4102444800000 })
  .map((ms) => new Date(ms).toISOString());

const entryArb: fc.Arbitrary<SyncQueueEntry> = fc.record({
  id: fc.string(),
  score: fc.nat(),
  playerName: fc.string(),
  date: isoDateArb,
  authToken: fc.string({ minLength: 1 }),
  retryCount: fc.nat({ max: 100 }),
});

/** Give every entry a unique id so rows don't collide on INSERT OR REPLACE. */
const uniqueEntriesArb = fc
  .array(entryArb, { minLength: 1, maxLength: 8 })
  .map((entries) => entries.map((e, i) => ({ ...e, id: `entry-${i}` })));

const fakeFetch = (ok: boolean, status: number) =>
  (async () => ({ ok, status }) as unknown as Response) as typeof fetch;

describe("Feature: spriggle-ipad-game, Property 21: Successful sync removes entry from queue", () => {
  it("empties the queue when every submission returns 2xx", async () => {
    await fc.assert(
      fc.asyncProperty(uniqueEntriesArb, async (entries) => {
        const store = await openInMemoryLocalStorage();
        for (const e of entries) await store.enqueueSyncEntry(e);

        const service = new SyncServiceImpl({
          getStore: async () => store,
          apiBaseUrl: "https://api.test",
          fetchFn: fakeFetch(true, 200),
        });
        await service.processQueue();

        expect(await store.getSyncQueue()).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 22: Failed sync retains entry in queue", () => {
  it("retains every entry with an incremented retry count on 5xx", async () => {
    await fc.assert(
      fc.asyncProperty(uniqueEntriesArb, async (entries) => {
        const store = await openInMemoryLocalStorage();
        for (const e of entries) await store.enqueueSyncEntry(e);

        const service = new SyncServiceImpl({
          getStore: async () => store,
          apiBaseUrl: "https://api.test",
          fetchFn: fakeFetch(false, 500),
        });
        await service.processQueue();

        const remaining = await store.getSyncQueue();
        expect(remaining).toHaveLength(entries.length);
        const byId = new Map(remaining.map((r) => [r.id, r]));
        for (const e of entries) {
          expect(byId.get(e.id)?.retryCount).toBe(e.retryCount + 1);
        }
      }),
      { numRuns: 100 },
    );
  });
});
