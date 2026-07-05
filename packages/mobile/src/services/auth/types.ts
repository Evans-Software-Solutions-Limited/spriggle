/**
 * Multi-provider authentication types (design.md "Auth Module").
 *
 * The mobile app supports five identity sources. Only authenticated providers
 * (everything except "guest") carry a backend-verifiable token; guests play
 * local-only (Requirements 10.5, 10.6).
 */

export type AuthProvider =
  | "apple"
  | "gamecenter"
  | "facebook"
  | "email"
  | "guest";
// Note: "facebook" remains in the union (backend user.provider column + future
// support) but has no client sign-in path for MVP — deferred per product
// decision. Users who would use Facebook can play as a guest instead.

/** The authenticated (or guest) player as the app sees them. */
export interface AuthUser {
  /** Stable per-provider identity (provider user id, or a generated guest id). */
  id: string;
  provider: AuthProvider;
  /** Human-readable name shown in the UI (identity chip, game-over, leaderboard). */
  displayName: string;
  /**
   * Bearer token sent to the Backend_API. `null` for guests — guests never
   * reach the global leaderboard (Requirement 10.6).
   */
  token: string | null;
}

/**
 * Auth service surface (design.md). Sign-in methods resolve to the signed-in
 * user or reject on failure/cancellation. `playAsGuest` is synchronous because
 * it never touches a network provider.
 */
export interface AuthService {
  signInWithApple(): Promise<AuthUser>;
  signInWithGameCenter(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  playAsGuest(): AuthUser;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  isAuthenticated(): boolean;
  /**
   * Rehydrate the session persisted by a previous launch (secure store).
   * Returns the restored user, or null if there was no saved session.
   * Not in the original design.md interface — added for app-start restore and
   * documented there.
   */
  restore(): Promise<AuthUser | null>;
}
