import type { AuthUser } from "./types";

/**
 * Access policy that enforces the guest-mode restriction (Requirement 10.6):
 * guests get the Local_Leaderboard only; authenticated users additionally get
 * the Global_Leaderboard. Centralised here so screens and the sync service
 * share one source of truth (and Property 25 has one thing to validate).
 */

export type LeaderboardScope = "local" | "global";

/** True when the user is unauthenticated (no user, or the guest provider). */
export function isGuest(user: AuthUser | null): boolean {
  return !user || user.provider === "guest";
}

/**
 * Whether the user has access to the Global_Leaderboard at all. Requires a
 * non-guest identity AND a backend-verifiable bearer token. Game Center users
 * currently carry a null token (no identity-verification signature — see
 * design.md / Task 18.2), so they are local-only until that is resolved.
 */
function hasGlobalAccess(user: AuthUser | null): boolean {
  return !isGuest(user) && !!user?.token;
}

/**
 * Leaderboard scopes available to a user. Local is always available; global is
 * added only for users with verifiable global access.
 */
export function availableLeaderboards(
  user: AuthUser | null,
): LeaderboardScope[] {
  return hasGlobalAccess(user) ? ["local", "global"] : ["local"];
}

/** Whether the user may submit a score to the Global_Leaderboard. */
export function canSubmitGlobalScore(user: AuthUser | null): boolean {
  return hasGlobalAccess(user);
}

/** Whether the user may fetch/view the Global_Leaderboard. */
export function canViewGlobalLeaderboard(user: AuthUser | null): boolean {
  return hasGlobalAccess(user);
}
