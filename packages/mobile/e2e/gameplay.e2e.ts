import { by, device, element, expect, waitFor } from "detox";

/**
 * Flow: home → play → game over → score displayed (Requirements: gameplay loop,
 * 11.1 local persistence).
 *
 * Reaching game-over through real play is non-deterministic, so we drive the
 * results screen via the app's deep link (expo-router) with a fixed score, then
 * assert it renders and lands on the local leaderboard.
 */
describe("Gameplay → game over → score", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it("opens the game from the home screen", async () => {
    await element(by.label("Play Classic")).tap();
    await waitFor(element(by.label("Dig tool")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("shows the final score on the game-over screen", async () => {
    await device.openURL({ url: "spriggle://gameover?score=1234" });
    await waitFor(element(by.text("1,234")))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.label("Replay"))).toBeVisible();
  });

  it("persists the score to the local leaderboard", async () => {
    await element(by.label("Garden (home)")).tap();
    await element(by.label("Leaderboard")).atIndex(0).tap();
    await element(by.label("Local leaderboard")).tap();
    await waitFor(element(by.text("1,234")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
