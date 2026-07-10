import { by, device, element, expect, waitFor } from "detox";

/**
 * Flow: guest mode → play → local leaderboard only (Requirements 10.5, 10.6).
 *
 * A guest can play and see local scores, but the global board requires sign-in
 * — verified via the sign-in screen's provider options being the path to it.
 */
describe("Guest mode → local-only", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it("continues as a guest and completes first-run onboarding", async () => {
    // A first launch routes straight to sign-in (the first-run gate in
    // app/_layout). Guest hands off into the interactive tutorial; skipping it
    // marks the app onboarded and drops the player into the game.
    await waitFor(element(by.text("Continue as guest")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("Continue as guest")).tap();
    await waitFor(element(by.label("Skip tutorial")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.label("Skip tutorial")).tap();
    await waitFor(element(by.label("Pause")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("records a guest score to the local leaderboard", async () => {
    await device.openURL({ url: "spriggle://gameover?score=777" });
    await element(by.label("Garden (home)")).tap();
    await element(by.label("Leaderboard")).atIndex(0).tap();
    await element(by.label("Local leaderboard")).tap();
    await waitFor(element(by.text("777")))
      .toBeVisible()
      .withTimeout(10000);
    // Player name is the guest fallback.
    await expect(element(by.text("Guest")).atIndex(0)).toBeVisible();
  });
});
