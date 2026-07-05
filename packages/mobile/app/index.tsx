import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";

/**
 * Home / Hub screen — container.
 * Matches prototype's Screens.home: landscape two-panel.
 * Left (38%): brand + mascot + identity chip.
 * Right (62%): Play Classic card (primary) + 2×2 grid of menu cards.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const displayName = user?.displayName ?? "Guest gardener";
  const avatarInitial = (displayName.trim()[0] ?? "G").toUpperCase();
  const identitySub = isAuthenticated ? "Signed in" : "Tap to sign in";

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      {/* Left identity panel */}
      <View style={styles.leftPanel}>
        <View style={styles.brandLockup}>
          <Text style={[styles.brand, { color: colors.primary }]}>
            Spriggle
          </Text>
          <Text style={[styles.tagline, { color: colors.accent700 }]}>
            Dig · Swap · Grow
          </Text>
        </View>

        {/* Mascot area */}
        <View style={styles.mascotArea}>
          <View
            style={[styles.mascotShadow, { backgroundColor: colors.grass }]}
          />
        </View>

        {/* Identity + coins */}
        <View style={styles.identityRow}>
          <Pressable
            style={[
              styles.idChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            onPress={() => router.push("/signin")}
            accessibilityRole="button"
            accessibilityLabel={
              isAuthenticated
                ? `Signed in as ${displayName}`
                : "Sign in or continue as guest"
            }
          >
            <View
              style={[styles.avatar, { backgroundColor: colors.primary300 }]}
            >
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {avatarInitial}
              </Text>
            </View>
            <View>
              <Text style={[styles.idName, { color: colors.ink }]}>
                {displayName}
              </Text>
              <Text style={[styles.idSub, { color: colors.inkSoft }]}>
                {identitySub}
              </Text>
            </View>
          </Pressable>
          <View
            style={[
              styles.coinChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
          >
            <View style={styles.coin}>
              <Text style={styles.coinSymbol}>¢</Text>
            </View>
            <Text style={[styles.coinValue, { color: colors.ink }]}>0</Text>
          </View>
        </View>
      </View>

      {/* Right menu panel */}
      <View style={styles.rightPanel}>
        {/* Play Classic — primary card */}
        <Pressable
          style={[
            styles.menuCard,
            styles.playCard,
            {
              backgroundColor: colors.primary,
              borderColor: colors.primary700,
            },
          ]}
          onPress={() => router.push("/game")}
          accessibilityRole="button"
          accessibilityLabel="Play Classic"
        >
          <View style={styles.playContent}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.cardIconText}>▶</Text>
            </View>
            <Text
              style={[
                styles.cardTitle,
                styles.playTitle,
                { color: colors.onPrimary },
              ]}
            >
              Play Classic
            </Text>
            <Text
              style={[
                styles.cardSub,
                { color: colors.onPrimary, opacity: 0.82 },
              ]}
            >
              Endless · chase your best
            </Text>
          </View>
        </Pressable>

        {/* 2×2 grid — using explicit rows for proper iPad layout */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
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
              <View style={styles.badgeWrap}>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: colors.accent, color: colors.onAccent },
                  ]}
                >
                  Soon
                </Text>
              </View>
              <View
                style={[styles.cardIcon, { backgroundColor: colors.paper2 }]}
              >
                <Text style={{ color: colors.primary, fontSize: 18 }}>🗺</Text>
              </View>
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
              <View
                style={[styles.cardIcon, { backgroundColor: colors.paper2 }]}
              >
                <Text style={{ color: colors.goldDeep, fontSize: 18 }}>🏆</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                Leaderboard
              </Text>
              <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
                Where do you rank?
              </Text>
            </Pressable>
          </View>

          <View style={styles.gridRow}>
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
              <View style={styles.badgeWrap}>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: colors.accent, color: colors.onAccent },
                  ]}
                >
                  Soon
                </Text>
              </View>
              <View
                style={[styles.cardIcon, { backgroundColor: colors.paper2 }]}
              >
                <Text style={{ color: colors.accent, fontSize: 18 }}>🛒</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                Shop
              </Text>
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
              <View
                style={[styles.cardIcon, { backgroundColor: colors.paper2 }]}
              >
                <Text style={{ color: colors.inkSoft, fontSize: 18 }}>⚙️</Text>
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    padding: 30,
    gap: 30,
  },
  // Left panel — 38% width
  leftPanel: {
    flex: 0.38,
    justifyContent: "space-between",
  },
  brandLockup: {
    alignItems: "flex-start",
    gap: 2,
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.ui,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  mascotArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 26,
  },
  mascotShadow: {
    width: 230,
    height: 46,
    borderRadius: 115,
    opacity: 0.35,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 14,
  },
  idName: {
    fontFamily: fonts.ui,
    fontWeight: "800",
    fontSize: 13.5,
  },
  idSub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 11.5,
    marginTop: 1,
  },
  coinChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  coin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d9a23c",
    borderWidth: 2,
    borderColor: "#b9842a",
    alignItems: "center",
    justifyContent: "center",
  },
  coinSymbol: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 13,
    color: "#7a5512",
  },
  coinValue: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 20,
  },
  // Right panel — fills remaining space
  rightPanel: {
    flex: 1,
    gap: 16,
  },
  // Cards
  menuCard: {
    borderRadius: radii.lg,
    borderWidth: 2.5,
    padding: 22,
    gap: 6,
  },
  playCard: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    // Raised shadow matching prototype
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
  },
  playContent: {
    flex: 1,
    gap: 6,
  },
  gridContainer: {
    flex: 1.4,
    gap: 16,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  gridCard: {
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  cardIconText: {
    color: "#fff",
    fontSize: 20,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 24,
  },
  playTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  cardSub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 12.5,
  },
  badgeWrap: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  badge: {
    fontFamily: fonts.ui,
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
});
