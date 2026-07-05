import ExpoGameCenter from "expo-game-center";

import type { AuthUser } from "../types";

/**
 * Sign in with Game Center (Requirement 10.2).
 *
 * Uses the community `expo-game-center` module (config-plugin based; adds the
 * `com.apple.developer.game-center` entitlement at prebuild). It authenticates
 * the local player and exposes `playerID` / `displayName`.
 *
 * IMPORTANT — backend verification gap: this module does NOT expose GameKit's
 * identity-verification signature (`fetchItems(forIdentityVerificationSignature:)`),
 * so there is no cryptographically verifiable token to hand the Backend_API.
 * We therefore treat Game Center as a client-side identity for now and carry a
 * null token, which keeps GC users on the local leaderboard until Task 18.2
 * decides how to verify them server-side (extend the native module to surface
 * the signature, or bind GC identities to an Apple/Supabase token). See
 * design.md "Auth Module".
 */
export async function signInWithGameCenter(): Promise<AuthUser> {
  if (!ExpoGameCenter) {
    throw new Error("Game Center module is unavailable on this device");
  }

  const available = await ExpoGameCenter.isGameCenterAvailable();
  if (!available) {
    throw new Error("Game Center is not available on this device");
  }

  const authenticated = await ExpoGameCenter.authenticateLocalPlayer();
  if (!authenticated) {
    throw new Error("Game Center authentication was declined");
  }

  const player = await ExpoGameCenter.getLocalPlayer();
  if (!player) {
    throw new Error("Game Center did not return a local player");
  }

  return {
    id: player.playerID,
    provider: "gamecenter",
    displayName: player.displayName || player.alias || "Gardener",
    // No server-verifiable token available from this module (see note above).
    token: null,
  };
}
