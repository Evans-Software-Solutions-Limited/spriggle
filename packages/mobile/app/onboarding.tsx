import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import { DesignFrame } from "../src/components/layout/DesignFrame";
import { Mascot } from "../src/components/mascot";

const TIPS = [
  {
    pose: "dig" as const,
    title: "Dig a patch",
    body: "Tap a group of 5 or more connected same-type plants to harvest them for points.",
  },
  {
    pose: "swap" as const,
    title: "Swap to build",
    body: "Swap two neighbouring plants to line up bigger groups before you dig.",
  },
  {
    pose: "idle" as const,
    title: "Keep it clear",
    body: "New plants sprout after every move. The run ends when the patch fills with no group to dig.",
  },
];

/**
 * "How to play" screen. Reached from the pause sheet (How to play). Explains
 * the dig/swap loop with the mascot. A scripted first-run tutorial is a
 * future enhancement; this static guide covers the mechanics.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <DesignFrame>
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        <Text style={[styles.heading, { color: colors.ink }]}>How to play</Text>

        <View style={styles.cards}>
          {TIPS.map((tip) => (
            <View
              key={tip.title}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
            >
              <Mascot pose={tip.pose} size={92} />
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                {tip.title}
              </Text>
              <Text style={[styles.cardBody, { color: colors.inkSoft }]}>
                {tip.body}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Got it"
        >
          <Text style={[styles.btnText, { color: colors.onPrimary }]}>
            Got it!
          </Text>
        </Pressable>
      </View>
    </DesignFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s8,
    gap: 24,
  },
  heading: { fontFamily: fonts.display, fontSize: 36 },
  cards: { flexDirection: "row", gap: 16 },
  card: {
    flex: 1,
    maxWidth: 300,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.s5,
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, textAlign: "center" },
  cardBody: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  btn: { borderRadius: radii.md, paddingHorizontal: 32, paddingVertical: 16 },
  btnText: { fontFamily: fonts.display, fontSize: 20 },
});
