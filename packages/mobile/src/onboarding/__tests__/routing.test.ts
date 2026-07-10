import { needsOnboardingRedirect } from "../routing";

const base = {
  isOnboarded: false,
  isHydrating: false,
  isRestoring: false,
  topSegment: undefined as string | undefined,
};

describe("needsOnboardingRedirect", () => {
  it("redirects a first-time user landing on the home (index) route", () => {
    expect(needsOnboardingRedirect(base)).toBe(true);
  });

  it("does NOT redirect an onboarded (returning) user", () => {
    expect(needsOnboardingRedirect({ ...base, isOnboarded: true })).toBe(false);
  });

  it("waits while the onboarded flag is still hydrating", () => {
    expect(needsOnboardingRedirect({ ...base, isHydrating: true })).toBe(false);
  });

  it("waits while the auth session is still restoring", () => {
    expect(needsOnboardingRedirect({ ...base, isRestoring: true })).toBe(false);
  });

  it("does not loop when already on the sign-in screen", () => {
    expect(needsOnboardingRedirect({ ...base, topSegment: "signin" })).toBe(
      false,
    );
  });

  it("does not loop when already on the onboarding screen", () => {
    expect(needsOnboardingRedirect({ ...base, topSegment: "onboarding" })).toBe(
      false,
    );
  });

  it("still redirects a first-time user on any other route", () => {
    expect(needsOnboardingRedirect({ ...base, topSegment: "game" })).toBe(true);
  });
});
