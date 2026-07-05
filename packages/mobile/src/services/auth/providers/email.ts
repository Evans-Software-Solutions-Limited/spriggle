import type { AuthUser } from "../types";

/**
 * Sign in with Email/Password (Requirement 10.4).
 *
 * Authenticates against Supabase Auth (GoTrue) via its REST endpoint —
 * no heavy SDK needed. The returned `access_token` is a Supabase JWT that the
 * Backend_API verifies with the existing `supabaseAuth.ts` JWKS verifier
 * (packages/api-utils), which is why email uses Supabase rather than a bespoke
 * endpoint. Config comes from EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY.
 */

interface GoTrueTokenResponse {
  access_token?: string;
  user?: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  };
  error_description?: string;
  msg?: string;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Email login is not configured (set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  const res = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    },
  );

  const data = (await res.json()) as GoTrueTokenResponse;
  if (!res.ok || !data.access_token || !data.user) {
    throw new Error(
      data.error_description ?? data.msg ?? "Invalid email or password",
    );
  }

  const displayName =
    data.user.user_metadata?.full_name ??
    data.user.user_metadata?.name ??
    data.user.email ??
    "Gardener";

  return {
    id: data.user.id,
    provider: "email",
    displayName,
    token: data.access_token,
  };
}
