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

type Provider = "apple" | "gamecenter" | "guest";

/**
 * Sign-in screen — pick an identity provider (Apple 10.1, Game Center 10.2) or
 * continue as a guest (local-only, 10.5/10.6). Presented as a modal from the
 * home identity chip; dismisses back on success.
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
        <View style={styles.leftPanel}>
          <Text style={[styles.brand, { color: colors.primary }]}>
            Spriggle
          </Text>
          <Text style={[styles.tagline, { color: colors.accent700 }]}>
            Sign in to climb the global leaderboard
          </Text>
          <Pressable
            style={styles.guestLink}
            onPress={() => run("guest", async () => auth.playAsGuest())}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Text style={[styles.guestText, { color: colors.inkSoft }]}>
              Continue as guest →
            </Text>
          </Pressable>
        </View>

        <View style={styles.rightPanel}>
          {providerButton("apple", "Continue with Apple", auth.signInWithApple)}
          {providerButton(
            "gamecenter",
            "Continue with Game Center",
            auth.signInWithGameCenter,
          )}

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
  screen: { flex: 1, flexDirection: "row", padding: 30, gap: 30 },
  leftPanel: { flex: 0.42, justifyContent: "center", gap: 10 },
  brand: {
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -0.5,
  },
  tagline: { fontFamily: fonts.ui, fontSize: 15 },
  guestLink: { marginTop: 18 },
  guestText: { fontFamily: fonts.uiExtra, fontSize: 14 },
  rightPanel: { flex: 0.58, justifyContent: "center", gap: 12 },
  providerBtn: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: "center",
  },
  providerText: { fontFamily: fonts.display, fontSize: 16 },
  error: {
    fontFamily: fonts.ui,
    fontSize: 13,
    textAlign: "center",
  },
});
