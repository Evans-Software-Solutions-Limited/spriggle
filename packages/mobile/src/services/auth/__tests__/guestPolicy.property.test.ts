import fc from "fast-check";

import {
  availableLeaderboards,
  canSubmitGlobalScore,
  canViewGlobalLeaderboard,
  isGuest,
} from "../guestPolicy";
import type { AuthProvider, AuthUser } from "../types";

/**
 * Feature: spriggle-ipad-game, Property 25: Guest mode restricted to local leaderboard
 *
 * For any user in guest mode (the "guest" provider, or no user at all),
 * global-leaderboard submission and viewing SHALL be restricted and only the
 * local leaderboard SHALL be available. Global access additionally requires a
 * backend-verifiable token, so token-less authenticated users (e.g. Game
 * Center) are also local-only.
 *
 * Validates: Requirements 10.6
 */

const AUTHED_PROVIDERS: AuthProvider[] = ["apple", "gamecenter"];

const guestUserArb: fc.Arbitrary<AuthUser | null> = fc.oneof(
  fc.constant(null),
  fc.record({
    id: fc.string(),
    provider: fc.constant<AuthProvider>("guest"),
    displayName: fc.string(),
    // A guest never legitimately holds a token, but even if one leaked in,
    // provider === "guest" must still gate them out.
    token: fc.oneof(fc.constant(null), fc.string()),
  }),
);

const authedUserArb: fc.Arbitrary<AuthUser> = fc.record({
  id: fc.string({ minLength: 1 }),
  provider: fc.constantFrom(...AUTHED_PROVIDERS),
  displayName: fc.string({ minLength: 1 }),
  token: fc.oneof(fc.constant(null), fc.string({ minLength: 1 })),
});

describe("Feature: spriggle-ipad-game, Property 25: Guest mode restricted to local leaderboard", () => {
  it("restricts guests to the local leaderboard only", () => {
    fc.assert(
      fc.property(guestUserArb, (user) => {
        expect(isGuest(user)).toBe(true);
        expect(availableLeaderboards(user)).toEqual(["local"]);
        expect(canViewGlobalLeaderboard(user)).toBe(false);
        expect(canSubmitGlobalScore(user)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("grants global access only to authenticated users with a token", () => {
    fc.assert(
      fc.property(authedUserArb, (user) => {
        expect(isGuest(user)).toBe(false);
        // Global access (view + submit) requires a verifiable bearer token.
        const hasToken = user.token !== null;
        expect(availableLeaderboards(user)).toEqual(
          hasToken ? ["local", "global"] : ["local"],
        );
        expect(canViewGlobalLeaderboard(user)).toBe(hasToken);
        expect(canSubmitGlobalScore(user)).toBe(hasToken);
      }),
      { numRuns: 100 },
    );
  });
});
