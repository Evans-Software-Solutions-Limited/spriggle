import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import {
  getLocalStorageService,
  type LocalLeaderboardEntry,
} from "../src/services/localStorage";

type Scope = "local" | "global";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Leaderboard screen — container.
 * Reads the on-device leaderboard from the local storage service and displays
 * entries sorted by score descending. A Local/Global toggle is offered; the
 * Global view is a placeholder until the backend lands (Task 21). When offline,
 * the Local view is the primary view.
 */
export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [entries, setEntries] = useState<LocalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [scope, setScope] = useState<Scope>("local");

  // Load the local leaderboard once.
  useEffect(() => {
    let mounted = true;
    getLocalStorageService()
      .then((store) => store.getLeaderboard())
      .then((rows) => {
        if (mounted) {
          setEntries(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Track connectivity to toggle between local and global views.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected));
    });
    return () => unsubscribe();
  }, []);

  const renderSegButton = (value: Scope, label: string) => {
    const active = scope === value;
    return (
      <Pressable
        style={[
          styles.segBtn,
          {
            backgroundColor: active ? colors.primary : colors.surface,
            borderColor: colors.surfaceLine,
          },
        ]}
        onPress={() => setScope(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${label} leaderboard`}
      >
        <Text
          style={[
            styles.segLabel,
            { color: active ? colors.onPrimary : colors.ink },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

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
        <View style={styles.seg}>
          {renderSegButton("local", "Local")}
          {renderSegButton("global", "Global")}
        </View>
      </View>

      {/* Body */}
      {scope === "global" ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            {isConnected ? "Global leaderboard coming soon" : "You're offline"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.inkSoft }]}>
            {isConnected
              ? "Worldwide rankings arrive with the next update."
              : "Connect to the internet to see global rankings."}
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            No scores yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.inkSoft }]}>
            Play a game to plant your first score here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {entries.map((entry, i) => (
            <View
              key={entry.id}
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
                  {entry.playerName[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.nameCol}>
                <Text
                  style={[styles.name, { color: colors.ink }]}
                  numberOfLines={1}
                >
                  {entry.playerName}
                </Text>
                <Text style={[styles.date, { color: colors.inkSoft }]}>
                  {formatDate(entry.date)}
                </Text>
              </View>
              <Text style={[styles.score, { color: colors.ink }]}>
                {entry.score.toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
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
  seg: { flexDirection: "row", gap: 8, marginLeft: "auto" },
  segBtn: {
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segLabel: { fontFamily: fonts.ui, fontWeight: "800", fontSize: 13 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 22,
    textAlign: "center",
  },
  emptySub: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
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
  nameCol: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.ui, fontWeight: "800", fontSize: 16 },
  date: { fontFamily: fonts.ui, fontWeight: "700", fontSize: 12 },
  score: { fontFamily: fonts.display, fontWeight: "700", fontSize: 18 },
});
