import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingProvider, useOnboarding } from "../OnboardingContext";

const STORAGE_KEY = "@spriggle/onboarded";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("OnboardingContext", () => {
  it("defaults to not-onboarded once hydration settles", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    expect(result.current.isOnboarded).toBe(false);
  });

  it("hydrates isOnboarded=true from a persisted flag", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    expect(result.current.isOnboarded).toBe(true);
  });

  it("persists the flag when setOnboarded is called", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isHydrating).toBe(false));

    act(() => result.current.setOnboarded(true));

    expect(result.current.isOnboarded).toBe(true);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe("true"),
    );
  });
});
