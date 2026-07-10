/**
 * First-run routing decision, extracted as a pure function so it can be unit
 * tested without expo-router. Used by the root navigator (app/_layout.tsx) to
 * push first-time users through the sign-in → tutorial flow before anything
 * else, while leaving returning (onboarded) users untouched.
 */
export interface OnboardingRedirectParams {
  /** Whether the tutorial has been completed (persisted flag). */
  isOnboarded: boolean;
  /** True while the onboarded flag is still loading from storage. */
  isHydrating: boolean;
  /** True while the auth session is still restoring. */
  isRestoring: boolean;
  /** The top route segment (expo-router `useSegments()[0]`); undefined = index. */
  topSegment: string | undefined;
}

/**
 * Returns true when a first-time user should be redirected to the sign-in
 * screen. We wait until both auth and the onboarded flag have settled (so we
 * never bounce off a transient default), then force any not-yet-onboarded user
 * into the first-run flow — unless they are already inside it (signin /
 * onboarding), which would loop.
 */
export function needsOnboardingRedirect({
  isOnboarded,
  isHydrating,
  isRestoring,
  topSegment,
}: OnboardingRedirectParams): boolean {
  if (isHydrating || isRestoring) return false;
  if (isOnboarded) return false;
  const inFirstRunFlow = topSegment === "signin" || topSegment === "onboarding";
  return !inFirstRunFlow;
}
