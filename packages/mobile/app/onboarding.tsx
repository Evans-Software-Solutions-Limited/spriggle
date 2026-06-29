import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";

/**
 * Onboarding screen — placeholder container.
 * Full interactive tutorial will be implemented in a later task.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <Text style={[styles.heading, { color: colors.ink }]}>How to play</Text>
      <Text style={[styles.body, { color: colors.inkSoft }]}>
        1. Dig a connected group of 5+ same-type plants{"\n"}
        2. Swap two adjacent plants to set up bigger groups{"\n"}
        3. Keep going until the board fills up!
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => router.replace("/game")}
        accessibilityLabel="Start playing"
      >
        <Text style={[styles.btnText, { color: colors.onPrimary }]}>
          {"Let's go!"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s8,
    gap: 20,
  },
  heading: { fontFamily: fonts.display, fontWeight: "700", fontSize: 36 },
  body: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 30,
    textAlign: "center",
    maxWidth: 500,
  },
  btn: { borderRadius: radii.md, paddingHorizontal: 32, paddingVertical: 16 },
  btnText: { fontFamily: fonts.display, fontWeight: "700", fontSize: 20 },
});
