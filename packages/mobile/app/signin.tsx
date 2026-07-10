import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";
import { DesignFrame } from "../src/components/layout/DesignFrame";
import { Mascot } from "../src/components/mascot";

type Provider = "apple" | "gamecenter" | "guest";

/**
 * Sign-in screen. Guest is the primary path (the game plays fully offline);
 * signing in only owns your leaderboard name across devices. Presented
 * full-screen (see _layout) so the DesignFrame canvas scales correctly.
 * Matches the prototype's Screens.signin layout.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const auth = useAuth();

  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const run = async (provider: Provider, action: () => Promise<unknown>) => {
    setError(null);
    setBusy(provider);
    try {
      await action();
      dismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const providerButton = (
    provider: Exclude<Provider, "guest">,
    label: string,
    action: () => Promise<unknown>,
  ) => (
    <Pressable
      style={[
        styles.providerBtn,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLine },
      ]}
      onPress={() => run(provider, action)}
      disabled={busy !== null}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy === provider ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text style={[styles.providerText, { color: colors.ink }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );

  return (
    <DesignFrame>
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        {/* Left: branded hero */}
        <View style={[styles.leftPanel, { backgroundColor: colors.primary }]}>
          <Mascot pose="idle" size={150} />
          <Text style={[styles.brand, { color: colors.onPrimary }]}>
            Spriggle
          </Text>
          <Text style={[styles.tagline, { color: colors.onPrimary }]}>
            A cosy little harvesting puzzle.
          </Text>
        </View>

        {/* Right: guest-first sign-in */}
        <View style={styles.rightPanel}>
          <Text style={[styles.heading, { color: colors.ink }]}>
            Welcome to the garden
          </Text>
          <Text style={[styles.sub, { color: colors.inkSoft }]}>
            Jump straight in — no account needed. Sign in only if you want to
            own your leaderboard name across devices.
          </Text>

          <Pressable
            style={[styles.guestBtn, { backgroundColor: colors.primary }]}
            onPress={() => run("guest", async () => auth.playAsGuest())}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            {busy === "guest" ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.guestText, { color: colors.onPrimary }]}>
                Continue as guest
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View
              style={[styles.divider, { backgroundColor: colors.surfaceLine }]}
            />
            <Text style={[styles.dividerText, { color: colors.inkFaint }]}>
              OR
            </Text>
            <View
              style={[styles.divider, { backgroundColor: colors.surfaceLine }]}
            />
          </View>

          {providerButton("apple", "Sign in with Apple", auth.signInWithApple)}
          {providerButton(
            "gamecenter",
            "Sign in with Game Center",
            auth.signInWithGameCenter,
          )}

          <Text style={[styles.offline, { color: colors.inkFaint }]}>
            Plays fully offline · scores sync when you&apos;re back online
          </Text>

          {error && (
            <Text style={[styles.error, { color: colors.accent700 }]}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </DesignFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: "row" },
  leftPanel: {
    flex: 0.42,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 30,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -0.5,
  },
  tagline: { fontFamily: fonts.ui, fontSize: 15, opacity: 0.9 },
  rightPanel: {
    flex: 0.58,
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  heading: { fontFamily: fonts.display, fontSize: 30 },
  sub: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  guestBtn: {
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  guestText: { fontFamily: fonts.display, fontSize: 18 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  divider: { flex: 1, height: 2, borderRadius: 1 },
  dividerText: { fontFamily: fonts.uiExtra, fontSize: 12 },
  providerBtn: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: "center",
  },
  providerText: { fontFamily: fonts.display, fontSize: 16 },
  offline: {
    fontFamily: fonts.ui,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  error: {
    fontFamily: fonts.ui,
    fontSize: 13,
    textAlign: "center",
  },
});
