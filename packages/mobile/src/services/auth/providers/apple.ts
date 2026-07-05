import * as AppleAuthentication from "expo-apple-authentication";

import type { AuthUser } from "../types";

/**
 * Sign in with Apple (Requirement 10.1).
 *
 * Uses the native Apple flow via expo-apple-authentication. The returned
 * `identityToken` is a signed JWT the backend verifies against Apple's JWKS
 * (Task 18.2). Apple only returns the user's full name on the *first* consent,
 * so we fall back to a generic display name on subsequent sign-ins.
 */
export async function signInWithApple(): Promise<AuthUser> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple Sign-In did not return an identity token");
  }

  const displayName =
    [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Gardener";

  return {
    id: credential.user,
    provider: "apple",
    displayName,
    token: credential.identityToken,
  };
}
