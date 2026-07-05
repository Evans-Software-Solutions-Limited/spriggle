import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
  type KeyLike,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import {
  buildAppleVerifier,
  buildSupabaseVerifier,
  getAuthUser,
  getUser,
  requireAuth,
  verifyToken,
  type ProviderVerifier,
} from "../multiProvider";

const APPLE_CLIENT_ID = "com.test.spriggle";
const SUPABASE_URL = "https://proj.supabase.co";
const SUPABASE_ISSUER = `${SUPABASE_URL}/auth/v1`;

let privateKey: KeyLike;
let jwks: JWTVerifyGetKey;
let appleVerifier: ProviderVerifier;
let supabaseVerifier: ProviderVerifier;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwks = createLocalJWKSet({ keys: [jwk] });

  // Real builders (issuer/audience/toUser) with the remote JWKS swapped for a
  // local one so tests don't hit the network.
  appleVerifier = { ...buildAppleVerifier(APPLE_CLIENT_ID), jwks };
  supabaseVerifier = { ...buildSupabaseVerifier(SUPABASE_URL), jwks };
});

interface SignOptions {
  issuer: string;
  audience: string;
  subject: string;
  claims?: Record<string, unknown>;
  expiresIn?: string;
}

async function sign(opts: SignOptions): Promise<string> {
  return new SignJWT(opts.claims ?? {})
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(opts.issuer)
    .setAudience(opts.audience)
    .setSubject(opts.subject)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? "1h")
    .sign(privateKey);
}

describe("verifyToken", () => {
  it("verifies a valid Apple token and maps it to an AuthenticatedUser", async () => {
    const token = await sign({
      issuer: "https://appleid.apple.com",
      audience: APPLE_CLIENT_ID,
      subject: "apple-sub-1",
      claims: { email: "user@icloud.com" },
    });

    const user = await verifyToken(token, [appleVerifier, supabaseVerifier]);
    expect(user).toEqual({
      provider: "apple",
      providerId: "apple-sub-1",
      email: "user@icloud.com",
    });
  });

  it("verifies a valid Supabase token and extracts the display name", async () => {
    const token = await sign({
      issuer: SUPABASE_ISSUER,
      audience: "authenticated",
      subject: "supa-sub-1",
      claims: {
        email: "player@example.com",
        user_metadata: { full_name: "Ada Lovelace" },
      },
    });

    const user = await verifyToken(token, [appleVerifier, supabaseVerifier]);
    expect(user).toEqual({
      provider: "email",
      providerId: "supa-sub-1",
      email: "player@example.com",
      displayName: "Ada Lovelace",
    });
  });

  it("rejects a token from an unknown issuer", async () => {
    const token = await sign({
      issuer: "https://evil.example.com",
      audience: APPLE_CLIENT_ID,
      subject: "x",
    });
    expect(
      await verifyToken(token, [appleVerifier, supabaseVerifier]),
    ).toBeNull();
  });

  it("rejects a token with the wrong audience", async () => {
    const token = await sign({
      issuer: "https://appleid.apple.com",
      audience: "com.someone.else",
      subject: "x",
    });
    expect(await verifyToken(token, [appleVerifier])).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await sign({
      issuer: "https://appleid.apple.com",
      audience: APPLE_CLIENT_ID,
      subject: "x",
      expiresIn: "-1h",
    });
    expect(await verifyToken(token, [appleVerifier])).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await verifyToken("not-a-jwt", [appleVerifier])).toBeNull();
  });
});

describe("getAuthUser", () => {
  it("returns the user for a valid Bearer header", async () => {
    const token = await sign({
      issuer: "https://appleid.apple.com",
      audience: APPLE_CLIENT_ID,
      subject: "apple-sub-2",
    });
    const user = await getAuthUser(`Bearer ${token}`, [appleVerifier]);
    expect(user?.providerId).toBe("apple-sub-2");
  });

  it("returns null when the header is missing or not a Bearer token", async () => {
    expect(await getAuthUser(undefined, [appleVerifier])).toBeNull();
    expect(await getAuthUser("Basic abc", [appleVerifier])).toBeNull();
  });
});

describe("builders require configuration", () => {
  it("throws when APPLE_CLIENT_ID is absent", () => {
    expect(() => buildAppleVerifier(undefined)).toThrow("APPLE_CLIENT_ID");
  });

  it("throws when SUPABASE_URL is absent", () => {
    expect(() => buildSupabaseVerifier(undefined)).toThrow("SUPABASE_URL");
  });
});

describe("Elysia guards", () => {
  it("requireAuth returns 401 when there is no user", () => {
    const ctx = { user: null, set: { status: 0 } };
    const result = requireAuth(ctx);
    expect(ctx.set.status).toBe(401);
    expect(result).toEqual({ message: "Unauthorized" });
  });

  it("requireAuth passes through when a user is present", () => {
    const ctx = {
      user: { provider: "apple", providerId: "s" },
      set: { status: 0 },
    };
    expect(requireAuth(ctx)).toBeUndefined();
    expect(ctx.set.status).toBe(0);
  });

  it("getUser returns the authenticated user", () => {
    const user = { provider: "email" as const, providerId: "s" };
    expect(getUser({ user })).toBe(user);
  });
});
