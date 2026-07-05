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
  defaultVerifiers,
  getAuthUser,
  getUser,
  requireAuth,
  resetVerifiers,
  verifyToken,
  type ProviderVerifier,
} from "../multiProvider";

const APPLE_CLIENT_ID = "com.test.spriggle";
const APPLE_ISSUER = "https://appleid.apple.com";

let privateKey: KeyLike;
let jwks: JWTVerifyGetKey;
let appleVerifier: ProviderVerifier;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwks = createLocalJWKSet({ keys: [jwk] });

  // Real builder (issuer/audience/algorithms/toUser) with the remote JWKS
  // swapped for a local one so tests don't hit the network.
  appleVerifier = { ...buildAppleVerifier(APPLE_CLIENT_ID), jwks };
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
      issuer: APPLE_ISSUER,
      audience: APPLE_CLIENT_ID,
      subject: "apple-sub-1",
      claims: { email: "user@icloud.com" },
    });

    const user = await verifyToken(token, [appleVerifier]);
    expect(user).toEqual({
      provider: "apple",
      providerId: "apple-sub-1",
      email: "user@icloud.com",
    });
  });

  it("rejects a token from an unknown issuer", async () => {
    const token = await sign({
      issuer: "https://evil.example.com",
      audience: APPLE_CLIENT_ID,
      subject: "x",
    });
    expect(await verifyToken(token, [appleVerifier])).toBeNull();
  });

  it("rejects a token with the wrong audience", async () => {
    const token = await sign({
      issuer: APPLE_ISSUER,
      audience: "com.someone.else",
      subject: "x",
    });
    expect(await verifyToken(token, [appleVerifier])).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await sign({
      issuer: APPLE_ISSUER,
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
      issuer: APPLE_ISSUER,
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

describe("buildAppleVerifier", () => {
  it("throws when APPLE_CLIENT_ID is absent", () => {
    expect(() => buildAppleVerifier(undefined)).toThrow("APPLE_CLIENT_ID");
  });
});

describe("defaultVerifiers", () => {
  it("throws when no provider is configured (loud misconfiguration)", () => {
    const apple = process.env.APPLE_CLIENT_ID;
    delete process.env.APPLE_CLIENT_ID;
    resetVerifiers();
    try {
      expect(() => defaultVerifiers()).toThrow("No auth providers configured");
    } finally {
      if (apple !== undefined) process.env.APPLE_CLIENT_ID = apple;
      resetVerifiers();
    }
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
    const user = { provider: "apple" as const, providerId: "s" };
    expect(getUser({ user })).toBe(user);
  });
});
