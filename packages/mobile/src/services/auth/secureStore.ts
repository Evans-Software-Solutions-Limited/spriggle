import * as SecureStore from "expo-secure-store";

import type { AuthUser } from "./types";

/**
 * Persists the current auth session to the device keychain/keystore via
 * expo-secure-store. We store the whole `AuthUser` (id, provider, display name,
 * token) as a single JSON blob so a relaunch can restore identity without a
 * round-trip to the provider.
 *
 * Guests are persisted too (token: null) so "continue as guest" survives a
 * restart, but they hold no secret material.
 */

const SESSION_KEY = "spriggle.auth.session";

/** The subset of expo-secure-store this module needs — makes tests trivial. */
export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const defaultStore: SecureStoreLike = {
  getItemAsync: SecureStore.getItemAsync,
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
};

/** Reads and validates the persisted session. Corrupt data is treated as none. */
export async function loadSession(
  store: SecureStoreLike = defaultStore,
): Promise<AuthUser | null> {
  const raw = await store.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.provider === "string" &&
      typeof parsed.displayName === "string"
    ) {
      return { ...parsed, token: parsed.token ?? null };
    }
    return null;
  } catch {
    // Corrupted blob — behave as if there were no saved session.
    return null;
  }
}

/** Persists (overwrites) the current session. */
export async function saveSession(
  user: AuthUser,
  store: SecureStoreLike = defaultStore,
): Promise<void> {
  await store.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

/** Clears any persisted session (sign-out). */
export async function clearSession(
  store: SecureStoreLike = defaultStore,
): Promise<void> {
  await store.deleteItemAsync(SESSION_KEY);
}

export { SESSION_KEY };
