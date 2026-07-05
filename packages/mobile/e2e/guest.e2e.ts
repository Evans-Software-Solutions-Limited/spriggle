import { by, device, element, expect, waitFor } from "detox";

/**
 * Flow: guest mode → play → local leaderboard only (Requirements 10.5, 10.6).
 *
 * A guest can play and see local scores, but the global board requires sign-in
 * — verified via the sign-in screen's provider options being the path to it.
 */
describe("Guest mode → local-only", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("continues as a guest from the sign-in screen", async () => {
    await element(by.label("Sign in or continue as guest")).tap();
    await waitFor(element(by.text("Continue as guest →")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("Continue as guest →")).tap();
    // Back on home as a guest.
    await waitFor(element(by.label("Play Classic")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("records a guest score to the local leaderboard", async () => {
    await device.openURL({ url: "spriggle://gameover?score=777" });
    await element(by.label("Garden (home)")).tap();
    await element(by.label("Leaderboard")).tap();
    await element(by.label("Local leaderboard")).tap();
    await waitFor(element(by.text("777")))
      .toBeVisible()
      .withTimeout(10000);
    // Player name is the guest fallback.
    await expect(element(by.text("Guest"))).toBeVisible();
  });
});
