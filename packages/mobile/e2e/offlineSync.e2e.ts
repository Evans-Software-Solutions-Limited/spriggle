import { by, device, element, waitFor } from "detox";

/**
 * Flow: play offline → reconnect → scores sync (Requirements 13.1–13.3).
 *
 * Connectivity is simulated with Detox's URL blacklist to block the backend.
 * The local persistence half is deterministic here; the "queued score reaches
 * the global board after reconnect" half needs the deployed dev backend and is
 * verified at the Task 23 checkpoint.
 */
describe("Offline → reconnect → sync", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it("records a score while offline (backend blocked)", async () => {
    await device.setURLBlacklist([".*api.*"]);
    await device.openURL({ url: "spriggle://gameover?score=555" });

    await element(by.label("Garden (home)")).tap();
    await element(by.label("Leaderboard")).atIndex(0).tap();
    await element(by.label("Local leaderboard")).tap();
    await waitFor(element(by.text("555")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("clears the network block on reconnect (queue drains in the background)", async () => {
    // Lifting the blacklist lets the sync queue drain to the backend on the
    // next connectivity event; the global-board assertion is a Task 23 check.
    await device.setURLBlacklist([]);
    await waitFor(element(by.label("Local leaderboard")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
