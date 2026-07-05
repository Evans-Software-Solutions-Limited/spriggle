import * as SQLite from "expo-sqlite";
import {
  createLocalStorageService,
  getLocalStorageService,
  openInMemoryLocalStorage,
  type LocalStorageService,
  type PersistedGameState,
} from "../localStorage";

jest.mock("expo-sqlite");

const sampleState: PersistedGameState = {
  board: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null)),
  score: 42,
  turns: 3,
  isGameOver: false,
};

describe("LocalStorageService", () => {
  let store: LocalStorageService;

  beforeEach(async () => {
    store = await openInMemoryLocalStorage();
  });

  it("returns an empty leaderboard initially", async () => {
    expect(await store.getLeaderboard()).toEqual([]);
  });

  it("saves and loads game state round-trip", async () => {
    await store.saveGameState(sampleState);
    const loaded = await store.loadGameState();
    expect(loaded).toEqual(sampleState);
  });

  it("overwrites the single game_state row on repeated saves", async () => {
    await store.saveGameState(sampleState);
    await store.saveGameState({ ...sampleState, score: 999, isGameOver: true });
    const loaded = await store.loadGameState();
    expect(loaded?.score).toBe(999);
    expect(loaded?.isGameOver).toBe(true);
  });

  it("returns null when no game state has been saved", async () => {
    expect(await store.loadGameState()).toBeNull();
  });

  it("clears saved game state", async () => {
    await store.saveGameState(sampleState);
    await store.clearGameState();
    expect(await store.loadGameState()).toBeNull();
  });

  it("removes a specific sync queue entry", async () => {
    await store.enqueueSyncEntry({
      id: "a",
      score: 10,
      playerName: "One",
      date: new Date().toISOString(),
      authToken: "t1",
      retryCount: 0,
    });
    await store.enqueueSyncEntry({
      id: "b",
      score: 20,
      playerName: "Two",
      date: new Date().toISOString(),
      authToken: "t2",
      retryCount: 1,
    });

    await store.removeSyncEntry("a");

    const queue = await store.getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("b");
  });

  it("increments the retry count for a queued entry", async () => {
    await store.enqueueSyncEntry({
      id: "a",
      score: 10,
      playerName: "One",
      date: new Date().toISOString(),
      authToken: "t1",
      retryCount: 2,
    });

    await store.incrementSyncRetry("a");

    const queue = await store.getSyncQueue();
    expect(queue[0].retryCount).toBe(3);
  });

  it("incrementSyncRetry is a no-op for an unknown id", async () => {
    await expect(store.incrementSyncRetry("missing")).resolves.toBeUndefined();
    expect(await store.getSyncQueue()).toHaveLength(0);
  });

  it("returns null when the saved game state is corrupted", async () => {
    const db = await SQLite.openDatabaseAsync(":memory:");
    const service = await createLocalStorageService(db);
    // Insert invalid JSON directly, bypassing saveGameState.
    await db.runAsync("INSERT INTO game_state (id, state_json) VALUES (1, ?)", [
      "{ not valid json",
    ]);
    expect(await service.loadGameState()).toBeNull();
  });

  it("exposes a shared singleton service via getLocalStorageService", async () => {
    const p1 = getLocalStorageService();
    const p2 = getLocalStorageService();
    expect(p1).toBe(p2);
    const singleton = await p1;
    expect(await singleton.getLeaderboard()).toEqual([]);
  });
});
