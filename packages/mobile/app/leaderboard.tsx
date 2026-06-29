import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "@/theme";

const MOCK_ENTRIES = [
  { name: "Marigold", score: 48230 },
  { name: "Basil_b", score: 41980 },
  { name: "PeaShoot", score: 39110 },
  { name: "Clover22", score: 35400 },
  { name: "Fennel", score: 31220 },
  { name: "DigDug", score: 28760 },
  { name: "Sorrel", score: 25030 },
  { name: "Thyme", score: 22410 },
  { name: "Nettle", score: 19980 },
  { name: "Borage", score: 17640 },
];

/**
 * Leaderboard screen — container.
 * Matches prototype's Screens.leaderboard. Uses mock data for now.
 */
export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
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
          accessibilityLabel="Go back"
        >
          <Text style={{ color: colors.ink, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.ink }]}>Leaderboard</Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {MOCK_ENTRIES.map((entry, i) => (
          <View
            key={entry.name}
            style={[
              styles.row,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
              i === 0 && styles.topRow,
            ]}
          >
            <Text style={[styles.rank, { color: colors.inkSoft }]}>
              {i === 0 ? "🏆" : `${i + 1}`}
            </Text>
            <View
              style={[styles.avatar, { backgroundColor: colors.primary300 }]}
            >
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {entry.name[0]}
              </Text>
            </View>
            <Text style={[styles.name, { color: colors.ink }]}>
              {entry.name}
            </Text>
            <Text style={[styles.score, { color: colors.ink }]}>
              {entry.score.toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.s6, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 32,
  },
  list: { flex: 1 },
  listContent: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s3,
    gap: 12,
  },
  topRow: { borderWidth: 3 },
  rank: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 18,
    width: 36,
    textAlign: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 18,
  },
  name: { fontFamily: fonts.ui, fontWeight: "800", fontSize: 16, flex: 1 },
  score: { fontFamily: fonts.display, fontWeight: "700", fontSize: 18 },
});
