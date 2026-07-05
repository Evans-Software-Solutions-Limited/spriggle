import {
  getLocalStorageService,
  type LocalStorageService,
  type SyncQueueEntry,
} from "../localStorage";

/**
 * Offline-first score synchronization (design.md "Sync Service").
 *
 * Scores earned while offline (or that fail to upload) live in the local
 * sync_queue. When connectivity returns, `processQueue` drains it against the
 * Backend_API, applying the design.md error policy per entry:
 *
 *   - 2xx success        → remove from queue (Property 21)
 *   - 4xx client error   → remove from queue (won't succeed on retry — drop)
 *   - 5xx / network error → retain + increment retry count (Property 22)
 */

/** The store methods the sync service depends on. */
export type SyncStore = Pick<
  LocalStorageService,
  "enqueueSyncEntry" | "getSyncQueue" | "removeSyncEntry" | "incrementSyncRetry"
>;

export interface SyncServiceDeps {
  /** Resolves the on-device store (defaults to the app's shared instance). */
  getStore: () => Promise<SyncStore>;
  /** Backend base URL (defaults to EXPO_PUBLIC_API_URL). */
  apiBaseUrl: string;
  /** Injectable fetch for tests. */
  fetchFn: typeof fetch;
}

export interface SyncService {
  processQueue(): Promise<void>;
  submitScore(entry: SyncQueueEntry): Promise<boolean>;
  /**
   * Enqueue a score for the Global_Leaderboard and best-effort drain now:
   * uploads immediately when online, otherwise the entry stays queued for the
   * next reconnect (Requirement 13.1, offline-first).
   */
  queueScore(entry: SyncQueueEntry): Promise<void>;
  onConnectivityChange(isConnected: boolean): void;
}

function defaultDeps(): SyncServiceDeps {
  return {
    getStore: getLocalStorageService,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
    fetchFn: fetch,
  };
}

export class SyncServiceImpl implements SyncService {
  private readonly deps: SyncServiceDeps;
  /** Guards against overlapping drains (e.g. reconnect firing mid-flush). */
  private processing: Promise<void> | null = null;
  /** Set when a drain is requested while one is already running. */
  private rerunRequested = false;

  constructor(deps?: Partial<SyncServiceDeps>) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  /**
   * Submit one score to the backend.
   * @returns true on 2xx (persisted). false on 4xx (client error — caller
   *   should drop the entry).
   * @throws on 5xx or network failure (caller should retain + retry).
   */
  async submitScore(entry: SyncQueueEntry): Promise<boolean> {
    const url = `${this.deps.apiBaseUrl.replace(/\/$/, "")}/api/scores`;
    const res = await this.deps.fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${entry.authToken}`,
      },
      body: JSON.stringify({ score: entry.score, date: entry.date }),
    });

    if (res.ok) return true;
    if (res.status >= 400 && res.status < 500) return false;
    // 5xx (or anything else non-2xx) — server-side, worth retrying later.
    throw new Error(`Score submission failed with status ${res.status}`);
  }

  /**
   * Drain the sync queue. Concurrent calls share the same in-flight run so the
   * queue is never processed twice at once; a drain requested while one is
   * running triggers exactly one more pass afterwards (so entries enqueued
   * mid-drain are still processed — Requirement 13.2).
   */
  processQueue(): Promise<void> {
    if (this.processing) {
      this.rerunRequested = true;
      return this.processing;
    }
    this.processing = this.runDrains().finally(() => {
      this.processing = null;
    });
    return this.processing;
  }

  private async runDrains(): Promise<void> {
    do {
      this.rerunRequested = false;
      await this.drain();
    } while (this.rerunRequested);
  }

  async queueScore(entry: SyncQueueEntry): Promise<void> {
    const store = await this.deps.getStore();
    await store.enqueueSyncEntry(entry);
    // Best-effort immediate drain; failures are handled per-entry inside drain,
    // and a rejected run (e.g. store failure) must not become an unhandled
    // rejection.
    void this.processQueue().catch(() => {});
  }

  private async drain(): Promise<void> {
    const store = await this.deps.getStore();
    const entries = await store.getSyncQueue();
    for (const entry of entries) {
      try {
        // Both success (2xx) and client-error (4xx) resolve the entry: it will
        // never succeed on retry, so drop it either way.
        await this.submitScore(entry);
        await store.removeSyncEntry(entry.id);
      } catch {
        // 5xx / network — keep it queued and record the attempt for backoff.
        await store.incrementSyncRetry(entry.id);
      }
    }
  }

  /** Trigger a drain when connectivity is (re)gained. No-op when offline. */
  onConnectivityChange(isConnected: boolean): void {
    if (isConnected) void this.processQueue().catch(() => {});
  }
}

let singleton: SyncService | null = null;

/** App-wide sync service wired to the shared store and real fetch. */
export function getSyncService(): SyncService {
  if (!singleton) singleton = new SyncServiceImpl();
  return singleton;
}
