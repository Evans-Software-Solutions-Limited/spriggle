import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";

/**
 * Game Over screen — container.
 * Matches prototype's Screens.gameover: centred modal sheet with score display.
 */
export default function GameOverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ score?: string; isBest?: string }>();
  const score = parseInt(params.score ?? "0", 10);
  const isBest = params.isBest === "true";

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.paper, borderColor: colors.surfaceLine },
        ]}
      >
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
            <Text style={[styles.btnText, { color: colors.ink }]}>Garden</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heading: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 28,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
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
    fontFamily: fonts.ui,
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontWeight: "700",
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
    fontFamily: fonts.display,
    fontWeight: "600",
    fontSize: 18,
  },
});
