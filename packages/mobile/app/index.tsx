import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function MainMenu() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 48, fontWeight: "bold", marginBottom: 40 }}>
        Spriggle
      </Text>
      <Pressable onPress={() => router.push("/game")}>
        <Text style={{ fontSize: 24 }}>Play</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/leaderboard")}>
        <Text style={{ fontSize: 24, marginTop: 20 }}>Leaderboard</Text>
      </Pressable>
    </View>
  );
}
