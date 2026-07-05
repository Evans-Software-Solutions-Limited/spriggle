import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authService as defaultAuthService } from "../services/auth";
import type { AuthService, AuthUser } from "../services/auth";

/**
 * React binding over the AuthService singleton. Screens read `user` /
 * `isAuthenticated` and call the sign-in helpers; the provider restores any
 * persisted session on mount so identity survives a relaunch.
 */
interface AuthContextValue {
  /** Current user, or null when signed out (pre-guest). */
  user: AuthUser | null;
  /** True only for non-guest, authenticated users. */
  isAuthenticated: boolean;
  /** True while the initial session restore is in flight. */
  isRestoring: boolean;
  signInWithApple: () => Promise<AuthUser>;
  signInWithGameCenter: () => Promise<AuthUser>;
  signInWithFacebook: () => Promise<AuthUser>;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
  playAsGuest: () => AuthUser;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Overridable for tests; defaults to the app-wide singleton. */
  service?: AuthService;
}

export function AuthProvider({
  children,
  service = defaultAuthService,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    service
      .restore()
      .then((restored) => {
        if (active) setUser(restored);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [service]);

  const signInWithApple = useCallback(async () => {
    const u = await service.signInWithApple();
    setUser(u);
    return u;
  }, [service]);

  const signInWithGameCenter = useCallback(async () => {
    const u = await service.signInWithGameCenter();
    setUser(u);
    return u;
  }, [service]);

  const signInWithFacebook = useCallback(async () => {
    const u = await service.signInWithFacebook();
    setUser(u);
    return u;
  }, [service]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const u = await service.signInWithEmail(email, password);
      setUser(u);
      return u;
    },
    [service],
  );

  const playAsGuest = useCallback(() => {
    const guest = service.playAsGuest();
    setUser(guest);
    return guest;
  }, [service]);

  const signOut = useCallback(async () => {
    await service.signOut();
    setUser(null);
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null && user.provider !== "guest",
      isRestoring,
      signInWithApple,
      signInWithGameCenter,
      signInWithFacebook,
      signInWithEmail,
      playAsGuest,
      signOut,
    }),
    [
      user,
      isRestoring,
      signInWithApple,
      signInWithGameCenter,
      signInWithFacebook,
      signInWithEmail,
      playAsGuest,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read the auth context. Throws if used outside an AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
