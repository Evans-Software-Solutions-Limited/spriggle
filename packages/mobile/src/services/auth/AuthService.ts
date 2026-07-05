import {
  clearSession,
  loadSession,
  saveSession,
  type SecureStoreLike,
} from "./secureStore";
import { signInWithApple as appleProvider } from "./providers/apple";
import { signInWithGameCenter as gameCenterProvider } from "./providers/gameCenter";
import { isGuest } from "./guestPolicy";
import type { AuthService, AuthUser } from "./types";

/**
 * Injectable collaborators — real implementations by default, swapped for
 * fakes in unit tests so no native module or network is touched.
 */
export interface AuthServiceDeps {
  providers: {
    apple: () => Promise<AuthUser>;
    gameCenter: () => Promise<AuthUser>;
  };
  store: {
    load: () => Promise<AuthUser | null>;
    save: (user: AuthUser) => Promise<void>;
    clear: () => Promise<void>;
  };
  /** Generates a guest id; injectable for deterministic tests. */
  generateGuestId: () => string;
}

function defaultDeps(secureStore?: SecureStoreLike): AuthServiceDeps {
  return {
    providers: {
      apple: appleProvider,
      gameCenter: gameCenterProvider,
    },
    store: {
      load: () => loadSession(secureStore),
      save: (user) => saveSession(user, secureStore),
      clear: () => clearSession(secureStore),
    },
    generateGuestId: () =>
      `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

/**
 * Concrete multi-provider auth service (design.md "Auth Module").
 *
 * Holds the current user in memory and mirrors it to secure storage so a
 * relaunch can `restore()` it. Every successful sign-in (including guest)
 * replaces and persists the current session.
 */
export class AuthServiceImpl implements AuthService {
  private currentUser: AuthUser | null = null;
  private readonly deps: AuthServiceDeps;
  /**
   * Serializes all persistence writes so they always apply in call order.
   * Without this, the fire-and-forget guest save could resolve after a later
   * awaited sign-in/sign-out and silently downgrade the persisted session.
   */
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    deps?: Partial<AuthServiceDeps> & { secureStore?: SecureStoreLike },
  ) {
    const base = defaultDeps(deps?.secureStore);
    this.deps = {
      providers: { ...base.providers, ...deps?.providers },
      store: { ...base.store, ...deps?.store },
      generateGuestId: deps?.generateGuestId ?? base.generateGuestId,
    };
  }

  /** Enqueue a persistence write onto the ordered chain. */
  private enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
    const run = this.writeChain.then(op, op);
    // Keep the chain alive regardless of individual write failures.
    this.writeChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async setSession(user: AuthUser): Promise<AuthUser> {
    this.currentUser = user;
    await this.enqueueWrite(() => this.deps.store.save(user));
    return user;
  }

  signInWithApple(): Promise<AuthUser> {
    return this.deps.providers.apple().then((u) => this.setSession(u));
  }

  signInWithGameCenter(): Promise<AuthUser> {
    return this.deps.providers.gameCenter().then((u) => this.setSession(u));
  }

  playAsGuest(): AuthUser {
    const guest: AuthUser = {
      id: this.deps.generateGuestId(),
      provider: "guest",
      displayName: "Guest",
      token: null,
    };
    this.currentUser = guest;
    // Fire-and-forget persistence: guest continuity is best-effort and must
    // not block the (synchronous) return the design interface promises. The
    // write is ordered on the same chain as sign-in/out so it can't clobber a
    // later session.
    void this.enqueueWrite(() => this.deps.store.save(guest));
    return guest;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    await this.enqueueWrite(() => this.deps.store.clear());
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !isGuest(this.currentUser);
  }

  async restore(): Promise<AuthUser | null> {
    const user = await this.deps.store.load();
    this.currentUser = user;
    return user;
  }
}

/** App-wide singleton wired to the real providers + secure store. */
export const authService: AuthService = new AuthServiceImpl();
