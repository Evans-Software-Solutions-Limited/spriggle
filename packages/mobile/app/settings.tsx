import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import type { ThemeName } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";
import { DesignFrame } from "../src/components/layout/DesignFrame";

const THEMES: { name: ThemeName; label: string; swatch: string }[] = [
  { name: "garden", label: "Garden", swatch: "#6aa64b" },
  { name: "moonlit", label: "Moonlit", swatch: "#5fd3a3" },
];

/** Settings screen — appearance (theme), account, and about. */
export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeName, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <DesignFrame>
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <Text style={{ color: colors.ink, fontSize: 20 }}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.ink }]}>Settings</Text>
        </View>

        <View style={styles.columns}>
          {/* Appearance */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Appearance
            </Text>
            <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
              Theme
            </Text>
            <View style={styles.swatchRow}>
              {THEMES.map((t) => {
                const selected = t.name === themeName;
                return (
                  <Pressable
                    key={t.name}
                    style={[
                      styles.swatch,
                      {
                        borderColor: selected
                          ? colors.primary
                          : colors.surfaceLine,
                        borderWidth: selected ? 3 : 2,
                      },
                    ]}
                    onPress={() => setTheme(t.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.label} theme`}
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[styles.swatchDot, { backgroundColor: t.swatch }]}
                    />
                    <Text style={[styles.swatchLabel, { color: colors.ink }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Account + About */}
          <View style={styles.rightCol}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                Account
              </Text>
              <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
                {user ? `Signed in as ${user.displayName}` : "Playing as guest"}
              </Text>
              {user ? (
                <Pressable
                  style={[styles.rowBtn, { borderColor: colors.surfaceLine }]}
                  onPress={() => signOut()}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                >
                  <Text style={[styles.rowBtnText, { color: colors.ink }]}>
                    Sign out
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.rowBtn, { borderColor: colors.surfaceLine }]}
                  onPress={() => router.push("/signin")}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Text style={[styles.rowBtnText, { color: colors.ink }]}>
                    Sign in
                  </Text>
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                About
              </Text>
              <Text style={[styles.cardSub, { color: colors.inkSoft }]}>
                Coded by Bradley · Graphics by Nicole · Tested by Libby
              </Text>
              <Text style={[styles.version, { color: colors.inkFaint }]}>
                Spriggle v1.0
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DesignFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: spacing.s6,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.display, fontSize: 30 },
  columns: { flexDirection: "row", gap: 16, flex: 1 },
  rightCol: { flex: 1, gap: 16 },
  card: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.s5,
    gap: 8,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 20 },
  cardSub: { fontFamily: fonts.ui, fontSize: 14 },
  swatchRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  swatch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  swatchDot: { width: 22, height: 22, borderRadius: 11 },
  swatchLabel: { fontFamily: fonts.uiExtra, fontSize: 14 },
  rowBtn: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 4,
  },
  rowBtnText: { fontFamily: fonts.uiExtra, fontSize: 14 },
  version: { fontFamily: fonts.ui, fontSize: 12, marginTop: 4 },
});
