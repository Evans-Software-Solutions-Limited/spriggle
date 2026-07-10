import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { ThemeProvider } from "../src/theme";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import {
  OnboardingProvider,
  useOnboarding,
  needsOnboardingRedirect,
} from "../src/onboarding";
import { startConnectivitySync } from "../src/services/sync";

const queryClient = new QueryClient();

export default function RootLayout() {
  // Auto-drain the offline score queue whenever connectivity returns.
  useEffect(() => startConnectivitySync(), []);

  // Load the design fonts up front. Family keys MUST match src/theme/tokens.ts.
  // Until they resolve we render nothing, so no frame is shown in the system
  // font (the previous behaviour, which made the app look unlike the design).
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OnboardingProvider>
              <ThemeProvider>
                <StatusBar hidden />
                <RootNavigator />
              </ThemeProvider>
            </OnboardingProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The navigator + first-run gate. First-time users are routed through
 * sign-in → tutorial before anything else; returning (onboarded) users are
 * left where they are. The redirect waits for both auth and the onboarded flag
 * to settle so it never bounces off a transient default (see
 * needsOnboardingRedirect).
 */
function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isOnboarded, isHydrating } = useOnboarding();
  const { isRestoring } = useAuth();

  useEffect(() => {
    if (
      needsOnboardingRedirect({
        isOnboarded,
        isHydrating,
        isRestoring,
        topSegment: segments[0],
      })
    ) {
      router.replace("/signin");
    }
  }, [isOnboarded, isHydrating, isRestoring, segments, router]);

  // Each screen wraps its own content in <DesignFrame> so the 1194×834 canvas
  // is scaled inside that screen's view tree. We deliberately do NOT wrap
  // <Stack> here: expo-router uses native-stack (react-native-screens), so each
  // screen is a native view controller laid out against the window — a JS
  // transform on the navigator does not compose onto native frames, and native
  // modals present on the window regardless.
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="game" />
      <Stack.Screen name="gameover" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="onboarding" />
      {/* Full-screen (not a modal): a native iPad modal renders as a smaller
          sheet, which mis-scales the DesignFrame canvas. */}
      <Stack.Screen name="signin" />
    </Stack>
  );
}
