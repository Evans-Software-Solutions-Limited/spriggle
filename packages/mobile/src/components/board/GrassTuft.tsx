import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { G, Path } from "react-native-svg";

interface GrassTuftProps {
  scale?: number;
  flip?: boolean;
}

/**
 * Decorative grass tuft SVG overlapping the soil patch edges.
 * Matches the prototype's grassTuft() function.
 * Pure presenter — no state.
 */
export function GrassTuft({ scale = 1, flip = false }: GrassTuftProps) {
  return (
    <View
      style={[
        styles.container,
        flip && styles.flipped,
        { width: 64 * scale, height: 44 * scale },
      ]}
      pointerEvents="none"
    >
      <Svg
        viewBox="0 0 64 44"
        width={64 * scale}
        height={44 * scale}
        accessibilityElementsHidden
      >
        <G
          fill="#6aa64b"
          stroke="#4f8033"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <Path d="M18 44 C 10 30 8 18 12 6 C 18 16 20 30 24 44 Z" />
          <Path d="M32 44 C 28 26 28 12 33 2 C 38 14 38 30 38 44 Z" />
          <Path d="M46 44 C 54 30 56 20 52 9 C 46 18 44 30 40 44 Z" />
          <Path
            d="M26 44 C 22 32 22 22 25 14 C 30 24 30 34 31 44 Z"
            fill="#5b8f3e"
          />
          <Path
            d="M40 44 C 44 33 44 24 42 16 C 37 25 36 34 35 44 Z"
            fill="#5b8f3e"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
});
