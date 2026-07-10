import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persists whether the player has completed the first-run tutorial. Mirrors
 * ThemeContext's AsyncStorage pattern; `isHydrating` lets the root navigator
 * wait for the stored value before deciding the first screen (so a returning
 * user never flashes the tutorial).
 */
interface OnboardingContextValue {
  /** True once the tutorial has been completed. */
  isOnboarded: boolean;
  /** True until the persisted flag has been read on mount. */
  isHydrating: boolean;
  /** Persist the onboarded flag (fire-and-forget write). */
  setOnboarded: (value: boolean) => void;
}

const STORAGE_KEY = "@spriggle/onboarded";

const OnboardingContext = createContext<OnboardingContextValue>({
  isOnboarded: false,
  isHydrating: true,
  setOnboarded: () => {},
});

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  // Load the persisted flag on mount, then release the routing gate.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && stored === "true") setIsOnboarded(true);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setOnboarded = useCallback((value: boolean) => {
    setIsOnboarded(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? "true" : "false").catch(() => {});
  }, []);

  return (
    <OnboardingContext.Provider
      value={{ isOnboarded, isHydrating, setOnboarded }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  return useContext(OnboardingContext);
}
