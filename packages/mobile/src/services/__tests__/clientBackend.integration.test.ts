import { openInMemoryLocalStorage } from "../localStorage";
import { SyncServiceImpl } from "../sync/SyncService";

/**
 * Client ↔ backend score-submission integration (Task 21.2, Requirements 12.1,
 * 13.1, 13.2): the SyncService drives the real request shape against the
 * backend's POST /api/scores, exercising both the online and offline paths with
 * the on-device queue.
 */

const entry = {
  id: "s1",
  score: 100,
  playerName: "Ada",
  date: "2026-01-01T00:00:00.000Z",
  authToken: "apple-token",
  retryCount: 0,
};

describe("score submission (online)", () => {
  it("uploads a queued score to /api/scores and clears the queue", async () => {
    const store = await openInMemoryLocalStorage();
    const fetchFn = jest.fn(
      async () => ({ ok: true, status: 201 }) as unknown as Response,
    ) as unknown as typeof fetch;
    const sync = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn,
    });

    await sync.queueScore(entry);
    await sync.processQueue();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.test/api/scores",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer apple-token",
        }),
      }),
    );
    expect(await store.getSyncQueue()).toHaveLength(0);
  });
});

describe("score submission (offline)", () => {
  it("retains the queued score when the request fails", async () => {
    const store = await openInMemoryLocalStorage();
    const fetchFn = jest.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const sync = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn,
    });

    await sync.queueScore({ ...entry, id: "s2" });
    await sync.processQueue();

    const queue = await store.getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retryCount).toBeGreaterThanOrEqual(1);
  });
});
