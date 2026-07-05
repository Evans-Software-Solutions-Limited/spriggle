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
 * local leaderboard SHALL be available. Authenticated users additionally get
 * the global leaderboard.
 *
 * Validates: Requirements 10.5, 10.6
 */

const AUTHED_PROVIDERS: AuthProvider[] = [
  "apple",
  "gamecenter",
  "facebook",
  "email",
];

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

  it("grants authenticated users the global leaderboard (submission gated on a token)", () => {
    fc.assert(
      fc.property(authedUserArb, (user) => {
        expect(isGuest(user)).toBe(false);
        expect(availableLeaderboards(user)).toEqual(["local", "global"]);
        expect(canViewGlobalLeaderboard(user)).toBe(true);
        // Submission additionally requires a bearer token.
        expect(canSubmitGlobalScore(user)).toBe(user.token !== null);
      }),
      { numRuns: 100 },
    );
  });
});
