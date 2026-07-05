import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

/**
 * Multi-issuer JWT verification for the Backend_API (Requirements 14.1, 14.3).
 *
 * Each request's bearer token is verified against the provider whose `iss`
 * (issuer) matches the token — signature, issuer, audience, algorithm, and
 * expiry are all checked via the provider's JWKS. Verified tokens map to a
 * normalized AuthenticatedUser keyed by (provider, providerId).
 *
 * MVP verifies **Apple Sign-In** only. Game Center is client-side only (no
 * server-verifiable token — design.md / Task 18.2); email/Supabase and Facebook
 * were dropped for MVP. The multi-issuer shape is kept so more providers can be
 * added later.
 */

export type VerifiedProvider = "apple";

export interface AuthenticatedUser {
  provider: VerifiedProvider;
  /** Stable per-provider subject (token `sub`) — the user's identity key. */
  providerId: string;
  email?: string;
  displayName?: string;
}

/** A single provider's verification config. */
export interface ProviderVerifier {
  provider: VerifiedProvider;
  issuer: string;
  jwks: JWTVerifyGetKey;
  /** Expected audience (Apple: the app's client/bundle id). */
  audience?: string;
  /** Allowed signing algorithms (defense-in-depth against algorithm confusion). */
  algorithms: string[];
  toUser: (payload: JWTPayload) => AuthenticatedUser;
}

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

/** Apple Sign-In verifier. Requires APPLE_CLIENT_ID (the app bundle id). */
export function buildAppleVerifier(
  clientId = process.env.APPLE_CLIENT_ID,
): ProviderVerifier {
  if (!clientId) {
    throw new Error("APPLE_CLIENT_ID environment variable is not set");
  }
  return {
    provider: "apple",
    issuer: APPLE_ISSUER,
    jwks: createRemoteJWKSet(new URL(APPLE_JWKS_URL)),
    audience: clientId,
    algorithms: ["RS256"],
    toUser: (payload) => ({
      provider: "apple",
      providerId: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : undefined,
    }),
  };
}

// Verifiers are cached per warm Lambda instance to avoid rebuilding JWKS sets
// (which keep their own key cache) on every request.
let _verifiers: ProviderVerifier[] | null = null;

/**
 * Build the default provider verifiers from the environment. Throws when no
 * provider is configured — that's a deployment misconfiguration and must fail
 * loudly rather than silently rejecting every request as unauthorized.
 */
export function defaultVerifiers(): ProviderVerifier[] {
  if (_verifiers) return _verifiers;
  const verifiers: ProviderVerifier[] = [];
  if (process.env.APPLE_CLIENT_ID) verifiers.push(buildAppleVerifier());
  if (verifiers.length === 0) {
    throw new Error("No auth providers configured: set APPLE_CLIENT_ID");
  }
  _verifiers = verifiers;
  return verifiers;
}

/** Test/hot-reload helper to drop the cached verifiers. */
export function resetVerifiers(): void {
  _verifiers = null;
}

/**
 * Verify a raw JWT against the matching provider. Returns the normalized user,
 * or null if the token is missing an issuer we recognize, or fails signature /
 * issuer / audience / expiry verification.
 */
export async function verifyToken(
  token: string,
  verifiers: ProviderVerifier[] = defaultVerifiers(),
): Promise<AuthenticatedUser | null> {
  let issuer: string | undefined;
  try {
    issuer = decodeJwt(token).iss;
  } catch {
    return null; // not a well-formed JWT
  }

  const verifier = verifiers.find((v) => v.issuer === issuer);
  if (!verifier) return null;

  try {
    const { payload } = await jwtVerify(token, verifier.jwks, {
      issuer: verifier.issuer,
      audience: verifier.audience,
      algorithms: verifier.algorithms,
    });
    if (!payload.sub) return null;
    return verifier.toUser(payload);
  } catch (err) {
    console.error("[multiProvider] JWT verification failed:", err);
    return null;
  }
}

/**
 * Verify the token from an Authorization header. Returns the user or null when
 * the header is missing / not a Bearer token / invalid.
 */
export async function getAuthUser(
  authHeader: string | undefined,
  verifiers?: ProviderVerifier[],
): Promise<AuthenticatedUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7), verifiers);
}

/**
 * Elysia onBeforeHandle guard. Wire after a `.derive` that sets `user`:
 *
 *   .derive(async ({ headers }) => ({ user: await getAuthUser(headers.authorization) }))
 *   .onBeforeHandle(requireAuth)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireAuth(ctx: any) {
  if (!ctx.user) {
    ctx.set.status = 401;
    return { message: "Unauthorized" };
  }
}

/** Read the authenticated user after requireAuth has run (guaranteed non-null). */
export function getUser(ctx: {
  user: AuthenticatedUser | null;
}): AuthenticatedUser {
  return ctx.user as AuthenticatedUser;
}
