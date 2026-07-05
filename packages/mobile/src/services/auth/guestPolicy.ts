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
 * Leaderboard scopes available to a user. Guests: local only. Authenticated
 * users: local + global.
 */
export function availableLeaderboards(
  user: AuthUser | null,
): LeaderboardScope[] {
  return isGuest(user) ? ["local"] : ["local", "global"];
}

/**
 * Whether the user may submit a score to the Global_Leaderboard. Requires a
 * non-guest identity AND a bearer token (the backend rejects tokenless calls).
 */
export function canSubmitGlobalScore(user: AuthUser | null): boolean {
  return !isGuest(user) && !!user?.token;
}

/** Whether the user may fetch/view the Global_Leaderboard. */
export function canViewGlobalLeaderboard(user: AuthUser | null): boolean {
  return !isGuest(user);
}
