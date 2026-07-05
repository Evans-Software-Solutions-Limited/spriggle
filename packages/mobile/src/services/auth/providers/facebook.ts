import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import type { AuthUser } from "../types";

/**
 * Sign in with Facebook (Requirement 10.3).
 *
 * Uses expo-auth-session's imperative OAuth flow (no extra native module, so it
 * survives prebuild). Requires a Facebook app id via EXPO_PUBLIC_FACEBOOK_APP_ID;
 * when unset we fail with a clear, actionable error rather than a cryptic OAuth
 * failure. The returned access token is verified server-side against Facebook's
 * Graph API / JWKS (Task 18.2).
 */

// Dismisses the auth popup automatically when control returns to the app.
WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
};

export async function signInWithFacebook(): Promise<AuthUser> {
  const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    throw new Error(
      "Facebook login is not configured (set EXPO_PUBLIC_FACEBOOK_APP_ID)",
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "spriggle" });
  const request = new AuthSession.AuthRequest({
    clientId: appId,
    scopes: ["public_profile", "email"],
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    extraParams: { display: "popup" },
  });

  const result = await request.promptAsync(FACEBOOK_DISCOVERY);
  if (result.type !== "success" || !result.authentication?.accessToken) {
    throw new Error("Facebook login was cancelled or failed");
  }

  const accessToken = result.authentication.accessToken;
  const profileRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name&access_token=${encodeURIComponent(
      accessToken,
    )}`,
  );
  if (!profileRes.ok) {
    throw new Error("Failed to fetch Facebook profile");
  }
  const profile = (await profileRes.json()) as { id: string; name?: string };

  return {
    id: profile.id,
    provider: "facebook",
    displayName: profile.name ?? "Gardener",
    token: accessToken,
  };
}
