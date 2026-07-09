import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "../src/theme";
import { AuthProvider } from "../src/auth/AuthContext";
import { DesignFrame } from "../src/components/layout/DesignFrame";
import { startConnectivitySync } from "../src/services/sync";

const queryClient = new QueryClient();

export default function RootLayout() {
  // Auto-drain the offline score queue whenever connectivity returns.
  useEffect(() => startConnectivitySync(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <StatusBar hidden />
              <DesignFrame>
                <Stack
                  screenOptions={{ headerShown: false, animation: "fade" }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="game" />
                  <Stack.Screen name="gameover" />
                  <Stack.Screen name="leaderboard" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen
                    name="signin"
                    options={{ presentation: "modal" }}
                  />
                </Stack>
              </DesignFrame>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
