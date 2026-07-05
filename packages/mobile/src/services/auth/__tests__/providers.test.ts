import * as AppleAuthentication from "expo-apple-authentication";
import ExpoGameCenter from "expo-game-center";

import { signInWithApple } from "../providers/apple";
import { signInWithGameCenter } from "../providers/gameCenter";
import { signInWithEmail } from "../providers/email";

const appleSignIn = AppleAuthentication.signInAsync as jest.Mock;

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("apple provider", () => {
  it("maps a credential to an AuthUser with a joined display name", async () => {
    const user = await signInWithApple();
    expect(user).toEqual({
      id: "apple-user-123",
      provider: "apple",
      displayName: "Test Gardener",
      token: "mock.apple.identity.token",
    });
  });

  it("falls back to a generic name when Apple omits the full name", async () => {
    appleSignIn.mockResolvedValueOnce({
      user: "apple-user-123",
      identityToken: "tok",
      fullName: null,
    });
    const user = await signInWithApple();
    expect(user.displayName).toBe("Gardener");
  });

  it("throws when no identity token is returned", async () => {
    appleSignIn.mockResolvedValueOnce({ user: "x", identityToken: null });
    await expect(signInWithApple()).rejects.toThrow("identity token");
  });
});

describe("game center provider", () => {
  it("returns an authenticated, tokenless user", async () => {
    const user = await signInWithGameCenter();
    expect(user).toEqual({
      id: "G:123456789",
      provider: "gamecenter",
      displayName: "Mock Player",
      token: null,
    });
  });

  it("throws when Game Center is unavailable", async () => {
    (ExpoGameCenter.isGameCenterAvailable as jest.Mock).mockResolvedValueOnce(
      false,
    );
    await expect(signInWithGameCenter()).rejects.toThrow("not available");
  });

  it("throws when the player declines authentication", async () => {
    (ExpoGameCenter.authenticateLocalPlayer as jest.Mock).mockResolvedValueOnce(
      false,
    );
    await expect(signInWithGameCenter()).rejects.toThrow("declined");
  });
});

describe("email provider", () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });
  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = url;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = key;
  });

  it("throws when Supabase config is missing", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    await expect(signInWithEmail("a@b.com", "pw")).rejects.toThrow(
      "not configured",
    );
  });

  it("returns an AuthUser using metadata full name when present", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "supa-token",
        user: {
          id: "u-1",
          email: "a@b.com",
          user_metadata: { full_name: "Ada Lovelace" },
        },
      }),
    } as Response);

    const user = await signInWithEmail("a@b.com", "pw");
    expect(user).toEqual({
      id: "u-1",
      provider: "email",
      displayName: "Ada Lovelace",
      token: "supa-token",
    });
  });

  it("rejects invalid credentials with the server message", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error_description: "Invalid login credentials" }),
    } as Response);

    await expect(signInWithEmail("a@b.com", "wrong")).rejects.toThrow(
      "Invalid login credentials",
    );
  });
});
