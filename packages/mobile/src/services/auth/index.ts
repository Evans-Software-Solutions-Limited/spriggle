export { AuthServiceImpl, authService } from "./AuthService";
export type { AuthServiceDeps } from "./AuthService";
export {
  isGuest,
  availableLeaderboards,
  canSubmitGlobalScore,
  canViewGlobalLeaderboard,
  type LeaderboardScope,
} from "./guestPolicy";
export {
  loadSession,
  saveSession,
  clearSession,
  SESSION_KEY,
  type SecureStoreLike,
} from "./secureStore";
export type { AuthProvider, AuthUser, AuthService } from "./types";
