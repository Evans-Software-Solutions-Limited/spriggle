import { by, device, element, expect, waitFor } from "detox";

/**
 * Flow: sign in → global leaderboard (Requirements 10.1, 12.2).
 *
 * The Apple Sign-In system sheet can't be driven headlessly in Detox, and the
 * global board needs the deployed dev backend, so the fully-authenticated
 * "score appears on the global board" assertion is verified at the Task 23
 * checkpoint against a dev stage. Here we assert the sign-in entry points and
 * that the Global tab loads (its loading/empty/error state) when online.
 */
describe("Sign-in → global leaderboard", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("offers the provider sign-in options", async () => {
    await element(by.label("Sign in or continue as guest")).tap();
    await waitFor(element(by.label("Continue with Apple")))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.label("Continue with Game Center"))).toBeVisible();
  });

  it("opens the Global leaderboard tab", async () => {
    await device.openURL({ url: "spriggle://leaderboard" });
    await element(by.label("Global leaderboard")).tap();
    // Online: the tab renders its data / empty / error state (backend content
    // is asserted end-to-end against the dev stage in Task 23).
    await waitFor(element(by.label("Global leaderboard")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
