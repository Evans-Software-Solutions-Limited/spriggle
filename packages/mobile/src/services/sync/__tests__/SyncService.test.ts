import NetInfo from "@react-native-community/netinfo";

import {
  openInMemoryLocalStorage,
  type LocalStorageService,
  type SyncQueueEntry,
} from "../../localStorage";
import { SyncServiceImpl } from "../SyncService";
import { startConnectivitySync } from "../connectivity";

const addEventListener = NetInfo.addEventListener as jest.Mock;

function entry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: "e1",
    score: 100,
    playerName: "Ada",
    date: "2026-01-01T00:00:00.000Z",
    authToken: "token-abc",
    retryCount: 0,
    ...overrides,
  };
}

const fakeFetch = (ok: boolean, status: number) => {
  const fn = jest.fn(async () => ({ ok, status }) as unknown as Response);
  return fn as unknown as typeof fetch & jest.Mock;
};

let store: LocalStorageService;
beforeEach(async () => {
  store = await openInMemoryLocalStorage();
  jest.clearAllMocks();
});

describe("submitScore", () => {
  it("POSTs to /api/scores with a bearer token and returns true on 2xx", async () => {
    const fetchFn = fakeFetch(true, 201);
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test/",
      fetchFn,
    });

    await expect(service.submitScore(entry())).resolves.toBe(true);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.test/api/scores",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-abc",
        }),
        body: JSON.stringify({ score: 100, date: "2026-01-01T00:00:00.000Z" }),
      }),
    );
  });

  it("returns false on a 4xx client error", async () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(false, 400),
    });
    await expect(service.submitScore(entry())).resolves.toBe(false);
  });

  it("throws on a 5xx server error", async () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(false, 503),
    });
    await expect(service.submitScore(entry())).rejects.toThrow("status 503");
  });
});

describe("processQueue", () => {
  it("uploads a score that was enqueued offline and removes it", async () => {
    await store.enqueueSyncEntry(entry({ id: "offline-1" }));
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(true, 200),
    });

    await service.processQueue();
    expect(await store.getSyncQueue()).toHaveLength(0);
  });

  it("retains and increments retry count on a server error", async () => {
    await store.enqueueSyncEntry(entry({ id: "e1", retryCount: 2 }));
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(false, 500),
    });

    await service.processQueue();
    const queue = await store.getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retryCount).toBe(3);
  });

  it("drops a 4xx entry (won't succeed on retry)", async () => {
    await store.enqueueSyncEntry(entry({ id: "bad" }));
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(false, 422),
    });

    await service.processQueue();
    expect(await store.getSyncQueue()).toHaveLength(0);
  });

  it("does not submit the same entry twice under concurrent calls", async () => {
    await store.enqueueSyncEntry(entry({ id: "e1" }));
    const fetchFn = fakeFetch(true, 200);
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn,
    });

    await Promise.all([service.processQueue(), service.processQueue()]);
    // Concurrent calls coalesce: the entry is uploaded exactly once.
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(await store.getSyncQueue()).toHaveLength(0);
  });

  it("retains and increments on a network error (fetch rejects)", async () => {
    await store.enqueueSyncEntry(entry({ id: "e1", retryCount: 0 }));
    const fetchFn = jest.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn,
    });

    await service.processQueue();
    const queue = await store.getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retryCount).toBe(1);
  });
});

describe("queueScore", () => {
  it("enqueues a score and uploads it immediately when online", async () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(true, 200),
    });

    await service.queueScore(entry({ id: "q1" }));
    // Await the in-flight (fire-and-forget) drain kicked off by queueScore.
    await service.processQueue();

    expect(await store.getSyncQueue()).toHaveLength(0);
  });

  it("keeps the score queued when the upload fails (offline / 5xx)", async () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(false, 500),
    });

    await service.queueScore(entry({ id: "q2", retryCount: 0 }));
    await service.processQueue();

    const queue = await store.getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("q2");
    expect(queue[0].retryCount).toBeGreaterThanOrEqual(1);
  });
});

describe("onConnectivityChange", () => {
  it("drains the queue when connectivity is regained", () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(true, 200),
    });
    const spy = jest.spyOn(service, "processQueue").mockResolvedValue();

    service.onConnectivityChange(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does nothing while offline", () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(true, 200),
    });
    const spy = jest.spyOn(service, "processQueue").mockResolvedValue();

    service.onConnectivityChange(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("startConnectivitySync", () => {
  it("forwards NetInfo connectivity changes to the service", () => {
    const service = new SyncServiceImpl({
      getStore: async () => store,
      apiBaseUrl: "https://api.test",
      fetchFn: fakeFetch(true, 200),
    });
    const onChange = jest
      .spyOn(service, "onConnectivityChange")
      .mockImplementation(() => {});

    const unsubscribe = startConnectivitySync(service);
    expect(addEventListener).toHaveBeenCalledTimes(1);

    // Invoke the registered listener as NetInfo would.
    const listener = addEventListener.mock.calls[0][0] as (s: {
      isConnected: boolean | null;
    }) => void;
    listener({ isConnected: true });
    listener({ isConnected: false });
    listener({ isConnected: null });

    expect(onChange.mock.calls).toEqual([[true], [false], [false]]);
    expect(typeof unsubscribe).toBe("function");
  });
});
