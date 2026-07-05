import * as AppleAuthentication from "expo-apple-authentication";
import ExpoGameCenter from "expo-game-center";

import { signInWithApple } from "../providers/apple";
import { signInWithGameCenter } from "../providers/gameCenter";

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
