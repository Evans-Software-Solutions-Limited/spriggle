import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "@/theme";

/**
 * Home / Hub screen — container.
 * Matches prototype's Screens.home: two-panel landscape layout.
 * Left: brand + mascot + identity. Right: menu cards grid.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      {/* Left panel: brand + mascot */}
      <View style={styles.leftPanel}>
        <View>
          <Text style={[styles.brand, { color: colors.primary }]}>
            Spriggle
          </Text>
          <Text style={[styles.tagline, { color: colors.inkSoft }]}>
            Dig · Swap · Grow
          </Text>
        </View>
        <View style={styles.mascotArea}>
          {/* Mascot placeholder — will be replaced with actual SVG in later task */}
          <View
            style={[
              styles.mascotPlaceholder,
              { backgroundColor: colors.grass },
            ]}
          />
        </View>
        <View style={styles.identityRow}>
          <View
            style={[
              styles.idChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
          >
            <Text style={[styles.idName, { color: colors.ink }]}>
              Guest gardener
            </Text>
            <Text style={[styles.idSub, { color: colors.inkSoft }]}>
              Tap to sign in
            </Text>
          </View>
        </View>
      </View>

      {/* Right panel: menu cards */}
      <View style={styles.rightPanel}>
        {/* Play Classic — main CTA */}
        <Pressable
          style={[
            styles.menuCard,
            styles.playCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceLine,
            },
          ]}
          onPress={() => router.push("/game")}
          accessibilityRole="button"
          accessibilityLabel="Play Classic"
        >
          <View style={[styles.cardIcon, { backgroundColor: colors.accent }]}>
            <Text style={styles.cardIconText}>▶</Text>
          </View>
          <Text
            style={[styles.cardTitle, styles.playTitle, { color: colors.ink }]}
          >
            Play Classic
          </Text>
          <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
            Endless · chase your best
          </Text>
        </Pressable>

        {/* 2x2 grid of smaller cards */}
        <View style={styles.cardGrid}>
          <Pressable
            style={[
              styles.menuCard,
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Levels"
          >
            <Text style={[styles.badge, { color: colors.accent }]}>Soon</Text>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Levels
            </Text>
            <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
              Campaign & objectives
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.menuCard,
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            onPress={() => router.push("/leaderboard")}
            accessibilityRole="button"
            accessibilityLabel="Leaderboard"
          >
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Leaderboard
            </Text>
            <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
              Where do you rank?
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.menuCard,
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Shop"
          >
            <Text style={[styles.badge, { color: colors.accent }]}>Soon</Text>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>Shop</Text>
            <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
              Coins, power-ups, themes
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.menuCard,
              styles.gridCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Settings
            </Text>
            <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
              Sound, account, more
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    padding: spacing.s8,
    gap: 30,
  },
  leftPanel: {
    flex: 0.38,
    justifyContent: "space-between",
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 58,
  },
  tagline: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 16,
    marginTop: 2,
  },
  mascotArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mascotPlaceholder: {
    width: 160,
    height: 180,
    borderRadius: radii.lg,
    opacity: 0.3,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  idChip: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  idName: {
    fontFamily: fonts.ui,
    fontWeight: "800",
    fontSize: 14,
  },
  idSub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },
  rightPanel: {
    flex: 1,
    gap: 16,
  },
  menuCard: {
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s4,
    justifyContent: "center",
  },
  playCard: {
    flex: 1.3,
    flexDirection: "column",
    gap: 8,
  },
  cardGrid: {
    flex: 1.4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridCard: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardIconText: {
    color: "#fff",
    fontSize: 20,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 18,
  },
  playTitle: {
    fontSize: 30,
  },
  cardSub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
});
