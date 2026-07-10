import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import { getLocalStorageService } from "../src/services/localStorage";
import { useAuth } from "../src/auth/AuthContext";
import { canSubmitGlobalScore } from "../src/services/auth";
import { getSyncService } from "../src/services/sync";
import { DesignFrame } from "../src/components/layout/DesignFrame";
import { Mascot } from "../src/components/mascot";

/** Fallback name for local-only leaderboard entries when no display name exists. */
const FALLBACK_PLAYER_NAME = "Guest";

/**
 * Game Over screen — container.
 * Matches prototype's Screens.gameover: centred modal sheet with score display.
 */
export default function GameOverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ score?: string; isBest?: string }>();
  const score = parseInt(params.score ?? "0", 10);
  const isBest = params.isBest === "true";

  const playerName = user?.displayName ?? FALLBACK_PLAYER_NAME;

  // Persist the final score to the local leaderboard exactly once on game end
  // (Requirement 11.1). Best-effort: local persistence failures shouldn't crash
  // the results screen.
  const persistedRef = useRef(false);
  useEffect(() => {
    if (persistedRef.current || Number.isNaN(score)) return;
    persistedRef.current = true;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      score,
      playerName,
      date: new Date().toISOString(),
    };
    getLocalStorageService()
      .then((store) => store.saveScore(entry))
      .catch(() => {
        /* best-effort local persistence */
      });

    // Authenticated players also queue the score for the Global_Leaderboard;
    // it uploads now if online, or on the next reconnect (Requirements 13.1,
    // 12.1). Guests are local-only (Requirement 10.6).
    if (canSubmitGlobalScore(user)) {
      getSyncService()
        .queueScore({
          id: entry.id,
          score,
          playerName,
          date: entry.date,
          authToken: user!.token!,
          retryCount: 0,
        })
        .catch(() => {
          /* best-effort; entry remains queued for retry */
        });
    }
  }, [score, playerName, user]);

  return (
    <DesignFrame>
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.paper, borderColor: colors.surfaceLine },
          ]}
        >
          <Mascot pose={isBest ? "swap" : "idle"} size={110} animated />
          {isBest && (
            <Text style={[styles.bestBanner, { color: colors.gold }]}>
              🌟 New best! 🌟
            </Text>
          )}
          <Text style={[styles.heading, { color: colors.ink }]}>
            {isBest ? "A record harvest" : "Run complete"}
          </Text>
          <Text style={[styles.sub, { color: colors.inkSoft }]}>
            {isBest
              ? "Your patch has never grown bigger."
              : "Better luck next time!"}
          </Text>

          {/* Score display */}
          <View
            style={[
              styles.scoreBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
          >
            <Text style={[styles.scoreLabel, { color: colors.accent700 }]}>
              Final score
            </Text>
            <Text style={[styles.scoreValue, { color: colors.ink }]}>
              {score.toLocaleString()}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/game")}
              accessibilityRole="button"
              accessibilityLabel="Replay"
            >
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                Replay
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.btnGhost,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              accessibilityLabel="Garden (home)"
            >
              <Text style={[styles.btnText, { color: colors.ink }]}>
                Garden
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </DesignFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    width: "86%",
    maxWidth: 560,
    borderRadius: radii.xl,
    borderWidth: 2,
    padding: spacing.s8,
    alignItems: "center",
    gap: 12,
  },
  bestBanner: {
    fontFamily: fonts.display,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 28,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.ui,
    fontSize: 15,
    textAlign: "center",
  },
  scoreBox: {
    width: "100%",
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s4,
    alignItems: "center",
    marginVertical: 12,
  },
  scoreLabel: {
    fontFamily: fonts.uiExtra,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 60,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnGhost: {
    borderWidth: 2,
  },
  btnText: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
  },
});
