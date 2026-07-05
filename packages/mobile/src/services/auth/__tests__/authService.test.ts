import * as SecureStore from "expo-secure-store";

import { AuthServiceImpl } from "../AuthService";
import {
  clearSession,
  loadSession,
  saveSession,
  SESSION_KEY,
} from "../secureStore";
import { canSubmitGlobalScore } from "../guestPolicy";
import type { AuthServiceDeps } from "../AuthService";
import type { AuthUser } from "../types";

// The manual mock (../../../../__mocks__/expo-secure-store.js) exposes a reset.
const resetSecureStore = (
  SecureStore as unknown as { __resetSecureStore: () => void }
).__resetSecureStore;

beforeEach(() => {
  resetSecureStore();
});

/** Build a service with fully in-memory fakes so no native module runs. */
function makeService(
  overrides: {
    providers?: Partial<AuthServiceDeps["providers"]>;
    store?: AuthServiceDeps["store"];
    generateGuestId?: () => string;
  } = {},
) {
  let store: AuthUser | null = null;
  const deps: AuthServiceDeps = {
    providers: {
      apple: async () => ({
        id: "apple-1",
        provider: "apple",
        displayName: "Apple User",
        token: "apple-token",
      }),
      gameCenter: async () => ({
        id: "gc-1",
        provider: "gamecenter",
        displayName: "GC Player",
        token: null,
      }),
      ...overrides.providers,
    },
    store: overrides.store ?? {
      load: async () => store,
      save: async (u) => {
        store = u;
      },
      clear: async () => {
        store = null;
      },
    },
    generateGuestId: overrides.generateGuestId ?? (() => "guest-fixed-id"),
  };
  return new AuthServiceImpl(deps);
}

describe("secure token storage round-trip", () => {
  it("saves, loads, and clears a session via secure store", async () => {
    const user: AuthUser = {
      id: "u1",
      provider: "apple",
      displayName: "Ada",
      token: "secret-token",
    };

    await saveSession(user);
    // Stored under the documented key.
    expect(await SecureStore.getItemAsync(SESSION_KEY)).not.toBeNull();

    const loaded = await loadSession();
    expect(loaded).toEqual(user);

    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it("treats a corrupted blob as no session", async () => {
    await SecureStore.setItemAsync(SESSION_KEY, "not json{{{");
    expect(await loadSession()).toBeNull();
  });

  it("normalizes a missing token to null on load", async () => {
    await SecureStore.setItemAsync(
      SESSION_KEY,
      JSON.stringify({ id: "g", provider: "guest", displayName: "Guest" }),
    );
    const loaded = await loadSession();
    expect(loaded?.token).toBeNull();
  });
});

describe("guest mode", () => {
  it("returns a tokenless guest that is not authenticated", () => {
    const service = makeService();
    const guest = service.playAsGuest();

    expect(guest.provider).toBe("guest");
    expect(guest.token).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getCurrentUser()).toEqual(guest);
    expect(canSubmitGlobalScore(guest)).toBe(false);
  });

  it("persists the guest so it can be restored after relaunch", async () => {
    const service = makeService();
    const guest = service.playAsGuest();
    // Let the fire-and-forget save settle.
    await Promise.resolve();

    const restored = await service.restore();
    expect(restored).toEqual(guest);
  });
});

describe("provider sign-in", () => {
  it("signs in with Apple, persists the session, and reports authenticated", async () => {
    const service = makeService();
    const user = await service.signInWithApple();

    expect(user.provider).toBe("apple");
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getCurrentUser()).toEqual(user);
    expect(await service.restore()).toEqual(user);
  });

  it("treats a Game Center sign-in as authenticated but tokenless", async () => {
    const service = makeService();
    const user = await service.signInWithGameCenter();
    expect(service.isAuthenticated()).toBe(true);
    expect(canSubmitGlobalScore(user)).toBe(false);
  });

  it("does not change the current user when a provider rejects", async () => {
    const service = makeService({
      providers: {
        apple: async () => {
          throw new Error("cancelled");
        },
      },
    });
    await expect(service.signInWithApple()).rejects.toThrow("cancelled");
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});

describe("sign out", () => {
  it("clears the current user and persisted session", async () => {
    const service = makeService();
    await service.signInWithApple();
    expect(service.isAuthenticated()).toBe(true);

    await service.signOut();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(await service.restore()).toBeNull();
  });
});

describe("restore", () => {
  it("returns null when nothing was persisted", async () => {
    const service = makeService();
    expect(await service.restore()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });
});
