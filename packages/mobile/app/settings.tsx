import { View, Text } from "react-native";
import { DesignFrame } from "../src/components/layout/DesignFrame";

export default function SettingsScreen() {
  return (
    <DesignFrame>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Settings — Task 15</Text>
      </View>
    </DesignFrame>
  );
}
